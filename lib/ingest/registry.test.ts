import { describe, it, expect } from "vitest";
import { parseEnvSources, getAdapters, getAdapter, liveSourcesConfigured, parseDistributorMpns, MAX_DISTRIBUTOR_MPNS } from "@/lib/ingest/registry";
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

  it("registers D4 manufacturer harvesters from INGEST_MANUFACTURERS", () => {
    const env = { INGEST_MANUFACTURERS: JSON.stringify([{ brand: "Eaton", urls: ["https://eaton.com/p/1"] }]) };
    const ids = getAdapters(env).map((a) => a.id);
    expect(ids).toContain("manufacturer:eaton");
    expect(getAdapter("manufacturer:eaton", env)?.segment).toBe("EES");
  });

  it("dedupes adapters that slug to the same id (no snapshot-namespace clobber)", () => {
    // "Square D" and "Square-D" both slug to manufacturer:square-d — only one must register.
    const env = {
      INGEST_MANUFACTURERS: JSON.stringify([
        { brand: "Square D", urls: ["https://schneider.com/a"] },
        { brand: "Square-D", urls: ["https://schneider.com/b"] },
      ]),
    };
    const ids = getAdapters(env).map((a) => a.id);
    expect(ids.filter((id) => id === "manufacturer:square-d")).toHaveLength(1);
  });
});

describe("parseDistributorMpns", () => {
  it("splits on commas/whitespace, dedupes case-insensitively, and caps the list", () => {
    expect(parseDistributorMpns("A-1, B-2  B-2\nC-3")).toEqual(["A-1", "B-2", "C-3"]);
    expect(parseDistributorMpns(undefined)).toEqual([]);
    expect(parseDistributorMpns("   ")).toEqual([]);
    const many = Array.from({ length: MAX_DISTRIBUTOR_MPNS + 50 }, (_, i) => `M-${i}`).join(",");
    expect(parseDistributorMpns(many)).toHaveLength(MAX_DISTRIBUTOR_MPNS);
  });
});

describe("distributor adapter dormancy", () => {
  it("is NOT registered without a seed MPN list (even if a client were keyed)", () => {
    // No INGEST_DISTRIBUTOR_MPNS → no distributor adapter regardless of keys.
    const ids = getAdapters({ INGEST_DISTRIBUTOR_MPNS: "" }).map((a) => a.id);
    expect(ids).not.toContain("distributor:identity");
  });

  it("is NOT registered when seeded but no distributor client is configured ($0 default)", () => {
    // Seed present but no Mouser/Digi-Key/Nexar keys in this test env → still dormant.
    const ids = getAdapters({ INGEST_DISTRIBUTOR_MPNS: "EX-1,EX-2" }).map((a) => a.id);
    expect(ids).not.toContain("distributor:identity");
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
