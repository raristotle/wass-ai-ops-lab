# WASS AI Ops Lab

Monitoring and operations dashboard for AI/LLM workloads — incidents, pipeline runs, model latency, and throughput in one view.

Also hosts the **Product Finder** (`/product-finder`) — an AI product recommender
over a deterministic **60,000-product synthetic catalog** (~77% electrical, weighted
toward common commercial/residential construction products — including 10,000+
wiring devices: receptacles, switches, wall plates, plugs, combination devices —
across 6 categories and 79 subcategories), with server-side search/suggest/detail
APIs, scored "find alternatives" recommendations, spec-level facet filters,
volume/tiered pricing, goes-with cross-sell, BOM/list import, named saved baskets,
order history with reorder, shareable cart links, out-of-stock lead times with
notify-me, printable spec sheets / comparisons / quotes (PDF), and demo auth.
It also includes a **simulated enterprise-integration layer** (`lib/integration/`)
behind swap-in adapter interfaces — customer accounts, contract/customer pricing,
live inventory/ATP, PIM catalog provenance, and competitor/legacy part
cross-reference (all on synthetic data, ready to point at real ERP/PIM/CRM/pricing
systems). See [docs/product-finder-help.md](docs/product-finder-help.md) for the
end-user guide + demo script, and
[docs/wesco-it-integration-guide.md](docs/wesco-it-integration-guide.md) for how to
connect the adapter layer to live ERP/PIM/CRM/pricing systems.

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Charts | Recharts |
| State | Zustand |
| ORM | Prisma 6 + SQLite |
| Validation | Zod |

## Prerequisites

- Node.js ≥ 20
- npm ≥ 10

## Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd wass-ai-ops-lab
npm install

# 2. Configure environment
cp .env.example .env          # DATABASE_URL already set for local SQLite

# 3. Initialise the database
npx prisma generate
npx prisma migrate dev --name init

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** The app runs entirely on mock data — no real API calls or secrets are required.

## Project Structure

```
wass-ai-ops-lab/
├── apps/
│   └── web/                 # Next.js 15 application
│       ├── app/             # App Router (layout, pages)
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       └── tsconfig.json    # Path aliases → repo-root dirs
│
├── components/              # Shared presentational components
│   ├── charts/              # Recharts wrappers (LatencyChart, ThroughputChart, …)
│   └── ui/                  # shadcn/ui primitives (Button, Card, Badge)
│
├── data/
│   └── mock/                # Static mock data — no API calls
│       ├── metrics.ts       # Time-series latency / throughput
│       ├── incidents.ts     # Incident records
│       └── pipelines.ts     # ML pipeline runs + stages
│
├── features/                # Feature modules (domain-scoped components)
│   ├── dashboard/           # Summary stats + charts layout
│   ├── incidents/           # Incident list with severity badges
│   └── pipelines/           # Pipeline stage progress view
│
├── lib/
│   ├── schemas.ts           # Zod schemas (source of truth for all types)
│   ├── store.ts             # Zustand global state
│   └── utils.ts             # cn(), formatMs(), formatTokens(), …
│
├── prisma/
│   └── schema.prisma        # Metric, Incident, Pipeline, Stage models (SQLite)
│
├── .env.example             # Environment template (no secrets)
├── CLAUDE.md                # Claude Code guide — commands + coding rules
└── README.md
```

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Dev server on :3000 (hot reload) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check (no emit) |

## Deployment

Production runs on **Vercel** (project `web`), served at
<https://web-xi-virid-59.vercel.app>.

Pushes to `master` deploy to production automatically via the Vercel GitHub
integration; pull-request branches get their own preview URLs. To deploy
manually from a linked checkout:

```bash
npx vercel --prod
```

## Prisma

```bash
npx prisma generate           # Regenerate client after schema edits
npx prisma migrate dev        # Apply pending migrations
npx prisma studio             # GUI at http://localhost:5555
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | SQLite file path |

No other variables are required. All data is mocked — there are no external API calls.
