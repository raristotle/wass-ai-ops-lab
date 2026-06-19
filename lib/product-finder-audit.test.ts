import { describe, it, expect } from "vitest";
import {
  appendAuditEntry,
  verifyAuditChain,
  computeAuditHash,
  auditCsvRows,
  AUDIT_CSV_HEADER,
  AUDIT_NAMESPACE,
  type AuditEntry,
} from "@/lib/product-finder-audit";

const SECRET = "audit-secret-xyz";

function buildChain(): AuditEntry[] {
  let chain: AuditEntry[] = [];
  chain = appendAuditEntry(chain, { actor: "rep:sarah", action: "quote.sent", target: "Q-1", detail: "$1,000", at: 1000 }, SECRET);
  chain = appendAuditEntry(chain, { actor: "customer", action: "quote.accepted", target: "Q-1", detail: "", at: 2000 }, SECRET);
  chain = appendAuditEntry(chain, { actor: "system", action: "order.placed", target: "O-9", detail: "from Q-1", at: 3000 }, SECRET);
  return chain;
}

describe("audit chain", () => {
  it("namespace constant is 'audit'", () => {
    expect(AUDIT_NAMESPACE).toBe("audit");
  });

  it("appends with incrementing seq and prevHash linkage", () => {
    const chain = buildChain();
    expect(chain.map((e) => e.seq)).toEqual([0, 1, 2]);
    expect(chain[0].prevHash).toBe("");
    expect(chain[1].prevHash).toBe(chain[0].hash);
    expect(chain[2].prevHash).toBe(chain[1].hash);
  });

  it("verifies an intact chain", () => {
    const v = verifyAuditChain(buildChain(), SECRET);
    expect(v.valid).toBe(true);
    expect(v.brokenAt).toBeNull();
    expect(v.length).toBe(3);
  });

  it("detects a tampered field (edited detail)", () => {
    const chain = buildChain();
    chain[1] = { ...chain[1], detail: "TAMPERED" };
    const v = verifyAuditChain(chain, SECRET);
    expect(v.valid).toBe(false);
    expect(v.brokenAt).toBe(1);
  });

  it("detects a deleted entry (broken seq + linkage)", () => {
    const chain = buildChain();
    chain.splice(1, 1); // remove the middle entry
    const v = verifyAuditChain(chain, SECRET);
    expect(v.valid).toBe(false);
  });

  it("detects a reordered chain", () => {
    const chain = buildChain();
    const swapped = [chain[1], chain[0], chain[2]];
    expect(verifyAuditChain(swapped, SECRET).valid).toBe(false);
  });

  it("rejects verification under the wrong secret (forgery resistance)", () => {
    const chain = buildChain();
    expect(verifyAuditChain(chain, "wrong-secret").valid).toBe(false);
  });

  it("a forger who recomputes hashes without the secret still fails", () => {
    const chain = buildChain();
    // Attacker edits an entry and recomputes the hash with a guessed secret.
    const forgedFields = { ...chain[1], detail: "FORGED" };
    const forgedHash = computeAuditHash(
      {
        seq: forgedFields.seq, at: forgedFields.at, actor: forgedFields.actor,
        action: forgedFields.action, target: forgedFields.target, detail: forgedFields.detail,
        prevHash: forgedFields.prevHash,
      },
      "guessed-secret",
    );
    chain[1] = { ...forgedFields, hash: forgedHash };
    expect(verifyAuditChain(chain, SECRET).valid).toBe(false);
  });

  it("an empty chain is valid", () => {
    expect(verifyAuditChain([], SECRET)).toEqual({ valid: true, brokenAt: null, length: 0 });
  });

  it("exports CSV rows with a header", () => {
    const rows = auditCsvRows(buildChain());
    expect(AUDIT_CSV_HEADER[0]).toBe("Seq");
    expect(rows).toHaveLength(3);
    expect(rows[0][2]).toBe("rep:sarah");
    expect(typeof rows[0][1]).toBe("string"); // ISO timestamp
  });
});
