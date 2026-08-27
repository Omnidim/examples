# Bulk campaign lifecycle

Drive a bulk-call campaign end to end from your own code: build it as a draft,
feed it contacts in batches, rotate across numbers, filter who gets dialed,
launch it, steer it while it runs, and read per-contact results.

Every subcommand prints the exact API request it would send by default. Nothing
dials until you pass `--live`, so the dry run doubles as a reference for the
payload shapes.

Part of [OmniDimension examples](https://github.com/Omnidim/examples).

## Choose an implementation

- [`typescript`](./typescript): Node.js CLI for local tools and servers
- [`python`](./python): Python CLI for backend and data workflows

## The lifecycle

```console
$ python3 src/main.py create --name "Renewal follow-ups" --condition plan=pro --rotate 177,178
$ python3 src/main.py add-contacts 314 ../sample-contacts.csv
$ python3 src/main.py start 314
$ python3 src/main.py status 314
$ python3 src/main.py concurrency 314 5
$ python3 src/main.py results 314 --call-status Failed
```

`create` builds the campaign as a draft, so you can inspect it on the dashboard
or add more contacts before anything dials. `start` launches it.

## Two contact shapes, one translation

Create-time contact rows are flat: `phone_number` plus any variable keys
alongside it. The add-contact endpoints instead take `to_number` with the
variables inside a `custom_variables` object. The `add-contacts` subcommand
reads a plain CSV and does that translation for you, in batches of up to 1000
contacts per request.

## Adding contacts is not just for dynamic campaigns

`add-contacts` works on any campaign that is not cancelled or failed, including
one created from the dashboard. A draft accumulates the contacts for launch. A
running campaign queues them. A completed campaign wakes up and starts dialing
again, so topping up last week's finished campaign with this week's leads is
one request.

## Requirements for live runs

Before a live run, create and test an agent, attach it to a phone number, and
start with a small contact list. The full walkthrough of every endpoint used
here is [Run a campaign over the API](https://docs.omnidim.io/docs/bulk-calls/api),
and the field-by-field reference is
[Create bulk call](https://docs.omnidim.io/docs/api-reference/bulk-calls/createBulkCall).

## Safety

- Dry run is the default.
- `--live` is required before the scripts send data to OmniDimension.
- The sample CSV uses reserved fictional numbers that the API rejects, so it
  cannot dial anyone even if run live by accident. Replace them with real
  numbers you are allowed to call.

## Help

- [Join our Discord community ↗](https://discord.gg/kdjzykMTHJ) for help adapting this workflow.
