from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

E164_PHONE = re.compile(r"^\+[1-9]\d{7,14}$")


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


def create_campaign(contacts: list[dict[str, str]], name: str) -> dict[str, object]:
    api_key = os.environ.get("OMNIDIM_API_KEY")
    phone_number_id = os.environ.get("OMNIDIM_PHONE_NUMBER_ID")
    if not api_key or not phone_number_id:
        raise ValueError("Set OMNIDIM_API_KEY and OMNIDIM_PHONE_NUMBER_ID before using --live.")

    base_url = os.environ.get("OMNIDIM_API_BASE_URL", "https://omnidim.io/api/v1")
    payload = json.dumps(
        {"name": name, "phone_number_id": int(phone_number_id), "contact_list": contacts}
    ).encode()
    request = Request(
        f"{base_url}/calls/bulk_call/create",
        data=payload,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request) as response:  # noqa: S310 - URL is configured by the developer.
            return json.loads(response.read())
    except HTTPError as error:
        raise RuntimeError(f"Campaign creation failed: {error.code} {error.read().decode()}") from error


def main(arguments: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("csv_path", type=Path)
    parser.add_argument("--live", action="store_true")
    parser.add_argument("--name", default="Outbound campaign")
    options = parser.parse_args(arguments)
    contacts = parse_contacts(options.csv_path)
    print(json.dumps({"mode": "live" if options.live else "dry-run", "name": options.name, "contacts": contacts}, indent=2))
    if options.live:
        print(json.dumps(create_campaign(contacts, options.name), indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ValueError as error:
        print(error, file=sys.stderr)
        raise SystemExit(1) from error
