<p align="center">
  <a href="https://omnidim.io"><img src="./assets/omnidim-logo-light.png" width="430" alt="OmniDimension"></a>
</p>

<h1 align="center">OmniDimension examples</h1>

<p align="center">Reference implementations for connecting voice agents to the systems you already use.</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-0d9488" alt="MIT license"></a>
  <a href="https://docs.omnidim.io/docs"><img src="https://img.shields.io/badge/docs-OmniDimension-0d9488" alt="OmniDimension developer documentation"></a>
  <a href="https://discord.gg/kdjzykMTHJ"><img src="https://img.shields.io/badge/community-Discord-5865F2?logo=discord&logoColor=white" alt="Join our Discord community"></a>
</p>

## New to OmniDimension?

Use the [Web SDK guide](https://docs.omnidim.io/docs/sdks/web), [API
reference](https://docs.omnidim.io/docs/api-reference), and [video
tutorials](https://www.youtube.com/@OmniDimensionio) as you adapt an example.

## Start with a safe local run

1. Choose an integration pattern below.
2. Follow its README and run the included fixture, dry run, or local simulation.
3. Add your OmniDimension credentials only when you are ready to make a live connection.

No example makes a live call by default.

## Integration patterns

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="./web-voice"><strong>Embed voice in your product</strong></a><br>
      Add browser calls, live transcripts, mute, and hang-up controls.<br><br>
      <a href="./web-voice">Open web voice →</a>
    </td>
    <td width="50%" valign="top">
      <a href="./custom-api"><strong>Connect the agent to your backend</strong></a><br>
      Let an agent look up data or take an approved action through your API.<br><br>
      <a href="./custom-api">Open custom API →</a>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="./outbound-calls"><strong>Run outbound calls from your data</strong></a><br>
      Validate a lead list, review a dry run, then dispatch a campaign.<br><br>
      <a href="./outbound-calls">Open outbound calls →</a>
    </td>
    <td width="50%" valign="top">
      <a href="./webhooks"><strong>Receive completed-call outcomes</strong></a><br>
      Deliver summaries and extracted data to a workflow you control.<br><br>
      <a href="./webhooks">Open webhooks →</a>
    </td>
  </tr>
</table>

## Developer tooling

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="./mcp"><strong>Manage agents from your coding client</strong></a><br>
      Connect OmniDimension to Claude Code, Codex, Cursor, or VS Code.<br><br>
      <a href="./mcp">Open MCP →</a>
    </td>
    <td width="50%" valign="top">
      <a href="https://discord.gg/kdjzykMTHJ"><strong>Talk to the builders ↗</strong></a><br>
      Get unstuck, compare approaches, and share what you are shipping.<br><br>
      <a href="https://discord.gg/kdjzykMTHJ">Join our Discord community ↗</a>
    </td>
  </tr>
</table>

## How the examples fit together

Every example is small enough to understand in one sitting and structured so
you can replace the sample data and endpoints with your own systems.

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart TB
  Website[Website or product] <--> |web-voice| Agent[OmniDimension agent]
  Agent <--> |custom-api| Backend[Backend or REST API]
  Leads[Lead list or CRM] --> |outbound-calls| Agent
  Agent --> |webhooks| Destination[CRM, workflow, or data store]
  Client[AI coding client] <--> |mcp| Agent
```

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
