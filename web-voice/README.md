# Web voice

A small Next.js reference application for adding an OmniDimension voice agent to a website. It includes the browser call states, transcript rendering, mute and hang-up controls, and a server route that creates a short-lived session without exposing your API key.

Part of [OmniDimension examples](https://github.com/Omnidim/examples).

The example starts in local simulation mode. It does not request a microphone or call any external service until you explicitly enable live mode.

## Run it locally

```bash
cd web-voice
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then select **Start a call**. The default simulation lets you review the full interface without credentials.

## Connect your agent

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_OMNIDIM_MODE=live`.
3. Add your `OMNIDIM_API_KEY` and numeric `OMNIDIM_AGENT_ID`.
4. Replace `getAuthenticatedUser` in `src/lib/auth.ts` with your app's
   server-side session check.
5. Apply your normal per-user rate limits to `app/api/session/route.ts`.
6. Restart the development server and start a call.

`OMNIDIM_API_KEY` is read only by `app/api/session/route.ts`. The browser receives only a short-lived, single-conversation WebSocket URL. Do not use a `NEXT_PUBLIC_` prefix for your API key.

Live mode is intentionally blocked until the authentication adapter returns a
user. Do not enable it for anonymous traffic: session creation spends your
account's calling capacity.

## Test a local draft agent

For local development, the reference app can use your local Odoo API and call
handler. This is useful for testing an unpublished agent without changing its
published version.

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_OMNIDIM_MODE=live`.
3. Set `OMNIDIM_API_BASE_URL=http://127.0.0.1:8069`.
4. Set `OMNIDIM_LOCAL_WEB_SOCKET_BASE_URL=ws://127.0.0.1:3002`.
5. Set `OMNIDIM_LOCAL_DEMO_USER_ID` to the Odoo user that owns the agent.
6. Add that user's API key as `OMNIDIM_API_KEY`, and set `OMNIDIM_AGENT_ID`.
7. Run `npm run dev`, open the local URL, allow microphone access, and start a
   call.

The local user override is accepted only by Next.js development mode. It does
not enable anonymous calls in a production build. Never commit `.env.local` or
share its API key.

When live mode is configured, the page loads the selected agent's name, voice,
languages, and welcome message from OmniDimension. If an optional field is not
configured, the interface uses a clear fallback instead of showing an empty
state.

## Verify a live integration

Run this checklist against a real agent before sharing the example with users.

1. Open the configured local URL in a fresh browser tab and check that the
   agent name, welcome message, and voice context match the selected agent.
2. Select **Start a call**. The browser must request microphone access before a
   session is created. Deny it once to confirm that the page shows an error and
   a call is not started.
3. Allow access and confirm that the status changes to **Live**, then speak.
   Each person's partial speech should grow in one transcript line rather than
   creating repeated fragments.
4. Speak enough to create a longer conversation. The call panel must remain
   fixed while only the transcript pane scrolls.
5. Use **Mute**, **Unmute**, and **End call**. Confirm that ending the call
   releases the microphone and the next call starts cleanly.

The page requests microphone permission first, while the button click is still
active. This makes the browser prompt reliable and prevents a denied microphone
from creating a live session.

## What to adapt

- Replace the copy in `src/app/page.tsx` with your product context.
- Pass trusted customer context as `custom_variables` in `app/api/session/route.ts`.
- Keep authentication and rate limiting at the session route. Never call the
  OmniDimension session API directly from the browser.
- Move the `VoiceConsole` component into your own page, then retain the session route as the server-side boundary for your API key.

## Further reading

- [Web SDK documentation](https://docs.omnidim.io/docs/sdks/web)
- [Create a web session](https://docs.omnidim.io/docs/api-reference/sessions/createSession)
- [OmniDimension tutorials](https://www.youtube.com/@OmniDimensionio)

## Help

- [Join our Discord community ↗](https://discord.gg/kdjzykMTHJ) for help adapting this example.
