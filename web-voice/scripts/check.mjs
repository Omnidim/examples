import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const requiredFiles = [
  "src/app/api/session/route.ts",
  "src/components/voice-console.tsx",
  "src/lib/auth.ts",
  "src/lib/call-state.js",
];

for (const file of requiredFiles) {
  await readFile(resolve(file), "utf8");
}

const sessionRoute = await readFile(resolve("src/app/api/session/route.ts"), "utf8");
if (!sessionRoute.includes("getAuthenticatedUser")) {
  throw new Error("Live session creation must require an authenticated user.");
}

console.log("Project structure checks passed.");
