#!/usr/bin/env node
/**
 * Meridian Product Finder — MCP server.
 *
 * Exposes the recommender's catalog, source-backed cross-references, stock, and
 * coverage as Model Context Protocol tools, so any MCP client (Claude Desktop,
 * Claude Code, an agent) can do procurement against it: search the catalog,
 * convert a competitor part to the stocked equivalent we document, read specs
 * and live availability, and pull the cross-reference coverage summary.
 *
 * It is a thin, stateless HTTP client over the deployed REST API — no database,
 * no AI, no per-call cost. Point it at any environment with MERIDIAN_API_BASE.
 *
 * Run:    node mcp/meridian-mcp-server.mjs         (stdio transport)
 * Config: see mcp/README.md for the Claude Desktop / Claude Code entry.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const API_BASE = (process.env.MERIDIAN_API_BASE ?? "https://app.raristotle.com").replace(/\/$/, "");
const UA = "meridian-mcp-server/1.0";
// Server-to-server bearer for the gated durable endpoints (jobs/orders/vmi/...).
// Must match the deployment's WRITE_API_TOKEN. Read tools work without it; write
// tools (create_job/place_order) require it when the deployment has the gate on.
const API_TOKEN = process.env.MERIDIAN_API_TOKEN?.trim();

async function api(path, init) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "User-Agent": UA,
      ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    // Surface the response body so callers see WHY (e.g. which SKUs were unresolved),
    // not just an opaque status code.
    let detail = "";
    try {
      detail = (await res.text()).slice(0, 500);
    } catch {
      /* ignore */
    }
    throw new Error(`${path} → HTTP ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  return res.json();
}

/** Small deterministic hash for a content-derived idempotency key (mirrors lib/stable-id). */
function fnv1aHex(input) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

const ok = (data) => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
const fail = (msg) => ({ content: [{ type: "text", text: `Error: ${msg}` }], isError: true });

// Compact a companion (from /api/companions) for an agent: SKU + why + attach score.
const slimCompanion = (c) => ({
  sku: c.product.sku,
  name: c.product.name,
  brand: c.product.brand,
  subcategory: c.product.subcategory,
  unitPrice: c.product.unitPrice,
  relation: c.relation,
  attachScore: c.attachScore,
  reasons: c.reasons,
  inStock: c.product.inStock,
});

// ── Tool implementations ──────────────────────────────────────────────────────

const TOOLS = {
  async search_products({ query, category, inStockOnly, limit }) {
    const sp = new URLSearchParams();
    if (query) sp.set("q", String(query));
    if (category) sp.set("category", String(category));
    if (inStockOnly) sp.set("onlyBranchStock", "true");
    sp.set("pageSize", String(Math.min(Number(limit) || 10, 24)));
    const res = await api(`/api/products/search?${sp.toString()}`);
    return ok({
      total: res.total,
      results: (res.items ?? []).map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        category: p.category,
        subcategory: p.subcategory,
        unitPrice: p.unitPrice,
        uom: p.uom,
        dataSource: p.dataSource,
        verifiedCrossCount: p.verifiedCrossCount ?? 0,
        branchStock: (p.branchStock ?? []).reduce((s, b) => s + b.quantity, 0),
        dcStock: (p.dcStock ?? []).reduce((s, d) => s + d.quantity, 0),
      })),
    });
  },

  async cross_reference({ partNumber }) {
    if (!partNumber) return fail("partNumber is required");
    const res = await api(`/api/crosses/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries: [String(partNumber)] }),
    });
    const s = (res.suggestions ?? [])[0];
    if (!s) return ok({ partNumber, crossed: false, message: "No documented cross to a stocked product." });
    return ok({
      partNumber,
      crossed: true,
      fromBrand: s.fromBrand,
      fromMpn: s.fromMpn,
      stockedEquivalent: { sku: s.product.sku, name: s.product.name, brand: s.product.brand, unitPrice: s.product.unitPrice, uom: s.product.uom, id: s.product.id },
      relation: s.relation,
      confidence: s.confidence,
      matchReason: s.matchReason,
      source: s.sourceUrl,
    });
  },

  async bulk_cross_reference({ partNumbers }) {
    if (!Array.isArray(partNumbers) || partNumbers.length === 0) return fail("partNumbers must be a non-empty array");
    const res = await api(`/api/crosses/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries: partNumbers.slice(0, 100).map(String) }),
    });
    return ok({
      rows: (res.suggestions ?? []).map((s, i) => ({
        input: partNumbers[i],
        stockedSku: s?.product.sku ?? null,
        name: s?.product.name ?? null,
        confidence: s?.confidence ?? null,
        source: s?.sourceUrl ?? null,
      })),
    });
  },

  async product_detail({ idOrSku }) {
    if (!idOrSku) return fail("idOrSku is required");
    let id = String(idOrSku);
    if (!id.startsWith("REAL-") && !id.includes("-")) {
      // Looks like a bare SKU — resolve via search first.
      const search = await api(`/api/products/search?q=${encodeURIComponent(id)}&pageSize=1`);
      const hit = (search.items ?? [])[0];
      if (!hit) return ok({ idOrSku, found: false });
      id = hit.id;
    }
    let detail;
    try {
      detail = await api(`/api/products/${encodeURIComponent(id)}`);
    } catch {
      const search = await api(`/api/products/search?q=${encodeURIComponent(String(idOrSku))}&pageSize=1`);
      const hit = (search.items ?? [])[0];
      if (!hit) return ok({ idOrSku, found: false });
      detail = await api(`/api/products/${encodeURIComponent(hit.id)}`);
    }
    const p = detail.product;
    return ok({
      found: true,
      sku: p.sku,
      name: p.name,
      brand: p.brand,
      category: p.category,
      subcategory: p.subcategory,
      description: p.description,
      unitPrice: p.unitPrice,
      uom: p.uom,
      dataSource: p.dataSource,
      specs: p.specs,
      specSheetUrl: p.specSheetUrl ?? null,
      branchStock: (p.branchStock ?? []).reduce((s, b) => s + b.quantity, 0),
      dcStock: (p.dcStock ?? []).reduce((s, d) => s + d.quantity, 0),
      verifiedCrosses: (detail.verifiedCrosses ?? []).map((c) => ({
        substitute: `${c.substituteBrand} ${c.substituteSku}`,
        confidence: c.confidence,
        relation: c.relation,
        stocked: !!c.substituteProduct,
        source: c.sourceUrl,
      })),
      brandHierarchy: detail.brandHierarchy ?? null,
    });
  },

  async check_availability({ sku }) {
    const r = await TOOLS.product_detail({ idOrSku: sku });
    if (r.isError) return r;
    const d = JSON.parse(r.content[0].text);
    if (!d.found) return ok({ sku, found: false });
    return ok({ sku: d.sku, name: d.name, branchStock: d.branchStock, dcStock: d.dcStock, inStock: d.branchStock + d.dcStock > 0 });
  },

  async coverage_summary() {
    const c = await api(`/api/crosses/coverage`);
    return ok({
      sourceBackedPairs: c.pairs,
      bothSidesStocked: c.bothStocked,
      oneSideStocked: c.oneStocked,
      pairsByCategory: c.byCategory,
      sourceWorkbook: { rows: c.sources.workbookRows, sources: c.sources.total, byStatus: c.sources.byStatus },
      verifiedProducts: c.products,
    });
  },

  // ── Transactional (write) tools — agentic checkout over the durable store ────

  async create_job({ name, customer }) {
    if (!name) return fail("name is required");
    const now = Date.now();
    const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) || "job";
    const job = {
      id: `job-${slug}-${now}`,
      name: String(name).trim(),
      customer: customer ? String(customer).trim() : "—",
      customerId: null,
      status: "open",
      artifacts: [],
      createdAt: now,
      updatedAt: now,
    };
    const res = await api(`/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
    });
    return ok({ created: res.ok === true, jobId: job.id, persisted: res.persisted, job });
  },

  async list_jobs() {
    const res = await api(`/api/jobs`);
    return ok({
      backend: res.backend,
      count: res.count,
      jobs: (res.jobs ?? []).map((j) => ({
        id: j.id,
        name: j.name,
        customer: j.customer,
        status: j.status,
        artifacts: (j.artifacts ?? []).length,
      })),
    });
  },

  async place_order({ items, customer, jobId, clientRef }) {
    if (!Array.isArray(items) || items.length === 0) return fail("items must be a non-empty array of { sku, qty }");
    // Validate qty explicitly rather than silently coercing garbage to 1.
    const norm = [];
    for (const i of items) {
      const sku = String(i?.sku ?? "").trim();
      const qn = Number(i?.qty);
      if (!sku) return fail("each item needs a sku");
      if (!Number.isFinite(qn) || qn < 1) return fail(`invalid qty for ${sku}: ${i?.qty} (must be a positive number)`);
      if (qn > 100000) return fail(`qty for ${sku} exceeds the 100000-per-line limit`);
      norm.push({ sku, qty: Math.floor(qn) });
    }
    // Idempotency: when the caller does not thread a stable clientRef, derive one
    // from the order CONTENT so a retry of the same basket collapses to one order
    // instead of double-placing (a per-call timestamp would defeat idempotency).
    const ref = clientRef
      ? String(clientRef)
      : `mcp-${fnv1aHex(JSON.stringify({ items: [...norm].sort((a, b) => (a.sku < b.sku ? -1 : 1)), customer: customer ?? null, jobId: jobId ?? null }))}`;
    const body = { clientRef: ref, items: norm, source: "mcp" };
    if (customer) body.customer = String(customer);
    if (jobId) body.jobId = String(jobId);
    const res = await api(`/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const out = { ...res };
    if (Array.isArray(res.unresolved) && res.unresolved.length > 0) {
      out.warning = `Order placed, but ${res.unresolved.length} requested SKU(s) are not carried and were OMITTED: ${res.unresolved.join(", ")}. Confirm the order covers what was intended.`;
    }
    return ok(out);
  },

  // ── Cross-sell tool-pack (v5-S1) — companions / complete-assembly / substitutes ──

  async get_companions({ sku, branchId }) {
    if (!sku) return fail("sku is required");
    const r = await api(`/api/companions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skus: [String(sku)], mode: "attach", branchId: branchId ? String(branchId) : undefined }),
    });
    if (r.unresolved) return ok({ sku, carried: false, companions: [] });
    return ok({ sku, companions: (r.attach ?? []).map(slimCompanion) });
  },

  async complete_assembly({ skus, branchId }) {
    if (!Array.isArray(skus) || skus.length === 0) return fail("skus must be a non-empty array");
    const r = await api(`/api/companions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skus: skus.map(String), mode: "complete-assembly", branchId: branchId ? String(branchId) : undefined }),
    });
    return ok({
      resolved: r.resolved ?? 0,
      missingRequired: (r.missingRequired ?? []).map(slimCompanion),
      recommended: (r.recommended ?? []).map(slimCompanion),
    });
  },

  async attach_suggestions({ skus, branchId }) {
    if (!Array.isArray(skus) || skus.length === 0) return fail("skus must be a non-empty array");
    const r = await api(`/api/companions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skus: skus.map(String), mode: "attach", branchId: branchId ? String(branchId) : undefined }),
    });
    return ok({ resolved: r.resolved ?? 0, attach: (r.attach ?? []).map(slimCompanion) });
  },

  async get_substitutes({ sku }) {
    if (!sku) return fail("sku is required");
    const r = await TOOLS.product_detail({ idOrSku: sku });
    if (r.isError) return r;
    const d = JSON.parse(r.content[0].text);
    if (!d.found) return ok({ sku, found: false, substitutes: [] });
    return ok({ sku: d.sku, name: d.name, substitutes: d.verifiedCrosses ?? [] });
  },

  // ── Quote / CPQ (v5-S3 #12) — price a basket + suggest companions, NO order ──

  async draft_quote({ items, customer, branchId }) {
    if (!Array.isArray(items) || items.length === 0) return fail("items must be a non-empty array of { sku, qty }");

    // Price each line via product_detail (resolves SKU or carries the not-carried flag).
    const lines = [];
    const unresolved = [];
    for (const it of items) {
      const sku = String(it.sku ?? "");
      const qty = Math.max(1, Number(it.qty) || 1);
      const r = await TOOLS.product_detail({ idOrSku: sku });
      if (r.isError) { unresolved.push(sku); continue; }
      const d = JSON.parse(r.content[0].text);
      if (!d.found) { unresolved.push(sku); continue; }
      const unitPrice = Number(d.unitPrice) || 0; // never let a missing price NaN the subtotal
      lines.push({ sku: d.sku, name: d.name, brand: d.brand, qty, unitPrice, extended: Math.round(unitPrice * qty * 100) / 100 });
    }

    // Attach companions for the whole basket (the S1 cross-sell rail).
    let companions = [];
    if (lines.length > 0) {
      const c = await api(`/api/companions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skus: lines.map((l) => l.sku), mode: "attach", branchId: branchId ? String(branchId) : undefined }),
      });
      companions = (c.attach ?? []).map(slimCompanion);
    }

    const subtotal = Math.round(lines.reduce((s, l) => s + l.extended, 0) * 100) / 100;
    return ok({
      customer: customer ? String(customer) : null,
      lines,
      subtotal,
      companions,
      unresolved,
      note: "Draft only — no order placed. Use place_order to book it.",
    });
  },

  // ── CRM bridge (v5-S3 #13) — push a won quote to HubSpot or Salesforce (dormant) ──

  // ── Data ingestion (Sprint D1) — renewable source-adapter framework ──────────

  async ingest_status() {
    const r = await api(`/api/ingest/status`);
    return ok({
      persisted: r.persisted,
      liveSourcesConfigured: r.liveSourcesConfigured,
      sources: (r.sources ?? []).map((s) => ({
        id: s.id,
        label: s.label,
        segment: s.segment,
        dataTypes: s.dataTypes,
        records: s.records,
        lastFetchedIso: s.lastFetchedIso,
      })),
      recentRuns: (r.recentRuns ?? []).slice(0, 10).map((run) => ({
        adapterId: run.adapterId,
        runAtIso: run.runAtIso,
        kept: run.kept,
        dropped: run.dropped,
        diff: run.diff,
        error: run.error ?? null,
      })),
    });
  },

  async ingest_run({ adapterIds }) {
    const body = {};
    if (Array.isArray(adapterIds) && adapterIds.length) body.adapterIds = adapterIds.map(String);
    const r = await api(`/api/ingest/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return ok({
      ok: r.ok === true,
      persisted: r.persisted,
      headline: r.headline,
      reports: (r.reports ?? []).map((run) => ({
        adapterId: run.adapterId,
        label: run.label,
        fetched: run.fetched,
        parsed: run.parsed,
        kept: run.kept,
        dropped: run.dropped,
        diff: run.diff,
        sampleAdded: run.sampleAdded,
        error: run.error ?? null,
      })),
    });
  },

  async push_quote_to_crm({ email, dealName, amount, firstName, lastName, provider }) {
    if (!email || !dealName || amount == null) return fail("email, dealName, and amount are required");
    const r = await api(`/api/crm/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(email),
        dealName: String(dealName),
        amount: Number(amount),
        firstName: firstName ? String(firstName) : undefined,
        lastName: lastName ? String(lastName) : undefined,
        provider: provider === "salesforce" ? "salesforce" : "hubspot",
      }),
    });
    if (r.enabled === false) {
      return ok({ synced: false, reason: r.reason, hint: "The CRM seam is dormant — set its keys to enable (HubSpot: HUBSPOT_PRIVATE_APP_TOKEN; Salesforce: SALESFORCE_ACCESS_TOKEN + SALESFORCE_INSTANCE_URL)." });
    }
    return ok({ synced: true, ...r });
  },
};

const TOOL_DEFS = [
  {
    name: "search_products",
    description:
      "Search the Meridian product catalog by natural-language query. Returns stocked products with SKU, brand, price, stock, and how many source-backed cross-references each has. Use for 'what do you carry for X'.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search text, e.g. '20A breaker' or 'cat6 plenum'." },
        category: { type: "string", enum: ["electrical", "datacom", "oem-electrical", "av", "security", "safety"] },
        inStockOnly: { type: "boolean", description: "Only return products in stock at a branch." },
        limit: { type: "number", description: "Max results (default 10, max 24)." },
      },
      required: ["query"],
    },
  },
  {
    name: "cross_reference",
    description:
      "Convert ONE competitor or legacy part number to the stocked Meridian equivalent we DOCUMENT, with the source citation and confidence. Only ≥95% source-backed crosses are returned. Use for 'what do you stock that replaces <competitor part>'.",
    inputSchema: {
      type: "object",
      properties: { partNumber: { type: "string", description: "The competitor/legacy part number, e.g. 'FRN-R-30'." } },
      required: ["partNumber"],
    },
  },
  {
    name: "bulk_cross_reference",
    description: "Convert up to 100 competitor part numbers to stocked equivalents at once. Returns one row per input with the stocked SKU, confidence, and source (null when nothing is documented).",
    inputSchema: {
      type: "object",
      properties: { partNumbers: { type: "array", items: { type: "string" }, description: "Competitor/legacy part numbers." } },
      required: ["partNumbers"],
    },
  },
  {
    name: "product_detail",
    description: "Full detail for one product by id or SKU: specs, datasheet link, price, branch/DC stock, source-backed cross-references, and brand hierarchy. Use to answer spec questions and check substitutes.",
    inputSchema: {
      type: "object",
      properties: { idOrSku: { type: "string", description: "Product id (REAL-…) or a SKU/part number." } },
      required: ["idOrSku"],
    },
  },
  {
    name: "check_availability",
    description: "Branch and DC stock totals for a product by SKU, and whether it is in stock.",
    inputSchema: {
      type: "object",
      properties: { sku: { type: "string" } },
      required: ["sku"],
    },
  },
  {
    name: "coverage_summary",
    description: "The cross-reference dataset coverage: source-backed pair counts, both-sides-stocked, pairs by category, and the source-workbook ingest-status breakdown. No arguments.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "create_job",
    description:
      "Create a durable Job (project) workspace to group quotes/orders for one jobsite. Returns the jobId to pass to place_order. Persists server-side (Neon when configured).",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Jobsite / project name, e.g. 'Acme Warehouse — Phase 2'." },
        customer: { type: "string", description: "Customer / account name." },
      },
      required: ["name"],
    },
  },
  {
    name: "list_jobs",
    description: "List the durable Job workspaces with their status and linked-artifact counts. No arguments.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "place_order",
    description:
      "Place a durable order for a list of { sku, qty } against the catalog (agentic checkout). This is a REAL, money-moving action — confirm the basket and total with the user before calling. SKUs are resolved + priced server-side (any not-carried SKUs are omitted and reported in `unresolved`/`warning`); pass an optional jobId to roll the order into a Job. Idempotent: a stable `clientRef` makes a retry return the same order; if you omit it, a content hash of the basket is used so an identical retry still won't double-place. To preview pricing without booking, use search_products/product_detail first.",
    inputSchema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          description: "Line items to order.",
          items: {
            type: "object",
            properties: { sku: { type: "string" }, qty: { type: "number" } },
            required: ["sku", "qty"],
          },
        },
        customer: { type: "string", description: "Customer / account name." },
        jobId: { type: "string", description: "Optional Job id (from create_job/list_jobs) to attach the order to." },
        clientRef: { type: "string", description: "Idempotency key — a stable reference for this checkout. A repeat call with the same clientRef returns the existing order." },
      },
      required: ["items"],
    },
  },

  // ── Cross-sell tool-pack (v5-S1) ────────────────────────────────────────────
  {
    name: "get_companions",
    description:
      "Cross-sell: given ONE carried SKU, return its companion products — the parts that go with it — each with a relation (`required` = engineering-mandatory, e.g. a switch needs a wall plate; `recommended` = commonly attached), an attach score (0-100), and the reasons behind it. Use this to answer 'what else do they need with this?' Pass branchId to bias toward locally-stocked companions.",
    inputSchema: {
      type: "object",
      properties: {
        sku: { type: "string", description: "The carried SKU to find companions for." },
        branchId: { type: "string", description: "Optional branch id to prefer in-stock companions." },
      },
      required: ["sku"],
    },
  },
  {
    name: "complete_assembly",
    description:
      "Cross-sell: given a SET of SKUs (a BOM, cart, or quote), return `missingRequired` — the engineering-mandatory companions that are NOT yet in the set ('you have switches and conduit but no wall plates or fittings') — plus the top `recommended` add-ons. Use this to catch incomplete assemblies before a quote goes out.",
    inputSchema: {
      type: "object",
      properties: {
        skus: { type: "array", items: { type: "string" }, description: "The SKUs already in the BOM / cart." },
        branchId: { type: "string", description: "Optional branch id to prefer in-stock companions." },
      },
      required: ["skus"],
    },
  },
  {
    name: "attach_suggestions",
    description:
      "Cross-sell: given the SKUs in a cart/order, return the deduped 'complete your order' attach rail across the whole basket (required first, then by attach score), excluding items already in the cart. Use this for the order-level upsell prompt.",
    inputSchema: {
      type: "object",
      properties: {
        skus: { type: "array", items: { type: "string" }, description: "The SKUs currently in the cart / order." },
        branchId: { type: "string", description: "Optional branch id to prefer in-stock companions." },
      },
      required: ["skus"],
    },
  },
  {
    name: "get_substitutes",
    description:
      "Given ONE carried SKU, return its verified cross-reference substitutes (the documented equivalent parts) so you can offer an in-stock or preferred-line alternative. Returns [] when no documented crosses exist for that SKU.",
    inputSchema: {
      type: "object",
      properties: {
        sku: { type: "string", description: "The carried SKU to find substitutes for." },
      },
      required: ["sku"],
    },
  },

  // ── Quote / CPQ + CRM (v5-S3) ───────────────────────────────────────────────
  {
    name: "draft_quote",
    description:
      "Build a DRAFT quote (no order) from a list of { sku, qty }: each line is priced server-side, the subtotal is computed, and the cross-sell companions for the whole basket are attached. Not-carried SKUs are reported in `unresolved`. Use this to price-and-pitch before committing; use place_order to actually book it.",
    inputSchema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          description: "Line items to quote.",
          items: {
            type: "object",
            properties: { sku: { type: "string" }, qty: { type: "number" } },
            required: ["sku", "qty"],
          },
        },
        customer: { type: "string", description: "Customer / account name (echoed back)." },
        branchId: { type: "string", description: "Optional branch id to bias companion stock." },
      },
      required: ["items"],
    },
  },
  // ── Data ingestion (Sprint D1) ──────────────────────────────────────────────
  {
    name: "ingest_status",
    description:
      "Read the renewable data-ingestion status: which Source Adapters are registered (id, label, segment, data types), how many gated records each holds in its last snapshot, and the recent run log (kept/dropped/diff per run). Use to see what product/spec/cross-reference sources the recommender is harvesting and when they last refreshed. No arguments.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "ingest_run",
    description:
      "Trigger a renewable ingestion run: for each selected Source Adapter (or all registered when omitted) it fetches → parses → gates on provenance (confidence ≥95) → snapshots → diffs vs the last pull, returning per-source counts (kept/dropped) and the added/changed/removed diff. The default deploy registers only the network-free self-test adapter (a $0 demonstration); live external sources run only when an operator has declared them via INGEST_SOURCES. NOT a scheduled job — this is the explicit re-run trigger.",
    inputSchema: {
      type: "object",
      properties: {
        adapterIds: {
          type: "array",
          items: { type: "string" },
          description: "Restrict the run to these adapter ids (from ingest_status). Omit to run all registered adapters.",
        },
      },
    },
  },
  {
    name: "push_quote_to_crm",
    description:
      "Push a won quote to CRM — HubSpot (Contact + Deal) or Salesforce (Contact + Opportunity), chosen by `provider` (default hubspot). Each CRM is DORMANT until its keys are set; a dormant call returns { synced:false, reason:'no-keys' } and makes no external call. Creation is not idempotent — dedupe by the returned id per quote.",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "The buyer's email (the CRM contact key)." },
        dealName: { type: "string", description: "Deal / opportunity name." },
        amount: { type: "number", description: "Deal amount (won quote total)." },
        firstName: { type: "string" },
        lastName: { type: "string" },
        provider: { type: "string", enum: ["hubspot", "salesforce"], description: "Target CRM (default hubspot)." },
      },
      required: ["email", "dealName", "amount"],
    },
  },
];

// ── Wire up the server ────────────────────────────────────────────────────────

const server = new Server(
  { name: "meridian-product-finder", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOL_DEFS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  const impl = TOOLS[name];
  if (!impl) return fail(`Unknown tool: ${name}`);
  try {
    return await impl(args ?? {});
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e));
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
// stderr is safe for logs; stdout is the MCP JSON-RPC channel.
console.error(`Meridian MCP server ready — API base ${API_BASE}, ${TOOL_DEFS.length} tools.`);
