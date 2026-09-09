# Copyright (c) 2026 OmniDimension
# SPDX-License-Identifier: MIT
# Part of https://github.com/Omnidim/examples

"""Onboard one reseller client end to end: create it, fund it, verify it on a
carrier, and buy it a number.

The verification sequence is never hard-coded here. Every carrier in a region
runs different checks, so the steps come from the API: read the first one from
KYC status, submit it, then follow `next_step` until there is nothing left.
The carrier file supplies the answers, not the order.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

E164_PHONE = re.compile(r"^\+[1-9]\d{7,14}$")

# Aadhaar steps are rate limited to roughly one attempt every 30 seconds, and
# a rapid retry can lock the end customer out at the identity authority.
COOLDOWN_SECONDS = 31

# A redirect step hands the customer a link. Polling waits for them to finish
# at the provider, which is a human on a phone, so give it real time.
POLL_SECONDS = 5
POLL_ATTEMPTS = 120


def load_carrier(path: Path) -> dict[str, object]:
    """Read a carrier answer file and check it before anything is sent."""
    carrier = json.loads(path.read_text(encoding="utf-8"))
    for key in ("region", "carrier", "answers"):
        if key not in carrier:
            raise ValueError(f"{path.name} is missing the {key} key.")
    answers = carrier["answers"]
    if not isinstance(answers, dict) or not answers:
        raise ValueError(f"{path.name} needs an answers object with one entry per step.")
    for step, fields in answers.items():
        if not isinstance(fields, dict):
            raise ValueError(f"{path.name}: answers for {step} must be an object.")
    phone = answers.get("register", {}).get("phone")
    if phone and not E164_PHONE.match(str(phone)):
        raise ValueError(
            f"{path.name}: register.phone must be E.164, for example +15551234567."
        )
    return carrier


def plan(carrier: dict[str, object], client_name: str, minutes: int, rate: float) -> list[dict[str, object]]:
    """Every call this example makes, in order, with the body each one sends.

    Printed by a dry run. The KYC part is the order the carrier file declares;
    a live run ignores that and follows `next_step` from the API instead.
    """
    region, name = carrier["region"], carrier["carrier"]
    calls: list[dict[str, object]] = [
        {
            "call": "client.reseller.add_user(...)",
            "endpoint": "POST /reseller/users/add",
            "body": {"name": client_name, "email": f"{client_name.lower().replace(' ', '.')}@example.com"},
        },
        {
            "call": "client.reseller.transfer_credits(...)",
            "endpoint": "POST /reseller/credits/transfer",
            "body": {"to_organization_id": "<from add_user>", "minutes": minutes, "cost_per_min": rate},
        },
        {
            "call": "client.reseller.kyc_status(user_id)",
            "endpoint": "GET /reseller/kyc/status",
            "body": {"user_id": "<from add_user>"},
        },
    ]
    for step, fields in carrier["answers"].items():
        calls.append(
            {
                "call": f"client.reseller.submit_kyc_step({step!r}, ...)",
                "endpoint": f"POST /reseller/kyc/steps/{step}",
                "body": {"user_id": "<from add_user>", "region": region, "carrier": name, **fields},
            }
        )
    calls += [
        {
            "call": "client.phone_number.search(...)",
            "endpoint": "GET /phone_number/search",
            "body": {"region": region, "carrier": name, "user_id": "<from add_user>"},
        },
        {
            "call": "client.phone_number.purchase(...)",
            "endpoint": "POST /phone_number/purchase",
            "body": {
                "region": region,
                "carrier": name,
                "phone_number": "<from search>",
                "user_id": "<from add_user>",
            },
        },
        {
            "call": "client.phone_number.attach(...)",
            "endpoint": "POST /phone_number/attach",
            "body": {"phone_number_id": "<from purchase>", "agent_id": "<your agent>"},
        },
    ]
    return calls


def build_client():
    """The SDK is imported here, not at module load, so a dry run and the
    tests need nothing installed."""
    api_key = os.environ.get("OMNIDIM_API_KEY")
    if not api_key:
        raise ValueError("Set OMNIDIM_API_KEY before using --live.")
    try:
        from omnidimension import Client
    except ImportError as error:  # pragma: no cover - depends on the environment
        raise ValueError("Live mode needs the SDK: pip install -r requirements.txt") from error
    base_url = os.environ.get("OMNIDIM_API_BASE_URL", "https://backend.omnidim.io/api/v1")
    return Client(api_key, base_url=base_url)


def entry_for_carrier(status: dict[str, object], carrier: str) -> dict[str, object]:
    """KYC status carries one entry per carrier, not per region. Match on the
    carrier you are verifying, because a client verified on one carrier of a
    region still has to verify on the other."""
    for entry in status.get("regions", []) or []:
        if entry.get("carrier") == carrier:
            return entry
    raise RuntimeError(f"KYC status returned no entry for {carrier}. Carriers seen: "
                       f"{[e.get('carrier') for e in status.get('regions', []) or []]}")


def answer_for(carrier: dict[str, object], step: str) -> tuple[str, dict[str, object]]:
    """The step to actually run, and the fields it gets.

    `instead_of` is the one real fork in these flows: the API answers
    `verify-gst`, and a client with no GST number runs `skip-gst` instead.
    """
    step = carrier.get("instead_of", {}).get(step, step)
    answers = carrier["answers"]
    if step not in answers:
        raise RuntimeError(
            f"The API asked for step {step!r} and the carrier file has no answers for it. "
            f"Add it, or map it under instead_of."
        )
    return step, dict(answers[step])


def requirements_for(client, carrier: dict[str, object]) -> dict[str, dict[str, object]]:
    """The step list for this carrier, keyed by step name.

    Call this before you build anything: which steps exist, the fields each
    one needs, whether it is rate limited, and the fixed vocabularies all
    come from here, so one integration drives every carrier.
    """
    payload = client.reseller.kyc_requirements(
        carrier["region"], carrier=carrier["carrier"]
    )["json"]
    return {step["step"]: step for step in payload.get("steps", [])}


def run_kyc(client, carrier: dict[str, object], user_id: int) -> None:
    """Read the first step, then follow next_step until there is none."""
    region, name = carrier["region"], carrier["carrier"]
    steps = requirements_for(client, carrier)
    entry = entry_for_carrier(client.reseller.kyc_status(user_id)["json"], name)
    next_step = entry.get("next_step")

    while next_step:
        step, fields = answer_for(carrier, next_step)
        spec = steps.get(step, {})

        # Anything the step requires that the carrier file does not carry is
        # a one-time code the customer just received, so ask for it here and
        # never store it.
        for field in spec.get("required", []):
            if field not in fields:
                fields[field] = input(f"  {step} needs {field}: ").strip()

        response = client.reseller.submit_kyc_step(
            step, user_id, region, carrier=name, **fields
        )["json"]
        print(f"  {step}: {response.get('message', '')}".rstrip())

        if response.get("method") == "redirect":
            # Single use, expires in minutes. Never store it and never serve a
            # stored one: the customer lands on an access-denied page.
            print(f"  send your customer here now: {response['redirect_url']}")
            response = poll(client, carrier, user_id, response["poll_step"])

        if response.get("preview"):
            print(json.dumps(response["preview"], indent=2))

        if spec.get("cooldown"):
            # A failed verify can burn the reference and a rapid retry trips
            # the per-Aadhaar limit, which locks the customer out for good.
            time.sleep(COOLDOWN_SECONDS)

        next_step = response.get("next_step")

    final = entry_for_carrier(client.reseller.kyc_status(user_id)["json"], name)
    if not final.get("can_purchase"):
        # Every step is done and the carrier is reviewing on its own clock.
        raise RuntimeError(
            f"Verification submitted, review_status={final.get('review_status')}. "
            "Poll KYC status rather than resubmitting."
        )


def poll(client, carrier: dict[str, object], user_id: int, step: str) -> dict[str, object]:
    """Call the poll step until it stops answering itself."""
    region, name = carrier["region"], carrier["carrier"]
    for _ in range(POLL_ATTEMPTS):
        time.sleep(POLL_SECONDS)
        response = client.reseller.submit_kyc_step(step, user_id, region, carrier=name)["json"]
        if response.get("next_step") != step:
            return response
        print("  still waiting for the customer to finish at the provider")
    raise RuntimeError(
        f"{step} never moved on. Run the redirect step again for a fresh link, "
        "and do not re-serve the old one."
    )


def onboard(carrier: dict[str, object], client_name: str, minutes: int, rate: float,
            user_id: int | None, agent_id: int | None) -> None:
    client = build_client()
    region, name = carrier["region"], carrier["carrier"]

    if user_id is None:
        created = client.reseller.add_user(
            name=client_name,
            email=f"{client_name.lower().replace(' ', '.')}@example.com",
            phone=carrier["answers"].get("register", {}).get("phone", "+15551234567"),
            password=os.environ["OMNIDIM_CLIENT_PASSWORD"],
        )["json"]
        user_id = created["user_id"]
        print(f"client {user_id} created")
        client.reseller.transfer_credits(
            to_organization_id=created["organization_id"], minutes=minutes, cost_per_min=rate
        )
        print(f"funded with {minutes} minutes at {rate} per minute")

    print(f"verifying {user_id} on {name}")
    run_kyc(client, carrier, user_id)
    print("verified")

    found = client.phone_number.search(region, carrier=name, user_id=user_id)["json"]
    if not found.get("numbers"):
        raise RuntimeError(f"{name} has no numbers in stock right now.")
    number = found["numbers"][0]["phone_number"]
    print(f"buying {number} from {found['carrier']} at {found['numbers'][0]['monthly_rental_usd']} USD")

    bought = client.phone_number.purchase(region, number, user_id=user_id, carrier=name)["json"]
    print(f"bought, phone_number_id {bought.get('phone_number_id')}")

    if agent_id:
        client.phone_number.attach(bought["phone_number_id"], agent_id)
        print(f"attached to agent {agent_id}")


def main(arguments: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("carrier_file", type=Path, help="a file from ../carriers")
    parser.add_argument("--live", action="store_true", help="actually call the API")
    parser.add_argument("--client-name", default="Demo User")
    parser.add_argument("--minutes", type=int, default=100)
    parser.add_argument("--rate", type=float, default=0.20, help="what you sell a minute for")
    parser.add_argument("--user-id", type=int, help="verify an existing client instead of creating one")
    parser.add_argument("--agent-id", type=int, help="attach the number to this agent")
    options = parser.parse_args(arguments)

    carrier = load_carrier(options.carrier_file)
    calls = plan(carrier, options.client_name, options.minutes, options.rate)
    print(
        json.dumps(
            {
                "mode": "live" if options.live else "dry-run",
                "region": carrier["region"],
                "carrier": carrier["carrier"],
                "stocks": carrier.get("stocks", ""),
                "calls": calls,
            },
            indent=2,
        )
    )
    if options.live:
        onboard(carrier, options.client_name, options.minutes, options.rate,
                options.user_id, options.agent_id)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, RuntimeError, KeyError) as error:
        print(error, file=sys.stderr)
        raise SystemExit(1) from error
