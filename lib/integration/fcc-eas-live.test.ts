import { describe, it, expect, afterEach } from "vitest";
import {
  fccEasConfigured,
  fccIdToGrantee,
  parseFccGranteeRow,
} from "@/lib/integration/fcc-eas-live";

afterEach(() => {
  delete process.env.FCC_SOCRATA_APP_TOKEN;
});

describe("fcc-eas dormancy", () => {
  it("is dormant without the app token", () => {
    expect(fccEasConfigured()).toBe(false);
  });
  it("activates once the token is set", () => {
    process.env.FCC_SOCRATA_APP_TOKEN = "t";
    expect(fccEasConfigured()).toBe(true);
  });
});

describe("fccIdToGrantee", () => {
  it("splits a letter-leading FCC ID at 3 chars", () => {
    expect(fccIdToGrantee("BCG-E2342A")).toEqual({ granteeCode: "BCG", productCode: "E2342A" });
  });
  it("splits a digit-leading FCC ID at 5 chars", () => {
    expect(fccIdToGrantee("2AB37-XYZ")).toEqual({ granteeCode: "2AB37", productCode: "XYZ" });
  });
  it("strips punctuation and upper-cases", () => {
    expect(fccIdToGrantee("a3l x123")).toEqual({ granteeCode: "A3L", productCode: "X123" });
  });
  it("rejects too-short input", () => {
    expect(fccIdToGrantee("ABC")).toBeNull(); // exactly the grantee length, no product code
    expect(fccIdToGrantee("AB")).toBeNull();
  });
});

describe("parseFccGranteeRow", () => {
  it("reads grantee code + name defensively across field names", () => {
    expect(parseFccGranteeRow({ grantee_code: "BCG", grantee_name: "Cisco", country: "US" })).toEqual({
      granteeCode: "BCG",
      name: "Cisco",
      country: "US",
    });
    expect(parseFccGranteeRow({ grantee_code: "BCG", applicant_name: "Cisco Systems" }).name).toBe(
      "Cisco Systems",
    );
  });
});
