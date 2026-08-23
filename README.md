<p align="center">
  <a href="https://omnidim.io">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="./assets/omnidim-icon-dark.png">
      <source media="(prefers-color-scheme: light)" srcset="./assets/omnidim-icon-light.png">
      <img src="./assets/omnidim-icon-light.png" width="84" alt="OmniDimension">
    </picture>
  </a>
</p>

<h1 align="center">OmniDimension examples</h1>

<p align="center">Reference implementations for connecting voice agents to the systems you already use.</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-0d9488" alt="MIT license"></a>
  <a href="https://docs.omnidim.io/docs"><img src="https://img.shields.io/badge/docs-OmniDimension-0d9488" alt="OmniDimension developer documentation"></a>
  <a href="https://discord.gg/kdjzykMTHJ"><img src="https://img.shields.io/badge/community-Discord-5865F2?logo=discord&logoColor=white" alt="Join our Discord community"></a>
</p>

## Integration patterns

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="./web-voice"><strong>Embed voice in your product</strong></a><br>
      Add browser calls, live transcripts, mute, and hang-up controls.
    </td>
    <td width="50%" valign="top">
      <a href="./custom-api"><strong>Connect the agent to your backend</strong></a><br>
      Let an agent look up data or take an approved action through your API.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="./outbound-calls"><strong>Run outbound calls from your data</strong></a><br>
      Validate a lead list, review a dry run, then dispatch a campaign.
    </td>
    <td width="50%" valign="top">
      <a href="./webhooks"><strong>Receive completed-call outcomes</strong></a><br>
      Deliver summaries and extracted data to a workflow you control.
    </td>
  </tr>
</table>

## Developer tooling

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="./mcp"><strong>Manage agents from your coding client</strong></a><br>
      Connect OmniDimension to Claude Code, Codex, Cursor, or VS Code.
    </td>
    <td width="50%" valign="top">
      <a href="https://n8n.io/integrations/omnidimension-trigger/"><strong>Build it without code ↗</strong></a><br>
      Our verified n8n node runs calls and reacts to them from a workflow editor.
    </td>
  </tr>
</table>

## How they fit together

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart TB
  Website[Website or product] <--> |web-voice| Agent[OmniDimension agent]
  Agent <--> |custom-api| Backend[Backend or REST API]
  Leads[Lead list or CRM] --> |outbound-calls| Agent
  Agent --> |webhooks| Destination[CRM, workflow, or data store]
  Client[AI coding client] <--> |mcp| Agent
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Never put API keys, recordings, or
customer data in an issue or pull request. [SECURITY.md](./SECURITY.md) covers
reporting a vulnerability.
