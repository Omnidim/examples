import { VoiceConsole } from "@/components/voice-console";

export default function Page() {
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
        <h1 id="example-title">A voice agent, in your product.</h1>
        <p>
          This small interface is a complete browser call flow. Try the safe local simulation first, then connect it to your own agent when you are ready.
        </p>
      </section>

      <VoiceConsole />

      <footer className="example-footer">
        <span>Need help adapting this example?</span>
        <a href="https://discord.gg/kdjzykMTHJ" target="_blank" rel="noreferrer">Join the community</a>
      </footer>
    </main>
  );
}
