# OmniDimension examples

<p>
  <a href="https://github.com/Omnidim/examples/actions/workflows/ci.yml"><img src="https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=githubactions&logoColor=white" alt="Continuous integration"></a>
  <a href="https://github.com/Omnidim/examples/actions/workflows/codeql.yml"><img src="https://img.shields.io/badge/security-CodeQL-181717?logo=github&logoColor=white" alt="CodeQL analysis"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-0d9488" alt="MIT license"></a>
  <a href="https://github.com/Omnidim/examples/issues"><img src="https://img.shields.io/github/issues/Omnidim/examples?label=issues" alt="Open issues"></a>
  <a href="./CONTRIBUTING.md"><img src="https://img.shields.io/badge/contributions-welcome-0d9488" alt="Contributions welcome"></a>
</p>

<p>
  <a href="https://docs.omnidim.io/docs"><img src="https://img.shields.io/badge/docs-OmniDimension-0d9488" alt="OmniDimension developer documentation"></a>
  <a href="https://discord.gg/kdjzykMTHJ"><img src="https://img.shields.io/badge/community-Discord-5865F2?logo=discord&logoColor=white" alt="Join our Discord community"></a>
</p>

Reference implementations for adding OmniDimension voice agents to web apps,
backends, outbound workflows, and AI coding clients.

Each example is small enough to understand in one sitting and structured so
you can replace the sample data and endpoints with your own systems.

## Start here

| If you want to… | Open this example |
| --- | --- |
| Add a voice conversation to a website or product | [`web-voice`](./web-voice) |
| Let an agent read data or take action in your backend | [`custom-api`](./custom-api) |
| Start and monitor outbound calls from a lead list | [`outbound-calls`](./outbound-calls) |
| Receive completed-call data in another system | [`webhooks`](./webhooks) |
| Manage agents from Claude Code, Codex, Cursor, or VS Code | [`mcp`](./mcp) |

## How the examples work

Every example starts in a safe local mode with fixtures or sample data. Add an
`OMNIDIM_API_KEY` only when you are ready to connect it to your OmniDimension
account. No example makes a live call by default.

```mermaid
flowchart LR
  subgraph Systems[Your product, data, and tools]
    Website[Website or product]
    API[Backend or REST API]
    Leads[Lead list or CRM]
    Outcome[CRM, workflow, or data store]
    Client[AI coding client]
  end

  Agent[OmniDimension agent]

  Website <--> |web-voice| Agent
  Agent <--> |custom-api| API
  Leads --> |outbound-calls| Agent
  Agent --> |webhooks| Outcome
  Client <--> |mcp| Agent
```

## Documentation and community

- [Developer documentation](https://docs.omnidim.io/docs)
- [Video tutorials](https://docs.omnidim.io/docs/tutorials)
- [Report a bug](https://github.com/Omnidim/examples/issues)

### Get help or share a build

- [Join our Discord community ↗](https://discord.gg/kdjzykMTHJ) for build questions, discussion, and sharing what you ship.

If you adapt an example, share what you built. Questions and working variants
help make these examples better for everyone.

## Development

Examples are intentionally independent. Change into the directory you want to
run and follow its README. TypeScript examples use npm. Python examples use
Python 3.10 or later and can be run in a virtual environment.

Before opening a pull request, run the checks listed in the example you
changed. Continuous integration runs the repository-wide smoke checks.

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting a change. We welcome
fixes, documentation improvements, and examples that demonstrate a broadly
useful integration pattern.

## Security

Do not include API keys, call recordings, customer data, or internal URLs in
issues or pull requests. See [SECURITY.md](./SECURITY.md) for reporting details.
