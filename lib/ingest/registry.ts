/**
 * Adapter registry (Sprint D1) — the catalog of data sources the operator can run.
 *
 * The built-in self-test adapter is ALWAYS present (network-free, $0) so the framework
 * is demonstrable and the admin UI always has content. Live external sources are
 * DORMANT by default and only appear when an operator declares them in the
 * `INGEST_SOURCES` env var — a JSON array of schema.org adapter configs. This keeps the
 * default deploy at $0 (no outbound calls) and honors the cost guardrail: enabling a
 * source is a deliberate env change, not a code default.
 *
 * Example INGEST_SOURCES value (single-line JSON):
 *   [{"id":"schema-org:acme","label":"ACME product pages","segment":"EES",
 *     "license":"public product pages; factual specs only","brandFallback":"ACME",
 *     "urls":["https://acme.example/p/1","https://acme.example/p/2"]}]
 */

import type { SourceAdapter } from "@/lib/ingest/source-adapter";
import { makeSchemaOrgAdapter, type SchemaOrgAdapterConfig } from "@/lib/ingest/adapters/schema-org-product";
import { selfTestAdapter } from "@/lib/ingest/adapters/selftest";
import { makeDistributorAdapter, distributorClientsConfigured } from "@/lib/ingest/adapters/distributor";
import { makeManufacturerAdapter, parseEnvManufacturers } from "@/lib/ingest/adapters/manufacturer";
import { makeNexarCrossAdapter, crossReferenceClientConfigured } from "@/lib/ingest/adapters/cross-reference";
import { makeCpscRecallAdapter, cpscRecallsEnabled } from "@/lib/ingest/adapters/cpsc-recalls";
import { logApiError } from "@/lib/server/log";

/** Cap the distributor seed list so one run can't fan out to thousands of API calls. */
export const MAX_DISTRIBUTOR_MPNS = 200;

/** Parse INGEST_DISTRIBUTOR_MPNS (comma/whitespace-separated) into a capped MPN list. */
export function parseDistributorMpns(raw: string | undefined): string[] {
  if (!raw || !raw.trim()) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tok of raw.split(/[\s,]+/)) {
    const mpn = tok.trim();
    if (!mpn || seen.has(mpn.toUpperCase())) continue;
    seen.add(mpn.toUpperCase());
    out.push(mpn);
    if (out.length >= MAX_DISTRIBUTOR_MPNS) break;
  }
  return out;
}

/** Parse the INGEST_SOURCES env var into validated schema.org adapter configs. */
export function parseEnvSources(raw: string | undefined): SchemaOrgAdapterConfig[] {
  if (!raw || !raw.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    logApiError("ingest:parseEnvSources", e);
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const out: SchemaOrgAdapterConfig[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const c = item as Record<string, unknown>;
    const id = typeof c.id === "string" ? c.id : "";
    const urls = Array.isArray(c.urls) ? c.urls.filter((u): u is string => typeof u === "string") : [];
    // A source with no id or no URLs can't run — skip it rather than register a no-op.
    if (!id || urls.length === 0) continue;
    out.push({
      id,
      label: typeof c.label === "string" ? c.label : id,
      segment: typeof c.segment === "string" ? c.segment : "cross-segment",
      license: typeof c.license === "string" ? c.license : "operator-declared source",
      urls,
      brandFallback: typeof c.brandFallback === "string" ? c.brandFallback : undefined,
    });
  }
  return out;
}

/** Minimal env shape this module reads — keeps tests cast-free (process.env assignable). */
export type IngestEnv = Record<string, string | undefined>;

/** True when at least one live external source is configured. */
export function liveSourcesConfigured(): boolean {
  return parseEnvSources(process.env.INGEST_SOURCES).length > 0;
}

/**
 * The distributor identity-harvest adapter (Sprint D3), or null when dormant. Active only
 * when a distributor client is keyed AND a seed MPN list is configured — otherwise there's
 * nothing to enrich and it would add a no-op source.
 */
function distributorAdapter(env: IngestEnv): SourceAdapter | null {
  const mpns = parseDistributorMpns(env.INGEST_DISTRIBUTOR_MPNS);
  // NOTE: the seed list comes from the injected `env`, but the distributor KEYS are read
  // from process.env (via the integration seams) — same source the adapter's fetch() uses,
  // so registration and fetching stay consistent. An injected fake key won't activate this;
  // that's intentional (it fails safe to dormant/$0, never over-registers).
  if (mpns.length === 0 || !distributorClientsConfigured()) return null;
  return makeDistributorAdapter({
    id: "distributor:identity",
    label: "Distributor identity harvest (Mouser/Digi-Key/Nexar)",
    segment: "cross-segment",
    mpns,
  });
}

/**
 * The Nexar second-source cross-reference adapter (Sprint D5), or null when dormant. Shares
 * the distributor seed list (INGEST_DISTRIBUTOR_MPNS) and is active only when Nexar is keyed.
 */
function crossReferenceAdapter(env: IngestEnv): SourceAdapter | null {
  const mpns = parseDistributorMpns(env.INGEST_DISTRIBUTOR_MPNS);
  if (mpns.length === 0 || !crossReferenceClientConfigured()) return null;
  return makeNexarCrossAdapter({
    id: "cross-reference:nexar",
    label: "Cross-reference harvest (Nexar second sources)",
    segment: "cross-segment",
    mpns,
  });
}

/**
 * The adapters available to run: the built-in self-test, the dormant distributor harvest
 * (when keyed + seeded), env-declared manufacturer harvesters (D4), plus any env-declared
 * schema.org sources. `env` is injectable. All live sources are dormant by default.
 */
export function getAdapters(env: IngestEnv = process.env): SourceAdapter[] {
  const live = parseEnvSources(env.INGEST_SOURCES).map(makeSchemaOrgAdapter);
  const manufacturers = parseEnvManufacturers(env.INGEST_MANUFACTURERS).map(makeManufacturerAdapter);
  const distributor = distributorAdapter(env);
  const crossRef = crossReferenceAdapter(env);
  const cpsc = cpscRecallsEnabled(env) ? makeCpscRecallAdapter() : null;
  const all = [
    selfTestAdapter,
    ...(distributor ? [distributor] : []),
    ...(crossRef ? [crossRef] : []),
    ...(cpsc ? [cpsc] : []),
    ...manufacturers,
    ...live,
  ];
  // Dedupe by id (first wins): two operator entries that slug to the same id must NOT both
  // register — they share one snapshot namespace and would clobber each other's diff. The
  // id is the snapshot key, so collapsing to the first is the safe, consistent behavior.
  const byId = new Map<string, SourceAdapter>();
  for (const a of all) if (!byId.has(a.id)) byId.set(a.id, a);
  return [...byId.values()];
}

/** Look up one adapter by id, or null. */
export function getAdapter(id: string, env: IngestEnv = process.env): SourceAdapter | null {
  return getAdapters(env).find((a) => a.id === id) ?? null;
}
