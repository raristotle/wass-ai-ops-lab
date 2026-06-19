import { describe, it, expect, afterEach, vi } from "vitest";
import {
  csvField,
  crossRefCsv,
  searchResultsCsv,
  downloadText,
  downloadCsv,
  type CrossCsvRow,
} from "@/lib/product-finder-csv";
import type { CatalogProduct } from "@/features/product-finder/types";

function makeProduct(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: "p1",
    sku: "CB-TST-001",
    name: "Test Breaker 15A",
    brand: "TestBrand",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "test",
    unitPrice: 8.5,
    uom: "EA",
    specs: [],
    preferred: true,
    branchStock: [{ branchId: "B1", branchName: "Branch 1", city: "Houston", state: "TX", quantity: 12 }],
    dcStock: [{ dcId: "DC1", dcName: "DC 1", location: "Dallas", quantity: 88 }],
    externalSources: [],
    imageIcon: "⚡",
    ...overrides,
  };
}

// This file covers the surface the sibling .test.ts leaves untouched:
//   - crossRefCsv (all optional-field branches: present vs absent)
//   - downloadText (the node no-op guard AND the full browser DOM path)
//   - downloadCsv (delegates to downloadText with the csv mime)
//   - csvField CR-only / quote-only edge cases

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("csvField (edge branches)", () => {
  it("quotes on a bare carriage return", () => {
    expect(csvField("a\rb")).toBe('"a\rb"');
  });

  it("quotes and doubles when the value is a lone quote", () => {
    expect(csvField('"')).toBe('""""');
  });

  it("guards an equals-prefixed value that ALSO contains a comma (both transforms apply)", () => {
    // formula guard prepends ', then the comma forces quoting of the whole field
    expect(csvField("=A,B")).toBe("\"'=A,B\"");
  });

  it("guards a leading minus (negative-looking strings)", () => {
    expect(csvField("-7e3")).toBe("'-7e3");
  });

  it("does not guard a number whose String() has no leading formula char", () => {
    expect(csvField(-5)).toBe("'-5"); // String(-5) === "-5" → leading '-' IS guarded
  });
});

describe("crossRefCsv", () => {
  it("emits only the header for an empty input", () => {
    const csv = crossRefCsv([]);
    const lines = csv.trim().split("\r\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe(
      "Input,From Brand,From Part,Stocked SKU,Name,Brand,Unit Price,UoM,Relation,Confidence %,Source",
    );
  });

  it("renders a fully-populated documented cross row", () => {
    const row: CrossCsvRow = {
      input: "SQD-QO115",
      fromBrand: "Square D",
      fromMpn: "QO115",
      sku: "CB-SQD-001",
      name: "QO 15A Breaker",
      brand: "Square D",
      unitPrice: 12.5,
      uom: "EA",
      relation: "equivalent",
      confidence: 98,
      sourceUrl: "https://example.com/x",
    };
    const csv = crossRefCsv([row]);
    const lines = csv.trim().split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe(
      "SQD-QO115,Square D,QO115,CB-SQD-001,QO 15A Breaker,Square D,12.50,EA,equivalent,98,https://example.com/x",
    );
  });

  it("blanks every optional cell when only the input is provided (no-cross row)", () => {
    const csv = crossRefCsv([{ input: "UNKNOWN-PART" }]);
    const lines = csv.trim().split("\r\n");
    // input + 10 trailing empty fields
    expect(lines[1]).toBe("UNKNOWN-PART,,,,,,,,,,");
  });

  it("formats unitPrice to 2 decimals and renders confidence 0 (not blank)", () => {
    // confidence:0 and unitPrice:0 exercise the `!== undefined` branch with falsy values
    const csv = crossRefCsv([{ input: "P", unitPrice: 0, confidence: 0 }]);
    const cells = csv.trim().split("\r\n")[1].split(",");
    expect(cells[6]).toBe("0.00"); // Unit Price column
    expect(cells[9]).toBe("0"); // Confidence column — must be "0", not ""
  });

  it("applies CSV-injection / comma escaping to cross fields", () => {
    const csv = crossRefCsv([
      { input: "=cmd()", name: "Lug, 2-hole", relation: "@ref" },
    ]);
    const line = csv.trim().split("\r\n")[1];
    expect(line).toContain("'=cmd()"); // formula guard on input
    expect(line).toContain('"Lug, 2-hole"'); // comma-quoted name
    expect(line).toContain("'@ref"); // formula guard on relation
  });
});

describe("searchResultsCsv (non-preferred branch)", () => {
  it("emits 'No' for a non-preferred product", () => {
    const csv = searchResultsCsv([makeProduct({ preferred: false })]);
    const line = csv.trim().split("\r\n")[1];
    expect(line.endsWith(",No")).toBe(true);
  });

  it("sums multi-branch and multi-DC stock across entries", () => {
    const csv = searchResultsCsv([
      makeProduct({
        branchStock: [
          { branchId: "B1", branchName: "B1", city: "Houston", state: "TX", quantity: 5 },
          { branchId: "B2", branchName: "B2", city: "Dallas", state: "TX", quantity: 7 },
        ],
        dcStock: [
          { dcId: "DC1", dcName: "DC1", location: "Dallas", quantity: 40 },
          { dcId: "DC2", dcName: "DC2", location: "Reno", quantity: 60 },
        ],
      }),
    ]);
    const cells = csv.trim().split("\r\n")[1].split(",");
    expect(cells[7]).toBe("12"); // Branch Stock total
    expect(cells[8]).toBe("100"); // DC Stock total
  });
});

describe("downloadText — node no-op guard", () => {
  it("returns undefined and does nothing when document is undefined", () => {
    // node test env: `document` is not defined at all → guard returns early.
    expect(typeof document).toBe("undefined");
    expect(downloadText("f.txt", "hi")).toBeUndefined();
  });
});

describe("downloadText — browser DOM path", () => {
  function installFakeDom() {
    const anchor = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    const createElement = vi.fn(() => anchor);
    const createObjectURL = vi.fn(() => "blob:fake-url");
    const revokeObjectURL = vi.fn();
    const blobCtor = vi.fn(function (this: unknown, parts: unknown[], opts: unknown) {
      Object.assign(this as object, { parts, opts });
    });

    vi.stubGlobal("document", { createElement });
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    vi.stubGlobal("Blob", blobCtor);

    return { anchor, createElement, createObjectURL, revokeObjectURL, blobCtor };
  }

  it("builds a charset blob, wires the anchor, clicks it, and revokes the url", () => {
    const dom = installFakeDom();
    downloadText("report.txt", "hello world");

    expect(dom.blobCtor).toHaveBeenCalledTimes(1);
    const [parts, opts] = dom.blobCtor.mock.calls[0];
    expect(parts).toEqual(["hello world"]);
    expect(opts).toEqual({ type: "text/plain;charset=utf-8" });

    expect(dom.createElement).toHaveBeenCalledWith("a");
    expect(dom.anchor.href).toBe("blob:fake-url");
    expect(dom.anchor.download).toBe("report.txt");
    expect(dom.anchor.click).toHaveBeenCalledTimes(1);
    expect(dom.revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
  });

  it("honors a custom mime type", () => {
    const dom = installFakeDom();
    downloadText("data.bin", "x", "application/octet-stream");
    const [, opts] = dom.blobCtor.mock.calls[0];
    expect(opts).toEqual({ type: "application/octet-stream;charset=utf-8" });
  });

  it("downloadCsv delegates with the text/csv mime", () => {
    const dom = installFakeDom();
    downloadCsv("out.csv", "a,b\r\n1,2\r\n");
    const [parts, opts] = dom.blobCtor.mock.calls[0];
    expect(parts).toEqual(["a,b\r\n1,2\r\n"]);
    expect(opts).toEqual({ type: "text/csv;charset=utf-8" });
    expect(dom.anchor.download).toBe("out.csv");
    expect(dom.anchor.click).toHaveBeenCalledTimes(1);
  });
});

describe("downloadCsv — node no-op guard", () => {
  it("is a no-op outside the browser", () => {
    expect(downloadCsv("out.csv", "a,b\r\n")).toBeUndefined();
  });
});
