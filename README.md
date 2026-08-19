# OmniDimension examples

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

```
Your application or workflow
        |
        v
OmniDimension agent
        |
        +-- Web voice session
        +-- Your REST API
        +-- Outbound campaign
        +-- Post-call webhook
        +-- MCP client
```

## Documentation and community

- [Developer documentation](https://docs.omnidim.io/docs)
- [Video tutorials](https://docs.omnidim.io/docs/tutorials)
- [Join the OmniDimension builders on Discord](https://discord.gg/kdjzykMTHJ)
- [Ask a longer question or share a build](https://community.omnidim.io)
- [Report a bug](https://github.com/Omnidim/examples/issues)

If you adapt an example, share what you built in Discord or the community.
Questions and working variants help make these examples better for everyone.

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
