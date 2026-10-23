// Copyright (c) 2026 OmniDimension
// SPDX-License-Identifier: MIT
// Part of https://github.com/Omnidim/examples

package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestWebhookRoutes(t *testing.T) {
	validPayload := []byte(`{"call_id":123,"bot_id":456,"bot_name":"Support","phone_number":"+15551234567","call_date":"2026-01-01T12:00:00Z","user_email":"person@example.com","call_report":{"sentiment":"positive"}}`)
	tests := []struct {
		name   string
		method string
		path   string
		body   []byte
		want   int
		result map[string]any
	}{
		{"health check", http.MethodGet, "/healthz", nil, http.StatusOK, map[string]any{"ok": true}},
		{"unknown route", http.MethodGet, "/missing", nil, http.StatusNotFound, map[string]any{"error": "not_found"}},
		{"valid post call", http.MethodPost, "/webhooks/omnidimension", validPayload, http.StatusAccepted, map[string]any{"accepted": true, "callId": float64(123)}},
		{"string call id", http.MethodPost, "/webhooks/omnidimension", bytes.Replace(validPayload, []byte(`123`), []byte(`"123"`), 1), http.StatusBadRequest, map[string]any{"error": "invalid_post_call_payload"}},
		{"invalid report", http.MethodPost, "/webhooks/omnidimension", bytes.Replace(validPayload, []byte(`{"sentiment":"positive"}`), []byte(`[]`), 1), http.StatusBadRequest, map[string]any{"error": "invalid_post_call_payload"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			request := httptest.NewRequest(tt.method, tt.path, bytes.NewReader(tt.body))
			newHandler(func(map[string]any) error { return nil }).ServeHTTP(recorder, request)
			if recorder.Code != tt.want {
				t.Fatalf("status = %d, want %d; body = %s", recorder.Code, tt.want, recorder.Body.String())
			}
			var result map[string]any
			if err := json.Unmarshal(recorder.Body.Bytes(), &result); err != nil {
				t.Fatal(err)
			}
			for key, want := range tt.result {
				if got := result[key]; got != want {
					t.Errorf("result[%q] = %#v, want %#v", key, got, want)
				}
			}
		})
	}
}

func TestForwardingFailureReturnsBadGateway(t *testing.T) {
	payload := []byte(`{"call_id":123,"bot_id":456,"bot_name":"Support","phone_number":"+15551234567","call_date":"2026-01-01T12:00:00Z","user_email":"person@example.com"}`)
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/webhooks/omnidimension", bytes.NewReader(payload))
	newHandler(func(map[string]any) error { return errForwarding }).ServeHTTP(recorder, request)
	if recorder.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadGateway)
	}
}

func TestAllowedForwardURL(t *testing.T) {
	t.Setenv("FORWARD_URL_ALLOWED_HOSTS", "hooks.example.test, api.example.test")
	for _, tt := range []struct {
		name string
		url  string
		want bool
	}{
		{"allowed HTTPS host", "https://hooks.example.test/events?source=webhook", true},
		{"HTTP is refused", "http://hooks.example.test/events", false},
		{"unlisted host is refused", "https://elsewhere.example.test/events", false},
	} {
		t.Run(tt.name, func(t *testing.T) {
			_, err := allowedForwardURL(tt.url)
			if (err == nil) != tt.want {
				t.Fatalf("allowedForwardURL(%q) error = %v, want allowed = %t", tt.url, err, tt.want)
			}
		})
	}
}

func TestEventSummary(t *testing.T) {
	event := map[string]any{"call_id": 123.0, "bot_name": "Agent", "phone_number": "+15550100", "call_date": "2026-09-09"}
	got, _ := json.Marshal(eventSummary(event))
	want := `{"agent":"Agent","callDate":"2026-09-09","callId":123,"extractedVariables":{},"phoneNumber":"+15550100","sentiment":null}`
	if string(got) != want {
		t.Fatalf("no report: got %s, want %s", got, want)
	}

	event["call_report"] = map[string]any{"sentiment": "positive", "extracted_variables": map[string]any{"name": "Ravi"}}
	got, _ = json.Marshal(eventSummary(event))
	want = `{"agent":"Agent","callDate":"2026-09-09","callId":123,"extractedVariables":{"name":"Ravi"},"phoneNumber":"+15550100","sentiment":"positive"}`
	if string(got) != want {
		t.Fatalf("with report: got %s, want %s", got, want)
	}
}
