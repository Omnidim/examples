# Outbound calls with TypeScript

Validate a CSV contact list, review the campaign payload, then create a bulk
call campaign when you explicitly opt in to live mode.

Part of [OmniDimension examples](https://github.com/Omnidim/examples).

## Run locally

```bash
npm install
npm start -- ../sample-contacts.csv
```

The default output is a dry run. It never contacts OmniDimension or places a
call.

## Create a live campaign

```bash
cp .env.example .env
npm start -- ../sample-contacts.csv --live --name "April reminders"
```

Set `OMNIDIM_API_KEY` and `OMNIDIM_PHONE_NUMBER_ID` in `.env` first. The script
uses the documented bulk campaign endpoint. It sends the full validated contact
list only after `--live` is present.

The API key should stay in `.env`, never browser code or source control.

## Learn more

- [Bulk call API reference](https://docs.omnidim.io/docs/api-reference/bulk-calls/createBulkCall)
- [Bulk call guide](https://docs.omnidim.io/docs/bulk-calls/overview)
- [Run bulk call campaigns tutorial](https://www.youtube.com/watch?v=szkkFgJew7I)

## Help

- [Join our Discord community ↗](https://discord.gg/kdjzykMTHJ) for help adapting this workflow.
