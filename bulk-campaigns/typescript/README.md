# Bulk campaigns with TypeScript

Drive a bulk-call campaign through its whole lifecycle: create a draft, add
contacts in batches, start it, watch it, retune concurrency mid-run, and read
per-contact results.

Part of [OmniDimension examples](https://github.com/Omnidim/examples).

## Run locally

```bash
npm ci
npm start -- create --name "Renewal follow-ups" --condition plan=pro --rotate 177,178
npm start -- add-contacts 314 ../sample-contacts.csv
npm start -- start 314
npm start -- status 314
npm start -- concurrency 314 5
npm start -- results 314 --call-status Failed
```

The default output is a dry run. Every subcommand prints the exact request it
would send, so you can read the payload shapes before anything dials.

## Send live requests

```bash
cp .env.example .env
npm start -- create --name "Renewal follow-ups" --live
```

Set `OMNIDIM_API_KEY` and `OMNIDIM_PHONE_NUMBER_ID` in `.env` first. Each
subcommand maps to one documented endpoint, and `add-contacts` splits the CSV
into requests of up to 1000 contacts. Nothing is sent until `--live` is
present.

The API key should stay in `.env`, never browser code or source control.

## Learn more

- [Run a campaign over the API](https://docs.omnidim.io/docs/bulk-calls/api)
- [Bulk call API reference](https://docs.omnidim.io/docs/api-reference/bulk-calls/createBulkCall)
- [Bulk call guide](https://docs.omnidim.io/docs/bulk-calls/overview)

## Help

- [Join our Discord community ↗](https://discord.gg/kdjzykMTHJ) for help adapting this workflow.
