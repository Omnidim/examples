# Post-call webhooks

Receive the call data OmniDimension sends after a call, inspect it locally, and forward the fields your workflow needs to a service you control.

This example is deliberately generic. OmniDimension's documented post-call webhook sends a `POST` request to the URL configured on an agent and lets you select the summary, extracted variables, full conversation, and sentiment data to include. The fixtures use the documented payload shape.

Part of [OmniDimension examples](https://github.com/Omnidim/examples).

## Choose an implementation

| Runtime | Start command | Send fixture | Tests |
| --- | --- | --- | --- |
| TypeScript | `npm ci && npm run dev` | `npm run fixture` | `npm test` |
| Python | `python server.py` | `python send_fixture.py` | `python -m unittest discover -s tests` |

Both receivers listen on `http://localhost:8788/webhooks/omnidimension` by default. A local receiver cannot be reached by OmniDimension. Use a temporary HTTPS tunnel for dashboard testing, then replace it with a deployed endpoint you control.

## Configure post-call delivery

1. Open an agent in the OmniDimension dashboard and select **Post-Call**.
2. Select **Webhook** as the delivery method and enter your HTTPS endpoint.
3. Select only the payload sections your workflow needs.
4. Add extracted variables in the dashboard when your workflow needs structured data.
5. Use **Test Connection** before making or dispatching a call.

For the underlying options, see [the post-call webhook guide](https://docs.omnidim.io/docs/integrations/zapier-make-n8n).

## What this receiver does

The receiver validates the stable top-level fields used in the documented sample payload, logs a compact event locally, and responds with `202 Accepted`. It accepts optional `call_report` fields because the fields available depend on the sections selected in the dashboard.

No OmniDimension webhook signing scheme or signature header is documented. This example does not invent one. Before production, place the endpoint behind controls appropriate to your environment, such as an API gateway, private network path, or an allowlist managed by your infrastructure team.

## Using n8n? Start with the node instead

For n8n specifically you do not need this receiver at all. The verified
[OmniDimension node](https://n8n.io/integrations/omnidimension-trigger/) has a
Trigger that starts a workflow when a call completes:

1. In n8n, open **Settings**, **Community Nodes**, **Install**, and enter
   `n8n-nodes-omnidimension`.
2. Add the **OmniDimension Trigger** node and copy its webhook URL.
3. Paste that URL into your agent's **Post-Call** tab, **Webhook**, in the
   OmniDimension dashboard.
4. Optionally set the node's agent-ID filter so one workflow handles one agent.

The same package ships an action node covering agents, bulk calls, call
dispatch, knowledge base, and phone numbers, so a workflow can both start calls
and react to them. Source: [Omnidim/n8n-nodes-omnidimension](https://github.com/Omnidim/n8n-nodes-omnidimension).

Use the receiver below when your destination has no first-party node.

## Forward data to another workflow

Set `FORWARD_URL` to an HTTPS endpoint you own and set
`FORWARD_URL_ALLOWED_HOSTS` to its comma-separated hostname allowlist. The
receiver refuses a target that is not explicitly allowed. This works for a
generic REST endpoint and for the webhook URLs supplied by Make, Zapier, or
GHL, all of which are documented post-call destinations.

For first-party destinations, prefer the dashboard integration instead of duplicating credentials in this receiver:

- [HubSpot](https://docs.omnidim.io/docs/integrations/hubspot)
- [Salesforce](https://docs.omnidim.io/docs/integrations/salesforce)
- [Google Sheets](https://docs.omnidim.io/docs/integrations/google-sheets)
- [Slack](https://docs.omnidim.io/docs/integrations/slack)
- [WhatsApp post-call delivery](https://docs.omnidim.io/docs/dashboard-guides/post-call)

## Resources

- [Post-call automation guide](https://docs.omnidim.io/docs/integrations/zapier-make-n8n)
- [Tutorial: get post-call data](https://www.youtube.com/watch?v=__hZ9u6Em9w)

## Help

- [Join our Discord community ↗](https://discord.gg/kdjzykMTHJ) for help adapting this pattern.
