# Outbound calls

Create a campaign from a CSV file or Google Sheet without putting live call
logic into your application code.

The TypeScript and Python scripts validate contacts and print a dry-run plan by
default. They only call OmniDimension when you pass `--live` and configure the
required environment variables.

Part of [OmniDimension examples](https://github.com/Omnidim/examples).

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

## Help and community

- [Join our Discord community ↗](https://discord.gg/kdjzykMTHJ) for help adapting this workflow.
- [Ask a longer question or share your workflow ↗](https://community.omnidim.io) so others can find it later.
