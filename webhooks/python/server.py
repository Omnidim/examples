# Copyright (c) 2026 OmniDimension
# SPDX-License-Identifier: MIT
# Part of https://github.com/Omnidim/examples

"""Receive OmniDimension post-call webhooks using only the standard library."""

import json
import os
from http import HTTPStatus
from http.client import HTTPSConnection
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

REQUIRED_STRING_FIELDS = ("bot_name", "phone_number", "call_date", "user_email")


def parse_post_call_event(value: object) -> dict | None:
    """Validate the documented post-call payload fields needed by this example."""
    if not isinstance(value, dict):
        return None
    if not isinstance(value.get("call_id"), int) or not isinstance(value.get("bot_id"), int):
        return None
    if any(not isinstance(value.get(field), str) for field in REQUIRED_STRING_FIELDS):
        return None
    report = value.get("call_report")
    return value if report is None or isinstance(report, dict) else None


def event_summary(event: dict) -> dict:
    report = event.get("call_report") or {}
    return {
        "callId": event["call_id"],
        "agent": event["bot_name"],
        "phoneNumber": event["phone_number"],
        "callDate": event["call_date"],
        "sentiment": report.get("sentiment"),
        "extractedVariables": report.get("extracted_variables", {}),
    }


def forward(event: dict) -> None:
    target = os.getenv("FORWARD_URL")
    if not target:
        return
    parsed = urlparse(target)
    hostname = (parsed.hostname or "").lower()
    allowed_hosts = {host.strip().lower() for host in os.getenv("FORWARD_URL_ALLOWED_HOSTS", "").split(",") if host.strip()}
    if parsed.scheme != "https" or hostname not in allowed_hosts:
        raise ValueError("FORWARD_URL must use HTTPS and a host listed in FORWARD_URL_ALLOWED_HOSTS")
    connection = HTTPSConnection(parsed.hostname, parsed.port or 443, timeout=10)
    path = parsed.path or "/"
    if parsed.query:
        path = f"{path}?{parsed.query}"
    connection.request("POST", path, body=json.dumps(event), headers={"Content-Type": "application/json"})
    response = connection.getresponse()
    response.read()
    if not 200 <= response.status < 300:
        raise RuntimeError(f"Forwarding failed with {response.status}")


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status: HTTPStatus, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        self.send_json(HTTPStatus.OK, {"ok": True}) if self.path == "/healthz" else self.send_json(HTTPStatus.NOT_FOUND, {"error": "not_found"})

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/webhooks/omnidimension":
            self.send_json(HTTPStatus.NOT_FOUND, {"error": "not_found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            event = parse_post_call_event(json.loads(self.rfile.read(length)))
        except (ValueError, json.JSONDecodeError):
            event = None
        if not event:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_post_call_payload"})
            return
        try:
            print(json.dumps({"event": "post_call_received", **event_summary(event)}))
            forward(event)
        except (OSError, RuntimeError, ValueError) as error:
            print(str(error))
            self.send_json(HTTPStatus.BAD_GATEWAY, {"error": "post_call_processing_failed"})
            return
        self.send_json(HTTPStatus.ACCEPTED, {"accepted": True, "callId": event["call_id"]})

    def log_message(self, _format: str, *_args: object) -> None:
        return


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8788"))
    print(f"Webhook receiver listening on http://localhost:{port}")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
