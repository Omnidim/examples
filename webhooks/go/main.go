// Copyright (c) 2026 OmniDimension
// SPDX-License-Identifier: MIT
// Part of https://github.com/Omnidim/examples

package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

var errForwarding = errors.New("post-call forwarding failed")

var requiredStringFields = []string{"bot_name", "phone_number", "call_date", "user_email"}

func validPostCallEvent(event map[string]any) bool {
	for _, key := range []string{"call_id", "bot_id"} {
		value, ok := event[key].(float64)
		if !ok || math.Trunc(value) != value {
			return false
		}
	}
	for _, key := range requiredStringFields {
		if _, ok := event[key].(string); !ok {
			return false
		}
	}
	if report, present := event["call_report"]; present && report != nil {
		if _, ok := report.(map[string]any); !ok {
			return false
		}
	}
	return true
}

func allowedForwardURL(rawURL string) (*url.URL, error) {
	target, err := url.Parse(rawURL)
	if err != nil || target.Scheme != "https" || target.Hostname() == "" {
		return nil, errForwarding
	}
	for _, host := range strings.Split(os.Getenv("FORWARD_URL_ALLOWED_HOSTS"), ",") {
		if strings.EqualFold(strings.TrimSpace(host), target.Hostname()) {
			return target, nil
		}
	}
	return nil, errForwarding
}

func forwardEvent(event map[string]any) error {
	rawURL := os.Getenv("FORWARD_URL")
	if rawURL == "" {
		return nil
	}
	target, err := allowedForwardURL(rawURL)
	if err != nil {
		return err
	}
	payload, err := json.Marshal(event)
	if err != nil {
		return errForwarding
	}
	request, err := http.NewRequest(http.MethodPost, target.String(), strings.NewReader(string(payload)))
	if err != nil {
		return errForwarding
	}
	request.Header.Set("Content-Type", "application/json")
	response, err := (&http.Client{Timeout: 10 * time.Second}).Do(request)
	if err != nil {
		return errForwarding
	}
	defer response.Body.Close()
	_, _ = io.Copy(io.Discard, response.Body)
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return errForwarding
	}
	return nil
}

func writeJSON(writer http.ResponseWriter, status int, payload map[string]any) {
	writer.Header().Set("Content-Type", "application/json; charset=utf-8")
	writer.WriteHeader(status)
	_ = json.NewEncoder(writer).Encode(payload)
}

func newHandler(forward func(map[string]any) error) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.Method == http.MethodGet && request.URL.Path == "/healthz" {
			writeJSON(writer, http.StatusOK, map[string]any{"ok": true})
			return
		}
		if request.Method != http.MethodPost || request.URL.Path != "/webhooks/omnidimension" {
			writeJSON(writer, http.StatusNotFound, map[string]any{"error": "not_found"})
			return
		}
		defer request.Body.Close()
		var event map[string]any
		if err := json.NewDecoder(request.Body).Decode(&event); err != nil || !validPostCallEvent(event) {
			writeJSON(writer, http.StatusBadRequest, map[string]any{"error": "invalid_post_call_payload"})
			return
		}
		if err := forward(event); err != nil {
			log.Printf("post-call forwarding failed: %v", err)
			writeJSON(writer, http.StatusBadGateway, map[string]any{"error": "post_call_processing_failed"})
			return
		}
		writeJSON(writer, http.StatusAccepted, map[string]any{"accepted": true, "callId": event["call_id"]})
	})
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8788"
	}
	address := "127.0.0.1:" + port
	fmt.Printf("Webhook receiver listening on http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(address, newHandler(forwardEvent)))
}
