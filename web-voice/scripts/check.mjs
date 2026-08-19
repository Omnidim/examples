import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const requiredFiles = [
  "src/app/api/session/route.ts",
  "src/components/voice-console.tsx",
  "src/lib/auth.ts",
  "src/lib/call-state.js",
  "src/lib/session-url.ts",
  "src/lib/agent-context.ts",
  "src/lib/microphone.js",
  "src/lib/transcript.js",
];

for (const file of requiredFiles) {
  await readFile(resolve(file), "utf8");
}

const sessionRoute = await readFile(resolve("src/app/api/session/route.ts"), "utf8");
if (!sessionRoute.includes("getAuthenticatedUser")) {
  throw new Error("Live session creation must require an authenticated user.");
}

const authAdapter = await readFile(resolve("src/lib/auth.ts"), "utf8");
if (!authAdapter.includes('process.env.NODE_ENV === "development"')) {
  throw new Error("The local development override must not work in production.");
}

const sessionUrl = await readFile(resolve("src/lib/session-url.ts"), "utf8");
if (!sessionUrl.includes("OMNIDIM_LOCAL_WEB_SOCKET_BASE_URL")) {
  throw new Error("Local WebSocket routing must be configured on the server.");
}

const agentContext = await readFile(resolve("src/lib/agent-context.ts"), "utf8");
if (!agentContext.includes("Authorization: `Bearer ${apiKey}`")) {
  throw new Error("Agent context must be fetched only with server-side credentials.");
}

const microphone = await readFile(resolve("src/lib/microphone.js"), "utf8");
if (!microphone.includes("getUserMedia") || !microphone.includes("track.stop")) {
  throw new Error("The microphone preflight must request and release access safely.");
}

console.log("Project structure checks passed.");
