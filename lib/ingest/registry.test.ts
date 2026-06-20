import { describe, it, expect } from "vitest";
import { parseEnvSources, getAdapters, getAdapter, liveSourcesConfigured } from "@/lib/ingest/registry";
import { SELFTEST_ADAPTER_ID } from "@/lib/ingest/adapters/selftest";

describe("parseEnvSources", () => {
  it("returns [] for missing/blank/invalid JSON", () => {
    expect(parseEnvSources(undefined)).toEqual([]);
    expect(parseEnvSources("")).toEqual([]);
    expect(parseEnvSources("not json")).toEqual([]);
    expect(parseEnvSources('{"not":"an array"}')).toEqual([]);
  });

  it("parses valid configs and skips entries missing id or urls", () => {
    const raw = JSON.stringify([
      { id: "schema-org:acme", label: "ACME", segment: "EES", license: "public", urls: ["https://a/1"], brandFallback: "ACME" },
      { id: "no-urls", urls: [] }, // skipped — no URLs
      { label: "no id", urls: ["https://x"] }, // skipped — no id
      { id: "defaults", urls: ["https://d/1"] }, // label/segment/license defaulted
    ]);
    const cfgs = parseEnvSources(raw);
    expect(cfgs.map((c) => c.id)).toEqual(["schema-org:acme", "defaults"]);
    expect(cfgs[0].brandFallback).toBe("ACME");
    expect(cfgs[1]).toMatchObject({ label: "defaults", segment: "cross-segment" });
  });
});

describe("getAdapters / getAdapter", () => {
  it("always includes the network-free self-test adapter", () => {
    const ids = getAdapters({}).map((a) => a.id);
    expect(ids).toContain(SELFTEST_ADAPTER_ID);
  });

  it("adds env-declared live sources after the self-test", () => {
    const env = { INGEST_SOURCES: JSON.stringify([{ id: "schema-org:x", urls: ["https://x/1"] }]) };
    const ids = getAdapters(env).map((a) => a.id);
    expect(ids).toEqual([SELFTEST_ADAPTER_ID, "schema-org:x"]);
    expect(getAdapter("schema-org:x", env)?.label).toBe("schema-org:x");
    expect(getAdapter("nope", env)).toBeNull();
  });
});

describe("liveSourcesConfigured", () => {
  it("reflects whether INGEST_SOURCES declares any runnable source", () => {
    const had = process.env.INGEST_SOURCES;
    try {
      delete process.env.INGEST_SOURCES;
      expect(liveSourcesConfigured()).toBe(false);
      process.env.INGEST_SOURCES = JSON.stringify([{ id: "s", urls: ["https://s/1"] }]);
      expect(liveSourcesConfigured()).toBe(true);
    } finally {
      if (had === undefined) delete process.env.INGEST_SOURCES;
      else process.env.INGEST_SOURCES = had;
    }
  });
});
