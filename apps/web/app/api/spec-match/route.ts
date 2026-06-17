import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { searchCatalog } from "@/lib/catalog/search";
import { parseSpecRequirements, specQuery, rankSpecMatches } from "@/lib/product-finder-spec-match";
import { complianceForProduct, complianceFlags } from "@/lib/catalog/compliance";
import { generateSummary, isAssistantEnabled } from "@/lib/server/anthropic-summary";

export const dynamic = "force-dynamic";

/**
 * Spec-to-product matching agent (#20). Parses a free-text engineering spec into
 * requirements, retrieves catalog candidates (FREE deterministic search), and
 * scores each with a pass/fail table + compliance flags — always $0. When the
 * assistant is keyed (ANTHROPIC_API_KEY) it adds ONE Haiku sentence-or-two
 * summary; dormant → summary is null and the UI shows just the table.
 */
const BodySchema = z.object({ spec: z.string().trim().min(3).max(500) });

const SPEC_SYSTEM = [
  "You are an electrical product-selection assistant for a distributor.",
  "Given an engineering spec and a ranked candidate list with pass/fail spec checks, write 2-3 sentences:",
  "name the best COMPLIANT part (BRAND + SKU), call out any failed or unstated checks to verify, and",
  "NEVER claim a spec/rating that is not in the provided checks.",
].join(" ");

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid spec." }, { status: 400 });

    const reqs = parseSpecRequirements(parsed.data.spec);
    const query = specQuery(reqs) || parsed.data.spec;
    const items = searchCatalog({ text: query, page: 0, pageSize: 24 }).items;
    const matches = rankSpecMatches(items, reqs, 8).map((m) => {
      const c = complianceForProduct(m.product);
      return {
        product: m.product,
        checks: m.checks,
        passCount: m.passCount,
        total: m.total,
        allPass: m.allPass,
        score: m.score,
        complianceFlags: c ? complianceFlags(c) : [],
      };
    });

    const userContent = [
      `Spec: ${parsed.data.spec}`,
      `Requirements: ${reqs.map((r) => `${r.attr} ${r.op} ${r.value}`).join("; ") || "(none parsed)"}`,
      "Candidates (pass/total):",
      ...matches
        .slice(0, 5)
        .map((m) => `- ${m.product.brand} ${m.product.sku}: ${m.passCount}/${m.total}${m.allPass ? " (all pass)" : ""}`),
    ].join("\n");
    const summary = await generateSummary(SPEC_SYSTEM, userContent, 400);

    return NextResponse.json({ enabled: isAssistantEnabled(), requirements: reqs, matches, summary });
  } catch (e) {
    logApiError("/api/spec-match:POST", e);
    return NextResponse.json({ error: "Could not match the spec." }, { status: 400 });
  }
}
