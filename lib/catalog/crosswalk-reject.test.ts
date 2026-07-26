import { describe, it, expect } from "vitest";
import {
  CROSSWALK_REJECT_REASONS,
  CROSSWALK_REJECT_HINTS,
  CROSSWALK_REJECT_CSV_HEADER,
  crosswalkRejectHint,
  crosswalkRejectsCsv,
  type CrosswalkReject,
  type CrosswalkRejectReason,
} from "@/lib/catalog/crosswalk-reject";

/**
 * Minimal RFC-4180 reader used only by the injection test: returns every cell of the
 * document with quoting removed, so the assertion can look at what a spreadsheet would
 * actually put in the cell rather than at the escaped text.
 */
function parseCsvCells(csv: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (inQuotes) {
      if (c === '"') {
        if (csv[i + 1] === '"') { cur += '"'; i++; } else inQuotes = false;
      } else cur += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { cells.push(cur); cur = ""; }
    else if (c === "\r" && csv[i + 1] === "\n") { cells.push(cur); cur = ""; i++; }
    else cur += c;
  }
  if (cur) cells.push(cur);
  return cells;
}

function reject(over: Partial<CrosswalkReject> = {}): CrosswalkReject {
  return {
    line: 2,
    customerNumber: "WX-100023",
    sku: "CB-SQU-28",
    reason: "sku_not_carried",
    lookupKey: "CBSQU28",
    nearMatch: "",
    ...over,
  };
}

describe("crosswalk reject taxonomy", () => {
  it("lists exactly the three reasons the import path distinguishes", () => {
    expect([...CROSSWALK_REJECT_REASONS]).toEqual([
      "missing_customer_number",
      "missing_sku",
      "sku_not_carried",
    ]);
  });

  it("gives every reason an actionable hint (no reason can ship without one)", () => {
    for (const reason of CROSSWALK_REJECT_REASONS) {
      const hint = CROSSWALK_REJECT_HINTS[reason];
      expect(hint, reason).toBeTruthy();
      expect(hint.length, reason).toBeGreaterThan(20);
      // A hint is an instruction, not a restatement of the code.
      expect(hint, reason).not.toContain(reason);
    }
  });

  it("a proven near match overrides the generic hint (swapped-column diagnosis)", () => {
    const generic = crosswalkRejectHint("sku_not_carried", "");
    expect(generic).toBe(CROSSWALK_REJECT_HINTS.sku_not_carried);

    const swapped = crosswalkRejectHint("sku_not_carried", "QO115");
    expect(swapped).toContain("swapped");
    expect(swapped).toContain("QO115");
    expect(swapped).not.toBe(generic);
  });
});

describe("crosswalkRejectsCsv", () => {
  it("emits the documented header and one row per unresolved source row", () => {
    const csv = crosswalkRejectsCsv([
      reject({ line: 4 }),
      reject({ line: 9, reason: "missing_sku", sku: "", lookupKey: "" }),
    ]);
    const lines = csv.trim().split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe(CROSSWALK_REJECT_CSV_HEADER.join(","));
    // Row number, both cells as supplied, the reason code, and the key actually tried.
    expect(lines[1]).toContain("4,WX-100023,CB-SQU-28,sku_not_carried,CBSQU28");
    expect(lines[2]).toContain("9,WX-100023,,missing_sku,");
  });

  it("carries the source line number so the row can be found in the original file", () => {
    const csv = crosswalkRejectsCsv([reject({ line: 137 })]);
    expect(csv.trim().split("\r\n")[1].startsWith("137,")).toBe(true);
  });

  describe("one row per failure reason", () => {
    // Every branch of the taxonomy must round-trip into the export with its own hint —
    // this is the test that fails first if a reason is added without wiring it up.
    const cases: { reason: CrosswalkRejectReason; row: CrosswalkReject }[] = [
      {
        reason: "missing_customer_number",
        row: reject({ line: 2, reason: "missing_customer_number", customerNumber: "", lookupKey: "" }),
      },
      { reason: "missing_sku", row: reject({ line: 3, reason: "missing_sku", sku: "", lookupKey: "" }) },
      { reason: "sku_not_carried", row: reject({ line: 4, reason: "sku_not_carried" }) },
    ];

    it("covers the whole taxonomy", () => {
      expect(cases.map((c) => c.reason).sort()).toEqual([...CROSSWALK_REJECT_REASONS].sort());
    });

    for (const { reason, row } of cases) {
      it(`renders ${reason} with its reason code and fix instruction`, () => {
        const line = crosswalkRejectsCsv([row]).trim().split("\r\n")[1];
        expect(line).toContain(reason);
        // The hint is quoted (it contains commas), so compare on a distinctive fragment.
        expect(line).toContain(CROSSWALK_REJECT_HINTS[reason].slice(0, 25));
      });
    }
  });

  it("neutralizes a formula-injection attempt in an untrusted customer part number", () => {
    // Every cell in the first three columns is text copied verbatim out of a CSV the
    // customer uploaded — a hostile one must not become a live formula on open.
    const hostile = [
      "=cmd|'/c calc'!A1", // classic DDE command execution
      "@SUM(1)",
      '\t=HYPERLINK("http://evil")', // leading TAB: stripped by Excel before formula detection
      "-2+3",
      "+1",
      "\r=1+1", // leading CR: same trick as the tab
    ];
    const csv = crosswalkRejectsCsv([
      reject({ line: 2, customerNumber: hostile[0], sku: hostile[1] }),
      reject({ line: 3, customerNumber: hostile[2], sku: hostile[3] }),
      reject({ line: 4, customerNumber: hostile[4], sku: hostile[5] }),
    ]);

    // The real property, stated exactly: NO parsed cell begins with a character a
    // spreadsheet would treat as the start of a formula. Asserted after unquoting,
    // because a quoted cell may legitimately contain a CR/tab in the middle.
    for (const cell of parseCsvCells(csv)) {
      expect(/^[=+\-@\t\r]/.test(cell), JSON.stringify(cell)).toBe(false);
    }
    // Each hostile value survives, guarded by the leading apostrophe — neutralized,
    // not dropped: the operator still needs to see what their file actually contained.
    for (const raw of hostile) expect(parseCsvCells(csv)).toContain(`'${raw}`);
  });

  it("returns a header-only file for the empty case (nothing to triage)", () => {
    const csv = crosswalkRejectsCsv([]);
    expect(csv).toBe(CROSSWALK_REJECT_CSV_HEADER.join(",") + "\r\n");
    expect(csv.trim().split("\r\n")).toHaveLength(1);
  });
});
