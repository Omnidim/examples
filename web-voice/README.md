# Web voice

A small Next.js reference application for adding an OmniDimension voice agent to a website. It includes the browser call states, transcript rendering, mute and hang-up controls, and a server route that creates a short-lived session without exposing your API key.

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
- [Developer community](https://discord.gg/kdjzykMTHJ)
