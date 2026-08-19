# Dashboard configuration

Create three Custom API integrations and attach all three to the same agent. The paths below match the local fixture server. Use your public HTTPS URL in the dashboard because an agent cannot reach `localhost`.

## Look up customer

| Field | Value |
| --- | --- |
| Integration name | Look up customer |
| Method | `GET` |
| URL | `https://your-domain.example/v1/customers/{phone}` |
| Description | Look up the caller's account by phone number. Use this only after the caller provides or confirms their phone number. Return the customer's name, account status, and renewal date. |
| Parameter | `phone`, required, string, AI generated |

## Check appointment availability

| Field | Value |
| --- | --- |
| Integration name | Check appointment availability |
| Method | `GET` |
| URL | `https://your-domain.example/v1/availability` |
| Description | Return available appointment times for one calendar date. Ask the caller for a date before using this action. |
| Parameter | `date`, required, string, AI generated |

Configure `date` as a query parameter. Use the format `YYYY-MM-DD`.

## Reserve appointment

| Field | Value |
| --- | --- |
| Integration name | Reserve appointment |
| Method | `POST` |
| URL | `https://your-domain.example/v1/appointments` |
| Description | Reserve an available appointment for a customer. Use only after the caller confirms the exact time. |
| Body parameter | `customerPhone`, required, string, AI generated |
| Body parameter | `timeSlot`, required, string, AI generated |

The fixture server expects an ISO 8601 UTC timestamp for `timeSlot`, for example `2026-09-04T10:00:00Z`.

## Agent instruction

Add an instruction such as:

> Before discussing account-specific information, ask the caller to confirm the phone number being used. Check availability before offering a time. Reserve an appointment only after the caller explicitly confirms the exact appointment time.

This is a starting point, not an authorization policy. Put your business rules and any required consent checks in both the agent instructions and your backend.
