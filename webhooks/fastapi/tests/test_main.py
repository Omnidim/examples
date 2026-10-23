# Copyright (c) 2026 OmniDimension
# SPDX-License-Identifier: MIT
# Part of https://github.com/Omnidim/examples

import json
import os
import sys
from pathlib import Path

# Ensure local module is importable
sys.path.insert(0, str(Path(__file__).parents[1]))

import pytest
from fastapi.testclient import TestClient
from main import PostCallEvent, app, event_summary, forward

FIXTURE_PATH = Path(__file__).parents[2] / "fixtures" / "post-call.json"
FIXTURE = json.loads(FIXTURE_PATH.read_text())

client = TestClient(app)


def test_healthz():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_parses_the_documented_fixture():
    response = client.post("/webhooks/omnidimension", json=FIXTURE)
    assert response.status_code == 202
    assert response.json() == {"accepted": True, "callId": 24877}

    event = PostCallEvent.model_validate(FIXTURE)
    summary = event_summary(event)
    assert summary["extractedVariables"]["name"] == "Ravi"
    assert summary["agent"] == "Appointment assistant"


def test_rejects_missing_required_fields():
    response = client.post("/webhooks/omnidimension", json={"bot_name": "Agent"})
    assert response.status_code == 422


def test_rejects_boolean_call_identifiers():
    for field in ("call_id", "bot_id"):
        for invalid_val in ("not-an-int", True, False, 123.45):
            payload = {**FIXTURE, field: invalid_val}
            response = client.post("/webhooks/omnidimension", json=payload)
            assert response.status_code == 422


def test_rejects_non_public_forwarding_targets():
    original = os.environ.get("FORWARD_URL")
    original_allowed_hosts = os.environ.get("FORWARD_URL_ALLOWED_HOSTS")
    try:
        os.environ["FORWARD_URL"] = "https://127.0.0.1/internal"
        os.environ["FORWARD_URL_ALLOWED_HOSTS"] = "hooks.example.com"
        event = PostCallEvent.model_validate(FIXTURE)
        with pytest.raises(ValueError, match="FORWARD_URL_ALLOWED_HOSTS"):
            forward(event)
    finally:
        if original is None:
            os.environ.pop("FORWARD_URL", None)
        else:
            os.environ["FORWARD_URL"] = original
        if original_allowed_hosts is None:
            os.environ.pop("FORWARD_URL_ALLOWED_HOSTS", None)
        else:
            os.environ["FORWARD_URL_ALLOWED_HOSTS"] = original_allowed_hosts
