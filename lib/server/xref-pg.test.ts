import { describe, it, expect, afterEach } from "vitest";
import { xrefPgEnabled, xrefSourceLabel, parseXrefPacked } from "@/lib/server/xref-pg";

const origSource = process.env.XREF_SOURCE;
const origUrl = process.env.POSTGRES_URL;
afterEach(() => {
  if (origSource === undefined) delete process.env.XREF_SOURCE;
  else process.env.XREF_SOURCE = origSource;
  if (origUrl === undefined) delete process.env.POSTGRES_URL;
  else process.env.POSTGRES_URL = origUrl;
});

describe("B15 — Postgres cross tier (dormant by default)", () => {
  it("is OFF unless XREF_SOURCE=postgres AND a DB URL is set (the $0 default)", () => {
    delete process.env.XREF_SOURCE;
    expect(xrefPgEnabled()).toBe(false);
    expect(xrefSourceLabel()).toBe("memory");

    process.env.XREF_SOURCE = "postgres";
    process.env.POSTGRES_URL = "postgres://u:p@host/db";
    expect(xrefPgEnabled()).toBe(true);
    expect(xrefSourceLabel()).toBe("postgres");

    // Flag set but no DB configured → still off (fail-closed to memory).
    delete process.env.POSTGRES_URL;
    expect(xrefPgEnabled()).toBe(false);
    expect(xrefSourceLabel()).toBe("memory");
  });

  it("parseXrefPacked yields typed rows with normalized keys + a relation", () => {
    const rows = parseXrefPacked();
    expect(rows.length).toBeGreaterThan(500_000);
    const r = rows[0];
    expect(r.compKey.length).toBeGreaterThan(0);
    expect(r.targetKey.length).toBeGreaterThan(0);
    expect(r.competitorPart.length).toBeGreaterThan(0);
    expect(["equivalent", "functional-substitute"]).toContain(r.relation);
  });
});
