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
import { logApiError } from "@/lib/server/log";

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
 * The adapters available to run: the built-in self-test plus any env-declared live
 * sources. `env` is injectable for tests.
 */
export function getAdapters(env: IngestEnv = process.env): SourceAdapter[] {
  const live = parseEnvSources(env.INGEST_SOURCES).map(makeSchemaOrgAdapter);
  return [selfTestAdapter, ...live];
}

/** Look up one adapter by id, or null. */
export function getAdapter(id: string, env: IngestEnv = process.env): SourceAdapter | null {
  return getAdapters(env).find((a) => a.id === id) ?? null;
}
