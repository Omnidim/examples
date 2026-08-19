import { agentEndpoint } from "./session-url";

export type AgentContext = {
  id: number;
  name: string;
  welcomeMessage: string | null;
  voiceName: string | null;
  languages: string[];
};

export async function getAgentContext(): Promise<AgentContext | null> {
  if (process.env.NEXT_PUBLIC_OMNIDIM_MODE !== "live") return null;

  const apiKey = process.env.OMNIDIM_API_KEY;
  const agentId = Number(process.env.OMNIDIM_AGENT_ID);
  if (!apiKey || !Number.isSafeInteger(agentId) || agentId <= 0) return null;

  try {
    const response = await fetch(agentEndpoint(agentId), {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    const data = await response.json() as {
      id?: unknown;
      name?: unknown;
      welcome_message?: unknown;
      voice_name?: unknown;
      languages?: unknown;
    };
    if (!response.ok || typeof data.name !== "string") return null;

    const languages = Array.isArray(data.languages)
      ? data.languages.flatMap((language) => (
        language && typeof language === "object" && "label" in language && typeof language.label === "string"
          ? [language.label]
          : []
      ))
      : [];

    return {
      id: typeof data.id === "number" ? data.id : agentId,
      name: data.name,
      welcomeMessage: typeof data.welcome_message === "string" && data.welcome_message.trim() ? data.welcome_message : null,
      voiceName: typeof data.voice_name === "string" && data.voice_name.trim() ? data.voice_name : null,
      languages,
    };
  } catch {
    return null;
  }
}
