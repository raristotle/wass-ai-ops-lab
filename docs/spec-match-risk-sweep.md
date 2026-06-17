# Spec-match + proactive risk sweep agents (Sprint 4 · #20, #7)

Two agentic features whose candidate-finding is **deterministic + free** and whose narration is one
Claude Haiku call **gated on the existing `ANTHROPIC_API_KEY`** — so they ship dormant at $0 and only
spend tokens when activated (the datasheet-RAG pattern). Both reach via Ctrl/⌘-K.

## Spec-to-product matching (#20)

`lib/product-finder-spec-match.ts` (pure) parses a free-text spec ("NEMA 4X, 60A, 480V 3-phase, SCCR ≥
65kA") into structured requirements, and scores catalog candidates with a **pass/fail table per
requirement** (numeric `≥`/`≤` honored). `POST /api/spec-match` retrieves via the free catalog search,
scores, attaches **compliance flags** (UL/RoHS/REACH/Prop65/Section-301), and — when keyed — adds one
Haiku sentence-or-two summary. `SpecMatchModal` shows the requirements, ranked compliant SKUs with
pass/fail chips, compliance warnings, and add-to-cart.

## Proactive EOL / substitution sweep (#7)

`lib/product-finder-eol-sweep.ts` (pure, deps injected) scans the rep's **open quotes + cart** and
flags **EOL/obsolescent** and **single-source** lines with a suggested replacement — all deterministic.
`POST /api/agents/eol-sweep` resolves the line SKUs server-side (lifecycle + second-source coverage),
returns findings with a deterministic per-finding rationale, and — when keyed — one Haiku summary of
the lot. Operator-triggered (no cron). `RiskSweepModal` ("Run risk sweep") shows the findings grouped
by risk with a one-click "find replacement" search.

## Cost / activation

- **$0 and fully usable dormant**: the pass/fail tables and risk findings always work without any key;
  only the prose summaries are gated. With `ANTHROPIC_API_KEY` unset, the routes return `summary:null`
  and never call a model. The existing `assistant` health flag reflects activation.
- Both routes follow `rateLimit → requireApiAuth → Zod → logic → logApiError`; no PII is sent to the
  model (only brand + SKU + risk kind).
