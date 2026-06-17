# MCP servers (developer tooling)

Sprint-1 adds two **dev-tooling** MCP servers for Claude Code / Claude Desktop:

| Server | What it gives an agent | Cost | Secret |
|---|---|---|---|
| `neon-readonly` | Read-only SQL over the live Neon database (query products / quotes / orders / VMI directly, no API round-trip) | $0 (OSS) | A read-only Neon connection string in your shell — never committed, never in Vercel |
| `vercel` | Deploy health, build/runtime logs, project & env metadata for the `web` project | $0 (beta) | None — OAuth in the browser |

These are **not app code**. The Vercel production build never reads `.mcp.json`, so
they have zero runtime, bundle, or behavior impact on `app.raristotle.com`. They are
dormant by construction: nothing runs until *you* set the env var / complete OAuth on
your own machine. (The recommender's own server — `mcp/meridian-mcp-server.mjs` — is
unchanged; see [mcp/README.md](../mcp/README.md). All three can coexist.)

> **Note on `.mcp.json`:** registering MCP servers modifies Claude Code's own startup
> config, so it is a step you apply deliberately rather than one the agent auto-writes.
> Create the repo-root `.mcp.json` below yourself (or use the `claude mcp add` commands).

## Repo-root `.mcp.json`

```json
{
  "mcpServers": {
    "neon-readonly": {
      "command": "npx",
      "args": ["-y", "@bytebase/dbhub@latest", "--transport", "stdio", "--readonly", "--dsn", "${POSTGRES_RO_URL}"]
    },
    "vercel": {
      "type": "http",
      "url": "https://mcp.vercel.com/mike-w-s-projects/web"
    }
  }
}
```

`${POSTGRES_RO_URL}` is expanded by Claude Code from your environment — the secret is
never inlined. If the var is unset, Claude Code simply skips that server (the dormant
behavior we want). Equivalent CLI registration:

```bash
# from the repo root
claude mcp add neon-readonly -- npx -y @bytebase/dbhub@latest --transport stdio --readonly --dsn "$POSTGRES_RO_URL"
claude mcp add --transport http vercel https://mcp.vercel.com/mike-w-s-projects/web
```

---

## 1. `neon-readonly` — read-only Postgres MCP (DBHub → Neon)

We use [DBHub](https://github.com/bytebase/dbhub) (`@bytebase/dbhub`, `--readonly`).
The old `@modelcontextprotocol/server-postgres` reference server was **deprecated and
archived in July 2025** and has a SQL-injection CVE that defeated its own read-only
mode — do not use it. DBHub is actively maintained, npx-runnable (no Python/Docker),
and its `--readonly` flag is defense-in-depth *on top of* a least-privilege DB role.

### Activate (developer machine only)

1. **Provision the read-only role** — run [`scripts/neon-readonly-role.sql`](../scripts/neon-readonly-role.sql)
   once in the Neon SQL Editor as your Neon owner role. It creates `meridian_ro` with
   `SELECT`-only on `public` (no INSERT/UPDATE/DELETE/CREATE).
2. **Build the connection string** from the Neon dashboard for role `meridian_ro`.
   Prefer the **pooled** host (contains `-pooler`) for an interactive query tool:
   `postgresql://meridian_ro:<pwd>@ep-xxxx-pooler.<region>.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
3. **Export it** — never commit, never add to Vercel:
   - PowerShell: `$env:POSTGRES_RO_URL='postgresql://...'`
   - bash/zsh: `export POSTGRES_RO_URL='postgresql://...'`
4. **Restart Claude Code** and approve the `neon-readonly` project server when prompted.

### Security & gotchas

- **Least privilege is the primary guard**, the `--readonly` flag is the backup. The
  role can read every table in `public` — if the DB ever holds PII/billing data,
  grant `SELECT` on specific views instead of `ALL TABLES`.
- **Pooled vs direct:** use the pooled host here; the direct host only matters for
  session-level features. Both require `sslmode=require` (Neon also recommends
  `channel_binding=require`).
- **Future tables:** `ALTER DEFAULT PRIVILEGES` only covers objects created by the role
  that ran it. If Prisma migrations run as a different role, re-grant after migrations
  (the SQL script notes this).
- **Windows / npx:** `command: "npx"` works in Claude Code; if a stdio server fails to
  connect on Windows, wrap it as `"command": "cmd"`, `"args": ["/c", "npx", "-y", "@bytebase/dbhub@latest", …]`,
  or point `command` at the absolute `npx` path.

---

## 2. `vercel` — Vercel hosted MCP (deploy health / logs)

The official hosted remote MCP at `https://mcp.vercel.com` (OAuth, Streamable HTTP).
Project-scoped form is `https://mcp.vercel.com/<org-slug>/<project>` — here
`mike-w-s-projects/web`. Use the bare `https://mcp.vercel.com` instead if you want a
session that spans all your teams.

### Activate

```bash
claude mcp add --transport http vercel https://mcp.vercel.com/mike-w-s-projects/web
claude       # start Claude Code
/mcp         # opens the browser → approve → OAuth token cached locally
```

No env var, no committed secret. The connection does nothing until a developer
completes the OAuth approval.

### What it reads (relevant, read-oriented tools)

- `get_deployment` / `list_deployments` — deploy health & state
- `get_deployment_build_logs` — why a build failed
- `get_runtime_logs` — Function console/errors (filter by env, level, time, text)
- `get_project` / `list_projects` / `list_teams` — project & domain metadata

### Security & gotchas

- OAuth grants the MCP the **same access as your Vercel user account**. Keep
  human-confirmation on for tool calls and be alert to prompt-injection when mixing
  servers.
- Write-capable tools (deploy, buy-domain, etc.) live on the same server — simply don't
  invoke them for read-only deploy-health work.
- `get_runtime_logs` surfaces log contents to the agent. Combined with the project rule
  *never log raw payment payloads*, make sure the app never logs sensitive data in the
  first place.
- Beta; only Vercel-approved clients (Claude Code is one) may connect.

---

## 3. `fetch` — free web-grounding source (Sprint 2 · #12)

The reference **Fetch MCP** (`@modelcontextprotocol/server-fetch`, MIT, stdio) fetches a URL and
returns it as markdown — the **$0, no-key** way to ground Ask Meridian / datasheet-RAG answers on a
specific manufacturer bulletin or UL listing. We adopt it as the default web-grounding source
**deliberately over the Brave Search API**, which dropped its free tier (Feb 2026, now ~$5/1,000 with
a mandatory card) — choosing `fetch` is a cost-guardrail decision, not just a feature.

Add it to the repo-root `.mcp.json` (apply deliberately, like the others):

```json
"fetch": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-fetch"]
}
```

> **Windows / stdio:** if it fails to connect, point `command` at the absolute `npx`/`node` path or
> wrap as `"command": "cmd", "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-fetch"]`.

### App-side grounding seam — `lib/integration/grounding-fetch.ts`

So the app itself (not just an agent's Claude session) can ground on a URL, there is a dormant,
SSRF-hardened server seam: https-only, literal-IP / `localhost` / `*.local` / `*.internal` refused,
and **only** hosts on an explicit operator allow-list are fetchable. It is dormant until
`FETCH_GROUNDING_DOMAINS` is set (a comma list of trusted hostname suffixes, e.g.
`ul.com,intertek.com,schneider-electric.com`); responses are size-capped and tag-stripped to a text
snippet. Health flag `grounding`. Only add domains you trust.

