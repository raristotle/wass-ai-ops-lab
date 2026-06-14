import { NextResponse } from "next/server";
import {
  ASSISTANT_TOOLS,
  ASSISTANT_SYSTEM_PROMPT,
  ASSISTANT_MODEL_DEFAULT,
  assistantDisabledReply,
  isAssistantEnabled,
  validateMessages,
  toolUsesFrom,
  textFrom,
  type AssistantTextMessage,
} from "@/lib/product-finder-assistant";
import { getCatalog } from "@/lib/catalog/index";
import { searchCatalog } from "@/lib/catalog/search";
import { parseSearchQuery } from "@/lib/catalog/schemas";
import { verifiedCrossesFor } from "@/lib/catalog/verified-crosses";
import { findCrossSuggestion } from "@/lib/catalog/bom-cross";
import { brandHierarchyFor } from "@/lib/catalog/brand-hierarchy";
import { identifierKey } from "@/lib/catalog/identifiers";
import {
  resolvedCrossEntries,
  resolveStocked,
  provenancedIndex,
} from "@/lib/catalog/cross-runtime";
import type { CatalogProduct } from "@/features/product-finder/types";

export const dynamic = "force-dynamic";

const totalStock = (p: CatalogProduct) =>
  p.branchStock.reduce((s, b) => s + b.quantity, 0) + p.dcStock.reduce((s, d) => s + d.quantity, 0);

function resolveProduct(idOrSku: string): CatalogProduct | null {
  const catalog = getCatalog();
  const byId = catalog.byId.get(idOrSku);
  if (byId) return byId;
  const key = identifierKey(idOrSku);
  const provenanced = provenancedIndex().get(key);
  if (provenanced && provenanced.length > 0) return provenanced[0];
  // Fall back to the top search hit.
  const sp = new URLSearchParams({ q: idOrSku, pageSize: "1" });
  const res = searchCatalog(parseSearchQuery(sp));
  return res.items[0] ?? null;
}

/** Execute one assistant tool call against the live catalog. Returns plain JSON. */
async function dispatch(name: string, input: Record<string, unknown>): Promise<unknown> {
  if (name === "search_products") {
    const sp = new URLSearchParams();
    sp.set("q", String(input.query ?? ""));
    if (input.inStockOnly) sp.set("onlyBranchStock", "true");
    sp.set("pageSize", String(Math.min(Number(input.limit) || 6, 12)));
    const res = searchCatalog(parseSearchQuery(sp));
    return {
      total: res.total,
      results: res.items.map((p) => ({
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        subcategory: p.subcategory,
        unitPrice: p.unitPrice,
        uom: p.uom,
        inStock: totalStock(p) > 0,
        dataSource: p.dataSource,
      })),
    };
  }

  if (name === "cross_reference") {
    const partNumber = String(input.partNumber ?? "");
    if (!partNumber) return { error: "partNumber required" };
    const s = findCrossSuggestion(partNumber, resolvedCrossEntries(), resolveStocked, (mpn) =>
      (provenancedIndex().get(identifierKey(mpn)) ?? []).length > 0
    );
    if (!s) return { partNumber, crossed: false, message: "No documented cross to a stocked product." };
    return {
      partNumber,
      crossed: true,
      from: `${s.fromBrand} ${s.fromMpn}`,
      stockedEquivalent: { sku: s.product.sku, name: s.product.name, brand: s.product.brand, unitPrice: s.product.unitPrice, uom: s.product.uom },
      relation: s.relation,
      confidence: s.confidence,
      matchReason: s.matchReason,
      source: s.sourceUrl,
    };
  }

  if (name === "product_detail") {
    const product = resolveProduct(String(input.idOrSku ?? ""));
    if (!product) return { found: false };
    const crosses =
      product.dataSource === "verified" || product.dataSource === "curated"
        ? verifiedCrossesFor(product, resolvedCrossEntries(), resolveStocked).map((c) => ({
            substitute: `${c.substituteBrand} ${c.substituteSku}`,
            confidence: c.confidence,
            relation: c.relation,
            stocked: !!c.substituteProduct,
            source: c.sourceUrl,
          }))
        : [];
    return {
      found: true,
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      subcategory: product.subcategory,
      unitPrice: product.unitPrice,
      uom: product.uom,
      specs: product.specs,
      specSheetUrl: product.specSheetUrl ?? null,
      branchStock: product.branchStock.reduce((s, b) => s + b.quantity, 0),
      dcStock: product.dcStock.reduce((s, d) => s + d.quantity, 0),
      verifiedCrosses: crosses,
      brandHierarchy: brandHierarchyFor(product.brand),
    };
  }

  return { error: `Unknown tool: ${name}` };
}

interface AnthropicBlock {
  type: string;
  [k: string]: unknown;
}

/** Run the Anthropic tool-use loop until the model answers. */
async function runAnthropic(messages: AssistantTextMessage[], env: NodeJS.ProcessEnv) {
  const model = env.ANTHROPIC_MODEL || ASSISTANT_MODEL_DEFAULT;
  const convo: { role: "user" | "assistant"; content: unknown }[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  const toolsUsed = new Set<string>();

  for (let step = 0; step < 6; step++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": String(env.ANTHROPIC_API_KEY),
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: ASSISTANT_SYSTEM_PROMPT,
        tools: ASSISTANT_TOOLS,
        messages: convo,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Anthropic ${res.status}: ${t.slice(0, 200)}`);
    }
    const data = (await res.json()) as { stop_reason?: string; content?: AnthropicBlock[] };
    const toolUses = toolUsesFrom(data.content);
    if (data.stop_reason !== "tool_use" || toolUses.length === 0) {
      return { reply: textFrom(data.content) || "(no answer)", toolsUsed: [...toolsUsed] };
    }
    convo.push({ role: "assistant", content: data.content });
    const results = [];
    for (const tu of toolUses) {
      toolsUsed.add(tu.name);
      const result = await dispatch(tu.name, tu.input);
      results.push({ type: "tool_result", tool_use_id: tu.id, content: JSON.stringify(result) });
    }
    convo.push({ role: "user", content: results });
  }
  return { reply: "I couldn't finish that — try narrowing the question to one part or spec.", toolsUsed: [...toolsUsed] };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const messages = validateMessages(body);
  if (!messages) {
    return NextResponse.json({ error: "Provide { messages: [{role, content}] } ending in a user turn." }, { status: 400 });
  }
  if (!isAssistantEnabled()) {
    return NextResponse.json({ enabled: false, reply: assistantDisabledReply(), toolsUsed: [] });
  }
  try {
    const { reply, toolsUsed } = await runAnthropic(messages, process.env);
    return NextResponse.json({ enabled: true, reply, toolsUsed });
  } catch (e) {
    return NextResponse.json(
      {
        enabled: true,
        reply: "Sorry — Ask Meridian hit an error reaching the model. Try again in a moment.",
        toolsUsed: [],
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 200 }
    );
  }
}

/** GET → whether the assistant is currently activated (for the UI's banner). */
export function GET() {
  return NextResponse.json({ enabled: isAssistantEnabled(), model: process.env.ANTHROPIC_MODEL || ASSISTANT_MODEL_DEFAULT });
}
