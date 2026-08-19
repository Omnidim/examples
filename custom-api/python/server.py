# Copyright (c) 2026 OmniDimension
# SPDX-License-Identifier: MIT
# Part of https://github.com/Omnidim/examples

"""Fixture REST API for OmniDimension Custom API integrations."""

import json
import os
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlparse

CUSTOMERS = {
    "+15551234567": {"name": "Ravi Shah", "accountStatus": "active", "renewalDate": "2026-12-01"},
    "+15557654321": {"name": "Maya Chen", "accountStatus": "past_due", "renewalDate": "2026-08-31"},
}
AVAILABILITY = {"2026-09-04": ["2026-09-04T10:00:00Z", "2026-09-04T14:30:00Z"]}


def reserve_appointment(customer_phone: str, time_slot: str) -> dict | None:
    """Reserve a fixture slot and return its confirmation."""
    date = time_slot[:10]
    slots = AVAILABILITY.get(date, [])
    if customer_phone not in CUSTOMERS or time_slot not in slots:
        return None
    slots.remove(time_slot)
    return {"confirmationId": f"apt_{time_slot.replace(':', '').replace('-', '')}", "customerPhone": customer_phone, "timeSlot": time_slot}


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status: HTTPStatus, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path == "/healthz":
            self.send_json(HTTPStatus.OK, {"ok": True})
            return
        if parsed.path.startswith("/v1/customers/"):
            customer = CUSTOMERS.get(unquote(parsed.path.removeprefix("/v1/customers/")))
            self.send_json(HTTPStatus.OK if customer else HTTPStatus.NOT_FOUND, customer or {"error": "customer_not_found"})
            return
        if parsed.path == "/v1/availability":
            date = parse_qs(parsed.query).get("date", [None])[0]
            if not date or len(date) != 10:
                self.send_json(HTTPStatus.BAD_REQUEST, {"error": "date_must_use_yyyy_mm_dd"})
                return
            self.send_json(HTTPStatus.OK, {"date": date, "availableSlots": AVAILABILITY.get(date, [])})
            return
        self.send_json(HTTPStatus.NOT_FOUND, {"error": "not_found"})

    def do_POST(self) -> None:  # noqa: N802
        if urlparse(self.path).path != "/v1/appointments":
            self.send_json(HTTPStatus.NOT_FOUND, {"error": "not_found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length))
            customer_phone, time_slot = payload["customerPhone"], payload["timeSlot"]
        except (KeyError, TypeError, ValueError, json.JSONDecodeError):
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "customerPhone_and_timeSlot_are_required"})
            return
        appointment = reserve_appointment(customer_phone, time_slot)
        self.send_json(HTTPStatus.CREATED if appointment else HTTPStatus.CONFLICT, appointment or {"error": "customer_or_slot_not_available"})

    def log_message(self, _format: str, *_args: object) -> None:
        return


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8787"))
    print(f"Fixture API listening on http://localhost:{port}")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
