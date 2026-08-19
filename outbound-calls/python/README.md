# Outbound calls with Python

This CLI validates a CSV file and prints a dry-run campaign payload by default.
Use `--live` only after adding your own API key and phone number ID.

Part of [OmniDimension examples](https://github.com/Omnidim/examples).

## Run locally

```bash
python3 src/main.py ../sample-contacts.csv
```

## Create a live campaign

```bash
cp .env.example .env
python3 src/main.py ../sample-contacts.csv --live --name "April reminders"
```

Set the required values in `.env` and load them into your environment before
running live mode. The code does not load `.env` itself so secrets never become
an implicit dependency.

See the [bulk call guide](https://docs.omnidim.io/docs/bulk-calls/overview) and
[bulk campaign API reference](https://docs.omnidim.io/docs/api-reference/bulk-calls/createBulkCall).

## Help and community

- [Join our Discord community ↗](https://discord.gg/kdjzykMTHJ) for help adapting this workflow.
- [Ask a longer question or share your workflow ↗](https://community.omnidim.io) so others can find it later.
