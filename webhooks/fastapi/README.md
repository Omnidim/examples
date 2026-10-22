# Post-Call Webhook Receiver (FastAPI)

Receive OmniDimension post-call webhooks, validate payloads using Pydantic, inspect results, and safely forward extracted variables to downstream endpoints.

Part of [OmniDimension examples](https://github.com/Omnidim/examples).

## Prerequisites

- Python 3.10+
- `pip install -r requirements.txt`

## Running Locally

```bash
uvicorn main:app --port 8788 --reload
```

Health check:
```bash
curl http://localhost:8788/healthz
# {"ok": true}
```

## Running Tests

```bash
pytest tests
```
