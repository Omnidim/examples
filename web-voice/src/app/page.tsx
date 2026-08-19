import { VoiceConsole } from "@/components/voice-console";
import { getAgentContext } from "@/lib/agent-context";

export default async function Page() {
  const agent = await getAgentContext();
  const title = agent ? `Talk to ${agent.name}.` : "A voice agent, in your product.";
  const description = agent
    ? `You are about to connect to the configured ${agent.name} agent. Your microphone remains off until you start the call.`
    : "This small interface is a complete browser call flow. Try the safe local simulation first, then connect it to your own agent when you are ready.";

  return (
    <main className="page-shell">
      <header className="site-header">
        <a className="brand" href="https://omnidim.io" aria-label="OmniDimension home">
          <img src="/omnidim-logo-dark.png" alt="OmniDimension" />
        </a>
        <a className="docs-link" href="https://docs.omnidim.io/docs/sdks/web" target="_blank" rel="noreferrer">
          Web SDK documentation
        </a>
      </header>

      <section className="example-intro" aria-labelledby="example-title">
        <p className="eyebrow">Web SDK reference</p>
        <h1 id="example-title">{title}</h1>
        <p>{description}</p>
      </section>

      <VoiceConsole agent={agent} />

      <footer className="example-footer">
        <span>Need help adapting this example?</span>
        <a href="https://discord.gg/kdjzykMTHJ" target="_blank" rel="noreferrer">
          Join our Discord community <span aria-hidden="true">↗</span>
        </a>
      </footer>
    </main>
  );
}
