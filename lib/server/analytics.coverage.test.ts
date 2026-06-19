import { describe, it, expect, afterEach, vi } from "vitest";

/**
 * Coverage for the LIVE (configured) paths of the PostHog server seam. The
 * sibling analytics.test.ts only asserts the dormant guards; this file mocks
 * `posthog-node` so getServerPostHog() can build a "client" and
 * serverFeatureFlag() can exercise its real `??` / `finally` branches with no
 * network and no real PostHog construction.
 *
 * Each constructed fake client is recorded in `phState.instances`. Tests set
 * `phState.nextFlag` to control what the NEXT-constructed client returns from
 * isFeatureEnabled (serverFeatureFlag builds its own client internally, so we
 * can't hand it a spy — we steer the next instance instead).
 */
type FakeClient = {
  key: string;
  options: { host?: string; flushAt?: number; flushInterval?: number };
  isFeatureEnabled: ReturnType<typeof vi.fn>;
  shutdown: ReturnType<typeof vi.fn>;
};

const phState = vi.hoisted(() => ({
  instances: [] as FakeClient[],
  // How the NEXT-built client behaves on isFeatureEnabled:
  //  - {kind:"value", value} → resolves to value
  //  - {kind:"reject", error} → rejects
  nextFlag: { kind: "value", value: true as boolean | undefined } as
    | { kind: "value"; value: boolean | undefined }
    | { kind: "reject"; error: Error },
}));

vi.mock("posthog-node", () => {
  class PostHog {
    key: string;
    options: { host?: string; flushAt?: number; flushInterval?: number };
    isFeatureEnabled: ReturnType<typeof vi.fn>;
    shutdown = vi.fn(async () => {});
    constructor(key: string, options: { host?: string; flushAt?: number; flushInterval?: number }) {
      this.key = key;
      this.options = options;
      const plan = phState.nextFlag;
      this.isFeatureEnabled = vi.fn(async () => {
        if (plan.kind === "reject") throw plan.error;
        return plan.value;
      });
      phState.instances.push(this as unknown as FakeClient);
    }
  }
  return { PostHog };
});

import { analyticsConfigured, getServerPostHog, serverFeatureFlag } from "@/lib/server/analytics";

function planValue(value: boolean | undefined) {
  phState.nextFlag = { kind: "value", value };
}
function planReject(error: Error) {
  phState.nextFlag = { kind: "reject", error };
}

afterEach(() => {
  vi.restoreAllMocks();
  phState.instances.length = 0;
  phState.nextFlag = { kind: "value", value: true };
  delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  delete process.env.POSTHOG_KEY;
  delete process.env.POSTHOG_HOST;
});

describe("env() trimming via analyticsConfigured", () => {
  it("treats a whitespace-only key as unset (trim → null)", () => {
    process.env.POSTHOG_KEY = "   ";
    expect(analyticsConfigured()).toBe(false);
  });

  it("trims surrounding whitespace off a real key", () => {
    process.env.POSTHOG_KEY = "  phc_padded  ";
    expect(analyticsConfigured()).toBe(true);
  });
});

describe("getServerPostHog (configured)", () => {
  it("builds a client with the default ingest host when POSTHOG_HOST is unset", () => {
    process.env.POSTHOG_KEY = "phc_server";
    const client = getServerPostHog();
    expect(client).not.toBeNull();
    expect(phState.instances).toHaveLength(1);
    const inst = phState.instances[0];
    expect(inst.key).toBe("phc_server");
    expect(inst.options.host).toBe("https://us.i.posthog.com");
    // Serverless flush config: flush immediately so a freezing function can't drop events.
    expect(inst.options.flushAt).toBe(1);
    expect(inst.options.flushInterval).toBe(0);
  });

  it("honors a custom POSTHOG_HOST (trimmed)", () => {
    process.env.POSTHOG_KEY = "phc_server";
    process.env.POSTHOG_HOST = "  https://eu.i.posthog.com  ";
    getServerPostHog();
    expect(phState.instances[0].options.host).toBe("https://eu.i.posthog.com");
  });

  it("ignores a whitespace-only POSTHOG_HOST and falls back to the default", () => {
    process.env.POSTHOG_KEY = "phc_server";
    process.env.POSTHOG_HOST = "   ";
    getServerPostHog();
    expect(phState.instances[0].options.host).toBe("https://us.i.posthog.com");
  });

  it("returns null and builds NOTHING when the server key is whitespace-only", () => {
    process.env.POSTHOG_KEY = "   ";
    expect(getServerPostHog()).toBeNull();
    expect(phState.instances).toHaveLength(0);
  });

  it("stays dormant on the client key alone (server seam needs POSTHOG_KEY)", () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_client";
    expect(getServerPostHog()).toBeNull();
    expect(phState.instances).toHaveLength(0);
  });
});

describe("serverFeatureFlag (configured / live evaluation)", () => {
  it("returns the evaluated flag value and shuts the client down", async () => {
    process.env.POSTHOG_KEY = "phc_server";
    planValue(true);
    const result = await serverFeatureFlag("new-ui", "user-1", false);
    expect(result).toBe(true);
    const inst = phState.instances[0];
    expect(inst.isFeatureEnabled).toHaveBeenCalledWith("new-ui", "user-1");
    expect(inst.shutdown).toHaveBeenCalledTimes(1);
  });

  it("returns a real `false` evaluation (?? must NOT coerce false → fallback)", async () => {
    process.env.POSTHOG_KEY = "phc_server";
    planValue(false);
    // fallback is true, but the flag explicitly evaluated false → must return false.
    expect(await serverFeatureFlag("gated", "u", true)).toBe(false);
  });

  it("falls back when the SDK returns undefined (flag unknown / not bootstrapped)", async () => {
    process.env.POSTHOG_KEY = "phc_server";
    planValue(undefined);
    expect(await serverFeatureFlag("unknown-flag", "u", true)).toBe(true);
  });

  it("uses the default fallback of false when the SDK returns undefined and none is supplied", async () => {
    process.env.POSTHOG_KEY = "phc_server";
    planValue(undefined);
    expect(await serverFeatureFlag("unknown-flag", "u")).toBe(false);
  });

  it("ALWAYS awaits shutdown() on the success path (finally runs)", async () => {
    process.env.POSTHOG_KEY = "phc_server";
    planValue(true);
    await serverFeatureFlag("f", "u");
    expect(phState.instances[0].shutdown).toHaveBeenCalledTimes(1);
  });

  it("fails closed to the fallback when isFeatureEnabled REJECTS, and still shuts the client down", async () => {
    process.env.POSTHOG_KEY = "phc_server";
    planReject(new Error("posthog network down"));
    // Fixed: a live-evaluation error degrades to `fallback` instead of escaping
    // the feature gate; the finally still shuts the client down.
    await expect(serverFeatureFlag("flag", "user", true)).resolves.toBe(true);
    await expect(serverFeatureFlag("flag", "user", false)).resolves.toBe(false);
    expect(phState.instances[0].shutdown).toHaveBeenCalledTimes(1);
  });
});
