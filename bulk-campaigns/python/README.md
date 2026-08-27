# Bulk campaign lifecycle with Python

One CLI, one subcommand per lifecycle step. Every subcommand prints the exact
request it would send by default; add `--live` to send it.

Part of [OmniDimension examples](https://github.com/Omnidim/examples).

## Run locally

```bash
python3 src/main.py create --name "Renewal follow-ups" --condition plan=pro
python3 src/main.py add-contacts 314 ../sample-contacts.csv
```

## Run it live

```bash
cp .env.example .env
python3 src/main.py --live create --name "Renewal follow-ups"
```

Set the required values in `.env` and load them into your environment before
running live mode. The code does not load `.env` itself so secrets never become
an implicit dependency.

## Test

```bash
python3 -m unittest test_main
```

See [Run a campaign over the API](https://docs.omnidim.io/docs/bulk-calls/api)
for the full walkthrough of these endpoints.

## Help

- [Join our Discord community ↗](https://discord.gg/kdjzykMTHJ) for help adapting this workflow.
