import { describe, it, expect } from "vitest";
import { PUNCHOUT_NETWORKS, networkForDomain } from "@/lib/procurement/punchout-networks";

describe("PUNCHOUT_NETWORKS", () => {
  it("registers SAP Business Network and Coupa as free supplier accounts", () => {
    expect(PUNCHOUT_NETWORKS.map((n) => n.id).sort()).toEqual(["coupa", "sap-business-network"]);
    expect(PUNCHOUT_NETWORKS.every((n) => n.freeSupplierAccount)).toBe(true);
  });
  it("resolves a network by credential domain, case-insensitively", () => {
    expect(networkForDomain("networkid")?.id).toBe("sap-business-network");
    expect(networkForDomain("DUNS")?.id).toBe("coupa");
    expect(networkForDomain("unknown")).toBeNull();
  });
});
