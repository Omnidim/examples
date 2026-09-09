# Reseller onboarding

Take one client from nothing to a working phone number: create the account,
fund it with credits at your rate, verify it on a carrier, buy it a number, and
attach that number to an agent.

The script prints the whole plan and calls nothing by default. It only reaches
OmniDimension when you pass `--live`.

Part of [OmniDimension examples](https://github.com/Omnidim/examples).

## Choose an implementation

- [`python`](./python): CLI for backend and data workflows

## The nine calls

| # | Call | What it does |
|---|---|---|
| 1 | `POST /reseller/users/add` | Creates the client and its organization |
| 2 | `POST /reseller/credits/transfer` | Funds it. You are debited at your rate, the client is credited at yours |
| 3 | `GET /reseller/kyc/requirements` | The steps this carrier runs, and the fields each one needs |
| 4 | `GET /reseller/kyc/status` | Where the client stands, per carrier, and the first step to run |
| 5 | `POST /reseller/kyc/steps/{step}` | One step. Repeat, following `next_step`, until there is none |
| 6 | `GET /phone_number/search` | What that carrier has in stock |
| 7 | `POST /phone_number/purchase` | Buys one, charged to the client's balance |
| 8 | `POST /phone_number/attach` | Puts the number on one of their agents |

## A carrier is required, everywhere

A region can hold more than one carrier. They do not stock the same numbers and
they do not run the same checks, so every call that touches numbers or
verification names one. Call without it and the `409 carrier_required` response
lists that region's carriers with what each one stocks, which is how this
example would find a carrier added after it was written.

Verification does not carry across carriers. A client verified on one still has
to verify on the other before it can buy there.

## One flow, three carriers

Each file in [`carriers`](./carriers) holds the answers for one carrier. None of
them holds the order: the live run reads the first step from KYC status and
follows `next_step` from each response, so a carrier can change its flow without
this code changing.

| File | Region | Stocks | Identity is checked by |
|---|---|---|---|
| [`carrier-1.json`](./carriers/carrier-1.json) | `IN` | Landline numbers, city codes 11, 12 and 80 | A code to the customer's email and phone, then Aadhaar by OTP, ending in a preview they accept |
| [`carrier-2-new.json`](./carriers/carrier-2-new.json) | `IN` | Mobile numbers, 94 and 79 series | No codes at all. Aadhaar through a DigiLocker link the customer opens |
| [`carrier-us.json`](./carriers/carrier-us.json) | `US` | US local numbers, by area code | Business details, address, and a named representative, then the carrier reviews |

Three shapes, one loop, because the script branches on each step's `method` and
never on its name:

- `submit` posts the fields in the file.
- `otp` needs a code the customer just received, so the script asks for it at
  the terminal and never writes it down.
- `redirect` returns a single-use link. The script prints it for the customer to
  open, then polls `poll_step` until they finish.

Two things the step list does not show, both in the code:

- **`verify-gst` is a fork.** The API asks for it, and a client with no GST
  number runs `skip-gst` instead. Each carrier file declares that under
  `instead_of`.
- **`next_step: null` is not always "you can buy".** The US carrier opens its own
  review at the end, so the run finishes by re-reading KYC status and reporting
  `review_status` rather than assuming it is done.

## What a dry run looks like

```console
$ cd python && python3 -m src.main ../carriers/carrier-us.json
{
  "mode": "dry-run",
  "region": "US",
  "carrier": "carrier-us",
  "stocks": "US local numbers, by area code",
  "calls": [
    {
      "call": "client.reseller.add_user(...)",
      "endpoint": "POST /reseller/users/add",
      "body": { "name": "Demo User", "email": "demo.user@example.com" }
    },
    {
      "call": "client.reseller.submit_kyc_step('business-info', ...)",
      "endpoint": "POST /reseller/kyc/steps/business-info",
      "body": {
        "user_id": "<from add_user>",
        "region": "US",
        "carrier": "carrier-us",
        "business_name": "Demo Corp",
        "business_type": "LLC",
        "business_industry": "TECHNOLOGY"
      }
    }
  ]
}
```

Read that, edit the carrier file to your client's real details, then add
`--live`.

## Before a live run

- Reseller access is granted out of band. [Request it](https://omnidim.io/contact-us?reason=reseller_api&lock=1)
  if the endpoints return `403`.
- Verification is real. It sends codes to a real person, checks a real PAN, and
  a rapid retry on the Aadhaar steps can lock that person out at the identity
  authority, which no API call undoes. There is no sandbox carrier yet.
- Buying a number spends the client's balance, and the rental renews.
- You are relaying what your customer typed. Do not store the values these
  requests carry, and redact them from your logs. That covers the PAN, the
  Aadhaar number, the GST number, every one-time code, and the redirect link.

## Docs

- [Reseller API guide](https://docs.omnidim.io/docs/reseller-api)
- [Verification steps, per carrier](https://docs.omnidim.io/docs/api-reference/reseller/submitResellerKycStep)
- [Buy a number over the API](https://docs.omnidim.io/docs/buy-a-number-api)

## Help

- [Join our Discord community ↗](https://discord.gg/kdjzykMTHJ) for help adapting this workflow.
