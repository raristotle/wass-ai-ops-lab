import { describe, it, expect, afterEach } from "vitest";
import { requireApiAuth } from "@/lib/server/api-auth";

function req(headers: Record<string, string>): Request {
  return new Request("https://app.raristotle.com/api/jobs", { method: "POST", headers });
}

describe("requireApiAuth", () => {
  afterEach(() => {
    delete process.env.WRITE_API_TOKEN;
  });

  it("allows a same-origin request (Origin host === deployment host)", () => {
    expect(requireApiAuth(req({ origin: "https://app.raristotle.com" }))).toBeNull();
  });

  it("rejects a cross-origin request with 401", () => {
    expect(requireApiAuth(req({ origin: "https://evil.example" }))?.status).toBe(401);
  });

  it("rejects an anonymous request (no Origin, no token) with 401", () => {
    expect(requireApiAuth(req({}))?.status).toBe(401);
  });

  it("allows a valid bearer token when WRITE_API_TOKEN is configured", () => {
    process.env.WRITE_API_TOKEN = "s3cret";
    expect(requireApiAuth(req({ authorization: "Bearer s3cret" }))).toBeNull();
  });

  it("rejects a wrong bearer token", () => {
    process.env.WRITE_API_TOKEN = "s3cret";
    expect(requireApiAuth(req({ authorization: "Bearer nope" }))?.status).toBe(401);
  });

  it("ignores the bearer path entirely when WRITE_API_TOKEN is unset", () => {
    // A 'Bearer' header without server config must not grant access.
    expect(requireApiAuth(req({ authorization: "Bearer anything" }))?.status).toBe(401);
  });
});
