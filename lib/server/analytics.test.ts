import { describe, it, expect, afterEach } from "vitest";
import { analyticsConfigured, getServerPostHog, serverFeatureFlag } from "@/lib/server/analytics";

afterEach(() => {
  delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  delete process.env.POSTHOG_KEY;
});

describe("analytics server seam (dormant by default)", () => {
  it("analyticsConfigured is false when no key is set", () => {
    expect(analyticsConfigured()).toBe(false);
  });

  it("analyticsConfigured is true when EITHER the client or server key is set", () => {
    process.env.POSTHOG_KEY = "phc_server";
    expect(analyticsConfigured()).toBe(true);
    delete process.env.POSTHOG_KEY;
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_client";
    expect(analyticsConfigured()).toBe(true);
  });

  it("getServerPostHog returns null (no client, no network) when POSTHOG_KEY is unset", () => {
    expect(getServerPostHog()).toBeNull();
  });

  it("serverFeatureFlag returns the fallback when dormant — no posthog-node client is built", async () => {
    expect(await serverFeatureFlag("some-flag", "user-1", true)).toBe(true);
    expect(await serverFeatureFlag("some-flag", "user-1")).toBe(false);
  });
});
