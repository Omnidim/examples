# Outbound calls from Google Sheets

Use this Apps Script to validate rows before sending them to your own service
or automation workflow. It deliberately does not send an OmniDimension API key
from Google Sheets. Keep calls to OmniDimension on a server or trusted
automation platform where credentials can be managed safely.

Part of [OmniDimension examples](https://github.com/Omnidim/examples).

1. Create a sheet with `phone_number`, `name`, and `reason_for_call` columns.
2. Open Extensions, then Apps Script.
3. Paste `Code.gs`, save, and reload the sheet.
4. Use **OmniDimension > Validate selected rows** before sending your rows to
   your server-side campaign endpoint.

For the platform workflow, see [dispatch voice AI calls from a CRM or Google
Sheets](https://www.youtube.com/watch?v=YOBEpWgyYDM).

## Help

- [Join our Discord community ↗](https://discord.gg/kdjzykMTHJ) for help adapting this workflow.
