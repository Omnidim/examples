// Copyright (c) 2026 OmniDimension
// SPDX-License-Identifier: MIT
// Part of https://github.com/Omnidim/examples

package main

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"sync"
)

type Customer struct {
	Name          string `json:"name"`
	AccountStatus string `json:"accountStatus"`
	RenewalDate   string `json:"renewalDate"`
}

type AppointmentRequest struct {
	CustomerPhone string `json:"customerPhone"`
	TimeSlot      string `json:"timeSlot"`
}

type Appointment struct {
	ConfirmationID string `json:"confirmationId"`
	CustomerPhone  string `json:"customerPhone"`
	TimeSlot       string `json:"timeSlot"`
}

var customers = map[string]Customer{
	"+15551234567": {
		Name:          "Ravi Shah",
		AccountStatus: "active",
		RenewalDate:   "2026-12-01",
	},
	"+15557654321": {
		Name:          "Maya Chen",
		AccountStatus: "past_due",
		RenewalDate:   "2026-08-31",
	},
}

var availability = map[string][]string{
	"2026-09-04": {
		"2026-09-04T10:00:00Z",
		"2026-09-04T14:30:00Z",
	},
}

var availabilityMu sync.Mutex

func sendJSON(w http.ResponseWriter, status int, payload any) {
	body, err := json.Marshal(payload)
	if err != nil {
		http.Error(w, `{"error":"internal_server_error"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_, _ = w.Write(body)
}

func reserveAppointment(customerPhone string, timeSlot string) *Appointment {
	if len(timeSlot) < 10 {
		return nil
	}

	date := timeSlot[:10]

	availabilityMu.Lock()
	defer availabilityMu.Unlock()

	slots := availability[date]

	if _, ok := customers[customerPhone]; !ok {
		return nil
	}

	slotIndex := -1
	for i, slot := range slots {
		if slot == timeSlot {
			slotIndex = i
			break
		}
	}

	if slotIndex == -1 {
		return nil
	}

	availability[date] = append(slots[:slotIndex], slots[slotIndex+1:]...)

	return &Appointment{
		ConfirmationID: "apt_" + strings.NewReplacer(":", "", "-", "").Replace(timeSlot),
		CustomerPhone:  customerPhone,
		TimeSlot:       timeSlot,
	}
}

func healthzHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		sendJSON(w, http.StatusNotFound, map[string]string{
			"error": "not_found",
		})
		return
	}

	sendJSON(w, http.StatusOK, map[string]bool{
		"ok": true,
	})
}

func customerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		sendJSON(w, http.StatusNotFound, map[string]string{
			"error": "not_found",
		})
		return
	}

	const prefix = "/v1/customers/"
	phone := strings.TrimPrefix(r.URL.Path, prefix)

	customer, ok := customers[phone]
	if !ok {
		sendJSON(w, http.StatusNotFound, map[string]string{
			"error": "customer_not_found",
		})
		return
	}

	sendJSON(w, http.StatusOK, customer)
}

func availabilityHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		sendJSON(w, http.StatusNotFound, map[string]string{
			"error": "not_found",
		})
		return
	}

	date := r.URL.Query().Get("date")

	if date == "" || len(date) != 10 {
		sendJSON(w, http.StatusBadRequest, map[string]string{
			"error": "date_must_use_yyyy_mm_dd",
		})
		return
	}

	availabilityMu.Lock()
	slots := availability[date]

	if slots == nil {
		slots = []string{}
	} else {
		slots = append([]string(nil), slots...)
	}
	availabilityMu.Unlock()

	sendJSON(w, http.StatusOK, map[string]any{
		"date":           date,
		"availableSlots": slots,
	})
}

func appointmentsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendJSON(w, http.StatusNotFound, map[string]string{
			"error": "not_found",
		})
		return
	}

	var payload AppointmentRequest

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil ||
		payload.CustomerPhone == "" ||
		payload.TimeSlot == "" {
		sendJSON(w, http.StatusBadRequest, map[string]string{
			"error": "customerPhone_and_timeSlot_are_required",
		})
		return
	}

	appointment := reserveAppointment(
		payload.CustomerPhone,
		payload.TimeSlot,
	)

	if appointment == nil {
		sendJSON(w, http.StatusConflict, map[string]string{
			"error": "customer_or_slot_not_available",
		})
		return
	}

	sendJSON(w, http.StatusCreated, appointment)
}

func notFoundHandler(w http.ResponseWriter, r *http.Request) {
	sendJSON(w, http.StatusNotFound, map[string]string{
		"error": "not_found",
	})
}

func newServer() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/healthz", healthzHandler)
	mux.HandleFunc("/v1/customers/", customerHandler)
	mux.HandleFunc("/v1/availability", availabilityHandler)
	mux.HandleFunc("/v1/appointments", appointmentsHandler)
	mux.HandleFunc("/", notFoundHandler)
	return mux
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8787"
	}

	server := &http.Server{
		Addr:    "127.0.0.1:" + port,
		Handler: newServer(),
	}

	println("Fixture API listening on http://localhost:" + port)

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		panic(err)
	}
}
