# Custom API integration

Give an OmniDimension agent access to data or actions in an existing system. This example includes two local services that represent a common pattern: look up a customer, check appointment availability, and reserve an appointment.

The services use fixtures by default. Replace the fixture functions with calls to your CRM, database, booking system, or internal API when you are ready.

Part of [OmniDimension examples](https://github.com/Omnidim/examples).

## Choose an implementation

| Runtime | Start command | Tests |
| --- | --- | --- |
| TypeScript | `npm ci && npm run dev` | `npm test` |
| Python | `python server.py` | `python -m unittest discover -s tests` |

Both implementations expose the same API on port `8787` by default.

```text
GET  /healthz
GET  /v1/customers/{phone}
GET  /v1/availability?date=YYYY-MM-DD
POST /v1/appointments
```

For example:

```sh
curl http://localhost:8787/v1/customers/%2B15551234567
curl 'http://localhost:8787/v1/availability?date=2026-09-04'
curl -X POST http://localhost:8787/v1/appointments -H 'content-type: application/json' -d '{"customerPhone":"+15551234567","timeSlot":"2026-09-04T10:00:00Z"}'
```

## Configure the agent

Follow [the Custom API guide](https://docs.omnidim.io/docs/integrations/custom-api) to create each integration, test it, and attach it to your agent. The exact dashboard fields and agent instructions are in [dashboard-config.md](./dashboard-config.md).

For a public endpoint, configure these three actions separately:

1. **Look up customer**: `GET https://your-domain.example/v1/customers/{phone}`
2. **Check appointment availability**: `GET https://your-domain.example/v1/availability?date={date}`
3. **Reserve appointment**: `POST https://your-domain.example/v1/appointments`

The agent uses the description and parameter descriptions to decide when to call an action. Keep those descriptions specific, and test each action in the dashboard before using it in a live call.

## Use this safely

The local services intentionally contain no authentication because they are fixtures. A production endpoint must authenticate requests, validate input, authorize each action, and avoid returning more customer data than the agent needs. Keep credentials in your deployment environment, not in agent instructions or this repository.

## Resources

- [Custom API documentation](https://docs.omnidim.io/docs/integrations/custom-api)
- [Tutorial: connect an agent to a custom API](https://www.youtube.com/watch?v=Ln3Y7LvL0BM)

## Help

- [Join our Discord community ↗](https://discord.gg/kdjzykMTHJ) for help adapting this pattern.
