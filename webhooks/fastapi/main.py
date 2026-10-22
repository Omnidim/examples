# Copyright (c) 2026 OmniDimension
# SPDX-License-Identifier: MIT
# Part of https://github.com/Omnidim/examples

"""Receive OmniDimension post-call webhooks using FastAPI with Pydantic validation."""

from __future__ import annotations

import os
from http.client import HTTPSConnection
from typing import Any
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field


class CallReport(BaseModel):
    sentiment: str | None = None
    extracted_variables: dict[str, Any] = Field(default_factory=dict)
    summary: str | None = None
    transcript: list[dict[str, Any]] | None = None


class PostCallEvent(BaseModel):
    call_id: int
    bot_id: int
    bot_name: str
    phone_number: str
    call_date: str
    user_email: str
    call_report: CallReport | None = None


def event_summary(event: PostCallEvent) -> dict[str, Any]:
    report = event.call_report
    return {
        "callId": event.call_id,
        "agent": event.bot_name,
        "phoneNumber": event.phone_number,
        "callDate": event.call_date,
        "sentiment": report.sentiment if report else None,
        "extractedVariables": report.extracted_variables if report else {},
    }


def forward(event: PostCallEvent) -> None:
    target = os.getenv("FORWARD_URL")
    if not target:
        return
    parsed = urlparse(target)
    hostname = (parsed.hostname or "").lower()
    allowed_hosts = {
        host.strip().lower()
        for host in os.getenv("FORWARD_URL_ALLOWED_HOSTS", "").split(",")
        if host.strip()
    }
    if parsed.scheme != "https" or hostname not in allowed_hosts:
        raise ValueError(
            "FORWARD_URL must use HTTPS and a host listed in FORWARD_URL_ALLOWED_HOSTS"
        )
    connection = HTTPSConnection(parsed.hostname, parsed.port or 443, timeout=10)
    path = parsed.path or "/"
    if parsed.query:
        path = f"{path}?{parsed.query}"
    connection.request(
        "POST",
        path,
        body=event.model_dump_json(),
        headers={"Content-Type": "application/json"},
    )
    response = connection.getresponse()
    response.read()
    if not 200 <= response.status < 300:
        raise RuntimeError(f"Forwarding failed with {response.status}")


app = FastAPI(title="OmniDimension Post-Call Webhook Receiver")


@app.get("/healthz")
def healthz() -> dict[str, bool]:
    return {"ok": True}


@app.post(
    "/webhooks/omnidimension",
    status_code=status.HTTP_202_ACCEPTED,
)
def handle_webhook(event: PostCallEvent) -> dict[str, Any]:
    try:
        forward(event)
    except (OSError, RuntimeError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="post_call_processing_failed",
        ) from error
    return {"accepted": True, "callId": event.call_id}
