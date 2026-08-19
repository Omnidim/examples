# Outbound calls

Create a campaign from a CSV file or Google Sheet without putting live call
logic into your application code.

The TypeScript and Python scripts validate contacts and print a dry-run plan by
default. They only call OmniDimension when you pass `--live` and configure the
required environment variables.

## Choose an implementation

- [`typescript`](./typescript): Node.js CLI for local tools and servers
- [`python`](./python): Python CLI for backend and data workflows
- [`google-sheets`](./google-sheets): Apps Script for Google Sheets

## Requirements for live campaigns

Before a live run, create and test an agent, attach it to a phone number, and
start with a small contact list. See the [bulk call guide](https://docs.omnidim.io/docs/bulk-calls/overview)
and the [bulk calling tutorial](https://www.youtube.com/watch?v=szkkFgJew7I).

## Safety

- Dry run is the default.
- `--live` is required before the scripts send data to OmniDimension.
- Use only contacts you are authorized to call.
- Keep real contact lists outside this repository.

Need help adapting the workflow? [Join the builders on Discord](https://discord.gg/kdjzykMTHJ).
