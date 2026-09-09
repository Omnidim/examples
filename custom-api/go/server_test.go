// Copyright (c) 2026 OmniDimension
// SPDX-License-Identifier: MIT
// Part of https://github.com/Omnidim/examples

package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func resetAvailability() {
	availability = map[string][]string{
		"2026-09-04": {
			"2026-09-04T10:00:00Z",
			"2026-09-04T14:30:00Z",
		},
	}
}

func decodeJSON(t *testing.T, recorder *httptest.ResponseRecorder) map[string]any {
	t.Helper()

	var payload map[string]any
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("failed to decode JSON response: %v", err)
	}

	return payload
}

func TestAPI(t *testing.T) {
	tests := []struct {
		name       string
		method     string
		path       string
		body       string
		wantStatus int
		wantBody   map[string]any
	}{
		{
			name:       "health check",
			method:     http.MethodGet,
			path:       "/healthz",
			wantStatus: http.StatusOK,
			wantBody: map[string]any{
				"ok": true,
			},
		},
		{
			name:       "known customer",
			method:     http.MethodGet,
			path:       "/v1/customers/+15551234567",
			wantStatus: http.StatusOK,
			wantBody: map[string]any{
				"name":          "Ravi Shah",
				"accountStatus": "active",
				"renewalDate":   "2026-12-01",
			},
		},
		{
			name:       "unknown customer",
			method:     http.MethodGet,
			path:       "/v1/customers/+15550000000",
			wantStatus: http.StatusNotFound,
			wantBody: map[string]any{
				"error": "customer_not_found",
			},
		},
		{
			name:       "availability for valid date",
			method:     http.MethodGet,
			path:       "/v1/availability?date=2026-09-04",
			wantStatus: http.StatusOK,
			wantBody: map[string]any{
				"date": "2026-09-04",
				"availableSlots": []any{
					"2026-09-04T10:00:00Z",
					"2026-09-04T14:30:00Z",
				},
			},
		},
		{
			name:       "availability for unknown date",
			method:     http.MethodGet,
			path:       "/v1/availability?date=2026-09-05",
			wantStatus: http.StatusOK,
			wantBody: map[string]any{
				"date":           "2026-09-05",
				"availableSlots": []any{},
			},
		},
		{
			name:       "availability without date",
			method:     http.MethodGet,
			path:       "/v1/availability",
			wantStatus: http.StatusBadRequest,
			wantBody: map[string]any{
				"error": "date_must_use_yyyy_mm_dd",
			},
		},
		{
			name:       "availability with invalid date length",
			method:     http.MethodGet,
			path:       "/v1/availability?date=2026-09",
			wantStatus: http.StatusBadRequest,
			wantBody: map[string]any{
				"error": "date_must_use_yyyy_mm_dd",
			},
		},
		{
			name:       "invalid appointment payload",
			method:     http.MethodPost,
			path:       "/v1/appointments",
			body:       `{}`,
			wantStatus: http.StatusBadRequest,
			wantBody: map[string]any{
				"error": "customerPhone_and_timeSlot_are_required",
			},
		},
		{
			name:       "invalid JSON appointment payload",
			method:     http.MethodPost,
			path:       "/v1/appointments",
			body:       `{invalid json}`,
			wantStatus: http.StatusBadRequest,
			wantBody: map[string]any{
				"error": "customerPhone_and_timeSlot_are_required",
			},
		},
		{
			name:   "appointment for unknown customer",
			method: http.MethodPost,
			path:   "/v1/appointments",
			body: `{
				"customerPhone": "+15550000000",
				"timeSlot": "2026-09-04T10:00:00Z"
			}`,
			wantStatus: http.StatusConflict,
			wantBody: map[string]any{
				"error": "customer_or_slot_not_available",
			},
		},
		{
			name:   "appointment for unavailable slot",
			method: http.MethodPost,
			path:   "/v1/appointments",
			body: `{
				"customerPhone": "+15551234567",
				"timeSlot": "2026-09-04T12:00:00Z"
			}`,
			wantStatus: http.StatusConflict,
			wantBody: map[string]any{
				"error": "customer_or_slot_not_available",
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			resetAvailability()

			var body *strings.Reader
			if test.body != "" {
				body = strings.NewReader(test.body)
			} else {
				body = strings.NewReader("")
			}

			request := httptest.NewRequest(test.method, test.path, body)
			recorder := httptest.NewRecorder()

			newServer().ServeHTTP(recorder, request)

			if recorder.Code != test.wantStatus {
				t.Fatalf(
					"expected status %d, got %d",
					test.wantStatus,
					recorder.Code,
				)
			}

			gotBody := decodeJSON(t, recorder)

			gotJSON, err := json.Marshal(gotBody)
			if err != nil {
				t.Fatalf("failed to encode response JSON: %v", err)
			}

			wantJSON, err := json.Marshal(test.wantBody)
			if err != nil {
				t.Fatalf("failed to encode expected JSON: %v", err)
			}

			if string(gotJSON) != string(wantJSON) {
				t.Errorf(
					"unexpected response body\nwant: %s\ngot:  %s",
					wantJSON,
					gotJSON,
				)
			}
		})
	}
}

func TestReserveAppointment(t *testing.T) {
	tests := []struct {
		name          string
		customerPhone string
		timeSlot      string
		wantSuccess   bool
	}{
		{
			name:          "reserves available slot",
			customerPhone: "+15551234567",
			timeSlot:      "2026-09-04T10:00:00Z",
			wantSuccess:   true,
		},
		{
			name:          "rejects unknown customer",
			customerPhone: "+15550000000",
			timeSlot:      "2026-09-04T14:30:00Z",
			wantSuccess:   false,
		},
		{
			name:          "rejects unavailable slot",
			customerPhone: "+15551234567",
			timeSlot:      "2026-09-04T12:00:00Z",
			wantSuccess:   false,
		},
		{
			name:          "rejects short time slot",
			customerPhone: "+15551234567",
			timeSlot:      "2026",
			wantSuccess:   false,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			resetAvailability()

			appointment := reserveAppointment(
				test.customerPhone,
				test.timeSlot,
			)

			if test.wantSuccess && appointment == nil {
				t.Fatal("expected appointment, got nil")
			}

			if !test.wantSuccess && appointment != nil {
				t.Fatal("expected nil appointment")
			}
		})
	}
}

func TestReserveAppointmentRemovesSlot(t *testing.T) {
	resetAvailability()

	slot := availability["2026-09-04"][0]

	first := reserveAppointment("+15551234567", slot)
	if first == nil {
		t.Fatal("expected first reservation to succeed")
	}

	second := reserveAppointment("+15551234567", slot)
	if second != nil {
		t.Fatal("expected second reservation for the same slot to fail")
	}
}
