import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { resolveBySku } from "@/lib/catalog/sku-index";
import { LIFECYCLE_META, lifecycleStatusForId, effectiveLifecycle } from "@/lib/catalog/lifecycle";
import { sourcingForProduct } from "@/lib/catalog/coverage-score";
import { sweepForRisks, riskRationaleTemplate, type SweepLine } from "@/lib/product-finder-eol-sweep";
import { generateSummary, isAssistantEnabled } from "@/lib/server/anthropic-summary";
import type { CatalogProduct } from "@/features/product-finder/types";

export const dynamic = "force-dynamic";

/**
 * Proactive EOL / substitution sweep agent (#7). Resolves the rep's open
 * quote/cart line SKUs and flags EOL/obsolescent or single-source risks — ALL
 * deterministic ($0). When the assistant is keyed it adds ONE Haiku summary of
 * the findings; dormant → summary is null and the UI shows the deterministic
 * per-finding rationale. Auth-gated; operator-triggered (no cron).
 */
const BodySchema = z.object({
  lines: z
    .array(
      z.object({
        sku: z.string().trim().min(1).max(64),
        qty: z.number().int().positive().max(100_000).optional(),
        source: z.string().trim().max(80).optional(),
      }),
    )
    .min(1)
    .max(300),
});

const SWEEP_SYSTEM = [
  "You are a proactive risk assistant for an electrical distributor.",
  "Given at-risk quote/cart lines (EOL/obsolescent or single-source) with suggested replacements,",
  "write a short (2-4 sentence) heads-up a rep can act on: which lines need attention and the recommended",
  "action. NEVER invent part numbers, specs, or replacements beyond those provided.",
].join(" ");

function lifecycleOf(p: CatalogProduct) {
  return effectiveLifecycle(p.lifecycleStatus ?? lifecycleStatusForId(p.id));
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

    const lines: SweepLine[] = [];
    for (const l of parsed.data.lines) {
      const p = resolveBySku(l.sku);
      if (p) lines.push({ product: p, qty: l.qty ?? 1, source: l.source ?? "Open quote" });
    }

    const findings = sweepForRisks(lines, {
      lifecycleSeverityOf: (p) => LIFECYCLE_META[lifecycleOf(p)].severity,
      lifecycleLabelOf: (p) => LIFECYCLE_META[lifecycleOf(p)].label,
      isSingleSource: (p) => sourcingForProduct(p).risk === "high",
      replacementFor: (p) => p.replacedBySku ?? null,
    });

    const out = findings.map((f) => ({
      productId: f.product.id,
      sku: f.product.sku,
      name: f.product.name,
      brand: f.product.brand,
      qty: f.qty,
      source: f.source,
      riskKind: f.riskKind,
      severity: f.severity,
      detail: f.detail,
      suggestionSku: f.suggestionSku,
      rationale: riskRationaleTemplate(f),
    }));

    // Compact prompt — brand/SKU/risk/replacement ONLY. The client-supplied
    // `source` is deliberately NOT sent to the model (it could carry a customer /
    // project name from a future caller); it stays in the findings returned to the UI.
    const promptLines = out.map(
      (f) => `- [${f.riskKind}] ${f.brand} ${f.sku}${f.suggestionSku ? ` → ${f.suggestionSku}` : ""}`,
    );
    const summary = out.length === 0 ? null : await generateSummary(SWEEP_SYSTEM, promptLines.join("\n"), 400);

    return NextResponse.json({ enabled: isAssistantEnabled(), findings: out, summary });
  } catch (e) {
    logApiError("/api/agents/eol-sweep:POST", e);
    return NextResponse.json({ error: "Could not run the risk sweep." }, { status: 400 });
  }
}
