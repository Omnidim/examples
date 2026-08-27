# Copyright (c) 2026 OmniDimension
# SPDX-License-Identifier: MIT
# Part of https://github.com/Omnidim/examples

"""Drive a bulk-call campaign through its whole lifecycle from the command line.

Each subcommand maps to one API call. Without --live it prints the exact
request it would send, so you can read the payloads before anything dials.

    create        build the campaign (as a draft, with rotation and filters)
    add-contacts  feed it a CSV in batches of up to 1000 contacts
    start         launch a draft
    status        watch it run
    concurrency   change how many calls dial at once, mid-run
    results       read per-contact outcomes, following the cursor
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

E164_PHONE = re.compile(r"^\+[1-9]\d{7,14}$")
CONTACTS_PER_REQUEST = 1000  # the API caps one add-contacts request at 1000 rows


def parse_contacts(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        if "phone_number" not in (reader.fieldnames or []):
            raise ValueError("CSV must include a phone_number column.")
        contacts = list(reader)

    for row_number, contact in enumerate(contacts, start=2):
        if not E164_PHONE.match(contact.get("phone_number", "")):
            raise ValueError(
                f"Row {row_number} has an invalid phone_number. Use E.164 format, for example +15551234567."
            )
    return contacts


def as_webhook_contacts(contacts: list[dict[str, str]]) -> list[dict[str, object]]:
    """Convert CSV rows to the add-contacts shape.

    Create-time rows are flat: phone_number plus loose variable keys. The
    add-contact endpoints instead take to_number with the variables inside an
    explicit custom_variables object. This is where that translation happens.
    """
    converted = []
    for contact in contacts:
        variables = {key: value for key, value in contact.items() if key != "phone_number" and value}
        converted.append({"to_number": contact["phone_number"], "custom_variables": variables})
    return converted


def batched(items: list[dict[str, object]], size: int) -> list[list[dict[str, object]]]:
    return [items[start : start + size] for start in range(0, len(items), size)]


def parse_conditions(pairs: list[str]) -> list[dict[str, str]]:
    """Each --condition is column=value, matched with the equals operator."""
    conditions = []
    for pair in pairs:
        column, separator, value = pair.partition("=")
        if not separator or not column or not value:
            raise ValueError(f"--condition takes column=value, got {pair!r}.")
        conditions.append({"column": column, "operator": "equals", "value": value})
    return conditions


def build_create_payload(options: argparse.Namespace, phone_number_id: str) -> dict[str, object]:
    payload: dict[str, object] = {
        "name": options.name,
        "phone_number_id": phone_number_id,
        "save_as_draft": True,
        "concurrent_call_limit": options.concurrency,
    }
    if options.bot_id:
        payload["bot_id"] = options.bot_id
    if options.condition:
        payload["call_conditions"] = parse_conditions(options.condition)
    if options.rotate:
        numbers = [int(number_id) for number_id in options.rotate.split(",")]
        payload["rotation"] = {
            "numbers": [
                {"phone_number_id": number_id, "sequence": (position + 1) * 10}
                for position, number_id in enumerate(numbers)
            ],
            "strategy": "fixed_count",
            "calls_per_number": options.calls_per_number,
        }
    return payload


def send(method: str, path: str, payload: dict | None, live: bool, query: dict | None = None) -> dict | None:
    base_url = os.environ.get("OMNIDIM_API_BASE_URL", "https://omnidim.io/api/v1")
    url = f"{base_url}{path}"
    if query:
        url += "?" + urlencode(query)
    plan = {"request": f"{method} {url}"}
    if payload is not None:
        plan["payload"] = payload
    if not live:
        print(json.dumps({"mode": "dry-run", **plan}, indent=2))
        return None

    api_key = os.environ.get("OMNIDIM_API_KEY")
    if not api_key:
        raise ValueError("Set OMNIDIM_API_KEY before using --live.")
    request = Request(
        url,
        data=json.dumps(payload).encode() if payload is not None else None,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method=method,
    )
    try:
        with urlopen(request) as response:  # noqa: S310 - URL is configured by the developer.
            body = json.loads(response.read())
    except HTTPError as error:
        raise RuntimeError(f"{method} {path} failed: {error.code} {error.read().decode()}") from error
    print(json.dumps(body, indent=2))
    return body


def main(arguments: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--live", action="store_true", help="send the request instead of printing it")
    commands = parser.add_subparsers(dest="command", required=True)

    create = commands.add_parser("create", help="create a campaign as a draft")
    create.add_argument("--name", default="Bulk campaign")
    create.add_argument("--bot-id", type=int, help="agent to run the calls; required when the number has none attached")
    create.add_argument("--concurrency", type=int, default=1)
    create.add_argument("--condition", action="append", default=[], metavar="COLUMN=VALUE",
                        help="dial only contacts matching every condition; repeatable")
    create.add_argument("--rotate", metavar="ID,ID", help="phone number ids to rotate across")
    create.add_argument("--calls-per-number", type=int, default=50)

    add = commands.add_parser("add-contacts", help="feed a CSV into an existing campaign")
    add.add_argument("campaign_id", type=int)
    add.add_argument("csv_path", type=Path)

    start = commands.add_parser("start", help="launch a draft campaign")
    start.add_argument("campaign_id", type=int)

    status = commands.add_parser("status", help="live progress of a campaign")
    status.add_argument("campaign_id", type=int)

    concurrency = commands.add_parser("concurrency", help="change concurrent calls mid-run")
    concurrency.add_argument("campaign_id", type=int)
    concurrency.add_argument("limit", type=int)

    results = commands.add_parser("results", help="per-contact outcomes, one page per cursor")
    results.add_argument("campaign_id", type=int)
    results.add_argument("--call-status", help="filter, for example Completed or Failed")
    results.add_argument("--cursor", help="next_cursor from the previous page")
    results.add_argument("--pagesize", type=int, default=50)

    options = parser.parse_args(arguments)

    if options.command == "create":
        phone_number_id = os.environ.get("OMNIDIM_PHONE_NUMBER_ID", "YOUR_PHONE_NUMBER_ID")
        send("POST", "/calls/bulk_call/create", build_create_payload(options, phone_number_id), options.live)
    elif options.command == "add-contacts":
        contacts = as_webhook_contacts(parse_contacts(options.csv_path))
        for batch in batched(contacts, CONTACTS_PER_REQUEST):
            send("POST", f"/calls/bulk_call/{options.campaign_id}/add_contacts", {"contacts": batch}, options.live)
    elif options.command == "start":
        send("POST", f"/calls/bulk_call/{options.campaign_id}/start", {}, options.live)
    elif options.command == "status":
        send("GET", f"/bulk-call/{options.campaign_id}/live-status", None, options.live)
    elif options.command == "concurrency":
        send("PUT", f"/calls/bulk_call/{options.campaign_id}/concurrency",
             {"concurrent_call_limit": options.limit}, options.live)
    elif options.command == "results":
        query: dict[str, object] = {"pagesize": options.pagesize}
        if options.call_status:
            query["call_status"] = options.call_status
        if options.cursor:
            query["cursor"] = options.cursor
        send("GET", f"/calls/bulk_call/{options.campaign_id}/lines", None, options.live, query=query)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, RuntimeError) as error:
        print(error, file=sys.stderr)
        raise SystemExit(1) from error
