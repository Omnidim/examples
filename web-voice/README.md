# Web voice

A small Next.js app that puts an OmniDimension voice agent on a website.

![The web-voice call console: live status, a voice visualizer, mute and end-call
controls, and a running two-speaker transcript](./docs/web-voice-call.png)

That is the real interface, running in simulation mode with no account and no
microphone. Nothing reaches an external service until you enable live mode.

Part of [OmniDimension examples](https://github.com/Omnidim/examples).

## Run it locally

```bash
cd web-voice
npm ci
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

**Step 4 is not optional.** Until `getAuthenticatedUser` returns a user, every
live call attempt answers `401`:

```text
Live sessions require an authenticated application user. Configure src/lib/auth.ts first.
```

That is the guard working, not a broken build. Session creation spends your
account's calling capacity, so never open live mode to anonymous traffic.

`OMNIDIM_API_KEY` is read only by `app/api/session/route.ts`. The browser gets
only a short-lived, single-conversation WebSocket URL. Never put your API key
behind a `NEXT_PUBLIC_` prefix.

Once live, the page loads the agent's name, voice, languages, and welcome
message from OmniDimension, with a clear fallback for any optional field you
have not set.

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
