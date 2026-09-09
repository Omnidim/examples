# Reseller onboarding with Python

Walks one client from creation to an attached phone number, on whichever
carrier you point it at. Prints the plan and calls nothing by default.

Part of [OmniDimension examples](https://github.com/Omnidim/examples).

## Run locally

```bash
python3 -m src.main ../carriers/carrier-1.json
```

No install needed for a dry run or the tests. The SDK is imported inside live
mode only.

## Run it for real

```bash
pip install -r requirements.txt
cp .env.example .env
python3 -m src.main ../carriers/carrier-1.json --live --agent-id 4321
```

Set the values in `.env` and load them into your environment before running
live mode. The code does not load `.env` itself so secrets never become an
implicit dependency.

Verify a client you already created, instead of creating another one:

```bash
python3 -m src.main ../carriers/carrier-2-new.json --live --user-id 1234
```

## Options

| Flag | Default | What it does |
|---|---|---|
| `--live` | off | Actually calls the API. Everything below only matters with it |
| `--user-id` | none | Verify this existing client rather than creating a new one |
| `--agent-id` | none | Attach the bought number to this agent |
| `--client-name` | `Demo User` | Name for the client being created |
| `--minutes` | `100` | Minutes to transfer on creation |
| `--rate` | `0.20` | What you sell a minute for. It cannot be below what you pay |

## What it prompts for

Anything a step requires that the carrier file does not carry, which in
practice is the one-time codes. The script asks at the terminal, sends the
value, and keeps no copy. On a `redirect` step it prints the link for your
customer to open and waits, because that link is single use and expires in
minutes.

## Tests

```bash
python3 -m unittest discover
```

They cover the parts that decide what gets sent: every shipped carrier file
loads, the GST fork resolves to `skip-gst`, an unknown step is refused before
any call, and every planned call that needs a carrier carries one.

## Help

- [Join our Discord community ↗](https://discord.gg/kdjzykMTHJ) for help adapting this workflow.
