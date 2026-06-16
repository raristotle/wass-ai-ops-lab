# Meridian Product Finder — MCP server

Exposes the recommender as [Model Context Protocol](https://modelcontextprotocol.io)
tools so any MCP client — Claude Desktop, Claude Code, or an agent — can do
procurement against the catalog: search, convert a competitor part to the
stocked equivalent we document, read specs and live stock, and pull the
cross-reference coverage summary.

It is a thin, stateless HTTP client over the deployed REST API — **no database,
no AI, no per-call cost.** Point it at any environment with `MERIDIAN_API_BASE`
(default `https://app.raristotle.com`).

## Tools

| Tool | What it does |
|---|---|
| `search_products` | Search the catalog by query (+ category / in-stock filters) |
| `cross_reference` | Convert ONE competitor part → the stocked equivalent we document, with source + confidence |
| `bulk_cross_reference` | Convert up to 100 competitor parts at once |
| `product_detail` | Specs, datasheet link, price, branch/DC stock, verified crosses, brand hierarchy |
| `check_availability` | Branch + DC stock totals for a SKU |
| `coverage_summary` | Source-backed pair counts, both-sides-stocked, pairs by category, source-workbook ingest status |
| `create_job` | **(write)** Create a durable Job (project) workspace; returns a `jobId` |
| `list_jobs` | List Job workspaces with status + linked-artifact counts |
| `place_order` | **(write)** Place a durable, **idempotent** order (`{sku, qty}[]`) against the catalog — agentic checkout; optional `jobId`, dedup by `clientRef` |

Only ≥95%-confidence, source-backed crosses are ever returned, each citing the
document that states it. The three **write** tools (`create_job`, `place_order`)
persist to the durable store (Neon when configured) and target whatever
`MERIDIAN_API_BASE` points at — so an agent can search, cross-reference, and then
actually transact. `place_order` is idempotent by `clientRef`: a retried call
returns the existing order rather than duplicating it.

When the deployment has the durable-endpoint auth gate enabled (its
`WRITE_API_TOKEN` is set), set **`MERIDIAN_API_TOKEN`** to the same value so the
write tools authenticate (`Authorization: Bearer …`). Read tools work regardless.

## Run

```bash
npm run mcp                 # or: node mcp/meridian-mcp-server.mjs
MERIDIAN_API_BASE=http://localhost:3000 npm run mcp   # against a local dev server
```

Verify end-to-end (spawns the server, lists tools, calls a few):

```bash
node mcp/smoke-test.mjs
```

## Connect from Claude Desktop

Add to `claude_desktop_config.json` (macOS:
`~/Library/Application Support/Claude/`, Windows: `%APPDATA%\Claude\`):

```json
{
  "mcpServers": {
    "meridian": {
      "command": "node",
      "args": ["C:\\Users\\raris\\wass-ai-ops-lab\\mcp\\meridian-mcp-server.mjs"],
      "env": { "MERIDIAN_API_BASE": "https://app.raristotle.com" }
    }
  }
}
```

Restart Claude Desktop, then ask things like *"What does Meridian stock that
replaces a Bussmann FRN-R-30?"* or *"Search for 20A breakers in stock and check
availability."*

## Connect from Claude Code

```bash
claude mcp add meridian -- node C:\\Users\\raris\\wass-ai-ops-lab\\mcp\\meridian-mcp-server.mjs
```

> On Windows, register stdio MCP servers with the **absolute** path to `node`
> and the script; a bare command can fail to connect.

## Other MCP servers

Two dev-tooling MCP servers ship alongside this one — a **read-only Postgres**
server (DBHub → Neon) and the **Vercel** hosted server (deploy health / logs).
They are registered in a repo-root `.mcp.json` and documented in
[docs/mcp-servers.md](../docs/mcp-servers.md). All three can run together.
