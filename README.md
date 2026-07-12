# WASS AI Ops Lab

Monitoring and operations dashboard for AI/LLM workloads — incidents, pipeline runs, model latency, and throughput in one view.

Also hosts the **Product Finder** (`/product-finder`) — an AI product recommender
over a deterministic **200,000-product synthetic catalog** (~77% electrical, weighted
toward common commercial/residential construction products — including 10,000+
wiring devices: receptacles, switches, wall plates, plugs, combination devices —
across 6 categories and 79 subcategories), with server-side search/suggest/detail
APIs, scored "find alternatives" recommendations, spec-level facet filters,
**functional-equivalent "Find Alternatives" cross-references** (canonical-spec
interchangeability, quality-gated: top-1 = 1.0, precision@8 ≥ 0.98, with a
✓ CROSS-REF vs SIMILAR badge), volume/tiered pricing, goes-with cross-sell +
**basket-level "complete this job" cross-sell**, BOM/list import, named saved
**submittal-package PDF generator**, **bulk price & availability (RFQ) check** with
cross-reference resolution, **below-margin quote approval workflow**, baskets,
**reusable job templates /
kits**, order history with reorder + expandable line detail, **saved quotes with a
Draft→Sent→Won/Lost status workflow**, **one-click quote→order conversion**,
**simulated email-quote send**, **internal rep-margin visibility**, **quantity-aware
stock/backorder warnings**, a **manager quote-pipeline view** (open/won/lost value,
win rate, conversion rate, stale-quote alerts), **whole-order delivery ETA**
("ships complete by"), shareable cart links,
out-of-stock lead times with notify-me, **automatic in-stock substitutes for
out-of-stock products**, **CSV export** (search results + basket), printable spec
sheets / comparisons / quotes (PDF), value + numeric **range** facets,
deterministic branded product-plate images (**distinct artwork for all 79
subcategories + a key-spec callout badge**), **trade-term synonyms with
"did you mean?" typo correction** (romex → NM-B, GFI → GFCI, …),
**deep-linkable searches with a Copy link button**, **voice search** (Chrome/Edge),
a **7-step guided tour**, a **demo role quick-switcher**, a **command palette
(Ctrl+K / ⌘K)**, a **manager analytics dashboard** (Recharts) with **click-through
drill-down from every KPI/chart/row**, an **interactive in-app help panel**, and
demo auth. Live at
<https://app.raristotle.com/product-finder>.
It also includes a **simulated enterprise-integration layer** (`lib/integration/`)
behind swap-in adapter interfaces — customer accounts, contract/customer pricing,
live inventory/ATP, PIM catalog provenance, and competitor/legacy part
cross-reference (all on synthetic data, ready to point at real ERP/PIM/CRM/pricing
systems). Documentation:
[user guide](docs/product-finder-help.md) ·
[feature listing](docs/product-finder-features.md) ·
[API guide](docs/product-finder-api.md) ·
[demo script](docs/product-finder-demo-script.md) ·
[integration guide](docs/wesco-it-integration-guide.md).

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

> **Note:** Default path is mock / deterministic synthetic catalog — no secrets
> required. Optional **env-gated** live seams (Mouser/Digi-Key, FRED metals, SSO,
> Resend, PostHog, etc.) stay dormant until keys are set; see `.env.example`.

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
| `npm test` | Vitest suite (`vitest run`) — **3,698** tests as of 2026-07-12 |
| `npm run coverage` | Vitest + V8 coverage (product-finder scoped) |

## Deployment

Production runs on **Vercel** (project `web`), served at
<https://web-xi-virid-59.vercel.app> (and **https://app.raristotle.com** once the
`app` CNAME/A record is added at the registrar — A `app` → `76.76.21.21`).

Deploys are run **manually via the CLI** (`vercel --prod`) from a linked checkout —
pushing to `master` does not auto-deploy. To deploy:

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

Only `DATABASE_URL` is required for local run. Optional live/integration keys
are documented in `.env.example` (distributor quotes, commodity index, SSO,
email, analytics, persistence). Unset = dormant / synthetic path — never
required for the demo.
