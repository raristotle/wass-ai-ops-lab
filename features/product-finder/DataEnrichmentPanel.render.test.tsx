import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { DataEnrichmentPanel } from "@/features/product-finder/DataEnrichmentPanel";
import type { CatalogProduct, ProductSpec } from "@/features/product-finder/types";

/**
 * Render-coverage net for DataEnrichmentPanel — a pure, client-side panel that
 * surfaces three independent data layers for a product:
 *   1. the manufacturer ENTITY (parent / ultimate parent / LEI / former names),
 *   2. the ETIM attribute class + required-spec coverage, and
 *   3. inferred regulatory substances (REACH-SVHC / RoHS / Prop65).
 * Each section renders only when its lookup returns data; when none do, the
 * component returns null. These tests seed realistic products against the SHIPPED
 * datasets (brand-entities, etim-classes, substances) so each branch is exercised
 * deterministically without mocking the lookup libs.
 */
function prod(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: "p1",
    sku: "SKU-1",
    name: "Product 1",
    brand: "Acme",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "",
    unitPrice: 20,
    uom: "ea",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "x",
    ...overrides,
  };
}

function spec(name: string, value: string): ProductSpec {
  return { name, value };
}

describe("DataEnrichmentPanel (render coverage)", () => {
  it("renders the manufacturer entity section with parent, LEI, and former names", () => {
    // Eaton is in the shipped entity graph: parent 'Eaton Corporation plc'
    // (distinct from the brand 'Eaton'), LEI present, ultimateParent === parent
    // (so the inner 'ultimately …' clause is skipped), and a former name.
    const { container, getByText } = render(
      <DataEnrichmentPanel product={prod({ brand: "Eaton", subcategory: "Circuit Breakers" })} />,
    );
    expect(getByText("🏢 Manufacturer")).toBeInTheDocument();
    // The brand and its corporate parent both render.
    expect(getByText("Eaton")).toBeInTheDocument();
    expect(getByText("Eaton Corporation plc")).toBeInTheDocument();
    // LEI is shown in a monospace span.
    expect(container.textContent).toContain("549300VDIGTMXUNT7H71");
    // Former names line renders.
    expect(container.textContent).toContain("Formerly:");
    // ultimateParent === parentCompany → the "(ultimately …)" clause is absent.
    expect(container.textContent).not.toContain("ultimately");
  });

  it("renders the '(ultimately …)' clause when the ultimate parent differs from the immediate parent", () => {
    // 2N → parent 'Axis Communications AB' → ultimate 'Canon Inc.' exercises the
    // nested ultimateParent !== parentCompany branch. 2N also has no LEI, so the
    // LEI clause is skipped.
    const { container } = render(
      <DataEnrichmentPanel product={prod({ brand: "2N", subcategory: "Totally Unmapped Subcategory" })} />,
    );
    expect(container.textContent).toContain("Axis Communications AB");
    expect(container.textContent).toContain("ultimately Canon Inc.");
    // No LEI for 2N → the 'LEI' label is absent.
    expect(container.textContent).not.toContain("LEI ");
  });

  it("renders the ETIM section with coverage and a 'missing' hint when specs are sparse", () => {
    // 'Circuit Breakers' maps to ETIM class EC000042 (Miniature circuit breaker).
    // With no specs every required feature is missing → 0% coverage + missing hint.
    const { getByText, container } = render(
      <DataEnrichmentPanel product={prod({ brand: "Acme", subcategory: "Circuit Breakers", specs: [] })} />,
    );
    // ETIM class code header renders.
    expect(getByText(/EC000042/)).toBeInTheDocument();
    // 0/N required specs at 0% with a missing list.
    expect(container.textContent).toContain("(0%)");
    expect(container.textContent).toContain("missing:");
    // The class name from the dataset is shown.
    expect(container.textContent).toContain("Miniature circuit breaker");
  });

  it("renders ETIM with high coverage and no 'missing' hint when all required features are specified", () => {
    // Seed specs that match each ETIM required feature for Circuit Breakers via
    // the concept-bridge (amp/current, pole, volt, ka/breaking, trip, ip, width,
    // temperature, current-limiting). Goal: full coverage so the missing branch
    // is NOT taken and the "…" truncation/`missing:` text is absent.
    const fullSpecs = [
      spec("Tripping curve", "C"),
      spec("Poles", "2"),
      spec("Protected poles", "2"),
      spec("Current rating (A)", "20"),
      spec("Voltage (V)", "240"),
      spec("Breaking capacity (kA)", "10"),
      spec("Icu interrupt (kA)", "10"),
      spec("Current limiting class", "3"),
      spec("Width (module)", "1"),
      spec("Operating temperature (°C)", "40"),
      spec("IP protection", "IP20"),
    ];
    const { container } = render(
      <DataEnrichmentPanel product={prod({ brand: "Acme", subcategory: "Circuit Breakers", specs: fullSpecs })} />,
    );
    expect(container.textContent).toContain("(100%)");
    expect(container.textContent).not.toContain("missing:");
  });

  it("renders the compliance substances section for a PVC-jacketed product", () => {
    // A flexible-PVC description deterministically triggers the phthalate +
    // lead-stabilizer rule → multiple substances with REACH-SVHC / RoHS / Prop65
    // badges. Use a subcategory with no ETIM mapping so this isolates the
    // substances section.
    const { getByText, container } = render(
      <DataEnrichmentPanel
        product={prod({
          brand: "Acme",
          subcategory: "Mystery Subcat With No ETIM Map",
          description: "Flexible PVC insulated control cable with phthalate plasticizer jacket",
        })}
      />,
    );
    expect(getByText(/May contain/)).toBeInTheDocument();
    // At least one regulatory list badge renders.
    expect(container.textContent).toMatch(/REACH-SVHC|RoHS|Prop65/);
    // A CAS number is shown.
    expect(container.textContent).toMatch(/CAS \d/);
    // The indicative-only disclaimer renders.
    expect(container.textContent).toContain("Indicative");
  });

  it("returns null (renders nothing) when no enrichment data applies", () => {
    // Unknown brand + unmapped subcategory + a benign description that triggers
    // no substance rule → all three sections empty → component returns null.
    const { container } = render(
      <DataEnrichmentPanel
        product={prod({
          brand: "ZZZ Nonexistent Brand 9000",
          subcategory: "Totally Unmapped Subcategory",
          description: "An inert widget with no flagged materials whatsoever",
          specs: [],
        })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders all three sections together for an Eaton circuit breaker with PVC content", () => {
    const { container } = render(
      <DataEnrichmentPanel
        product={prod({
          brand: "Eaton",
          subcategory: "Circuit Breakers",
          description: "Molded-case breaker with PVC-insulated leads and brass terminals",
          specs: [spec("Current rating (A)", "20")],
        })}
      />,
    );
    expect(container.textContent).toContain("🏢 Manufacturer");
    expect(container.textContent).toContain("EC000042");
    expect(container.textContent).toContain("May contain");
  });
});
