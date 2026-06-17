import { describe, it, expect, afterEach, vi } from "vitest";
import crypto from "node:crypto";
import { webPushConfigured, vapidJwt, sendPush, isAllowedPushEndpoint } from "@/lib/server/web-push";

// Generate a real P-256 keypair in raw VAPID form for the signing tests.
function vapidKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const pub = publicKey.export({ format: "jwk" }) as { x: string; y: string };
  const prv = privateKey.export({ format: "jwk" }) as { d: string };
  const raw = Buffer.concat([Buffer.from([4]), Buffer.from(pub.x, "base64url"), Buffer.from(pub.y, "base64url")]);
  return { publicKey: raw.toString("base64url"), privateKey: prv.d };
}

afterEach(() => {
  delete process.env.VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("webPushConfigured", () => {
  it("is dormant without both VAPID keys", () => {
    expect(webPushConfigured()).toBe(false);
    process.env.VAPID_PUBLIC_KEY = "x";
    expect(webPushConfigured()).toBe(false);
  });
});

describe("vapidJwt", () => {
  it("produces a verifiable ES256 JWT bound to the endpoint origin", () => {
    const { publicKey, privateKey } = vapidKeys();
    const jwt = vapidJwt("https://fcm.googleapis.com/fcm/send/abc", publicKey, privateKey, "mailto:x@y.z");
    const [h, p, s] = jwt.split(".");
    expect(h && p && s).toBeTruthy();
    expect(JSON.parse(Buffer.from(p, "base64url").toString())).toMatchObject({ aud: "https://fcm.googleapis.com", sub: "mailto:x@y.z" });
    // Signature verifies against the public key.
    const raw = Buffer.from(publicKey, "base64url");
    const keyObj = crypto.createPublicKey({
      key: { kty: "EC", crv: "P-256", x: raw.subarray(1, 33).toString("base64url"), y: raw.subarray(33, 65).toString("base64url") },
      format: "jwk",
    });
    const ok = crypto.verify("sha256", Buffer.from(`${h}.${p}`), { key: keyObj, dsaEncoding: "ieee-p1363" }, Buffer.from(s, "base64url"));
    expect(ok).toBe(true);
  });
});

describe("isAllowedPushEndpoint (SSRF allow-list)", () => {
  it("accepts only known browser-push service hosts over https", () => {
    expect(isAllowedPushEndpoint("https://fcm.googleapis.com/fcm/send/abc")).toBe(true);
    expect(isAllowedPushEndpoint("https://web.push.apple.com/x")).toBe(true);
    expect(isAllowedPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/x")).toBe(true);
    expect(isAllowedPushEndpoint("https://db5p.notify.windows.com/w/?token=x")).toBe(true);
  });

  it("rejects internal/metadata/non-https/off-list endpoints (SSRF)", () => {
    expect(isAllowedPushEndpoint("http://fcm.googleapis.com/x")).toBe(false); // not https
    expect(isAllowedPushEndpoint("https://169.254.169.254/latest/meta-data/")).toBe(false);
    expect(isAllowedPushEndpoint("https://localhost:6379/")).toBe(false);
    expect(isAllowedPushEndpoint("https://redis.internal/")).toBe(false);
    expect(isAllowedPushEndpoint("https://evil.example.com/")).toBe(false);
    expect(isAllowedPushEndpoint("https://fcm.googleapis.com.evil.com/")).toBe(false); // suffix spoof
    expect(isAllowedPushEndpoint("not-a-url")).toBe(false);
  });
});

describe("sendPush", () => {
  it("never fetches a non-push (SSRF) endpoint even when keyed — prunes it", async () => {
    const { publicKey, privateKey } = vapidKeys();
    process.env.VAPID_PUBLIC_KEY = publicKey;
    process.env.VAPID_PRIVATE_KEY = privateKey;
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await sendPush({ endpoint: "https://169.254.169.254/latest/meta-data/" })).toEqual({ sent: false, gone: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("is dormant (no network) when unconfigured", async () => {
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await sendPush({ endpoint: "https://x/y" })).toEqual({ sent: false, gone: false });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("signs + sends with a VAPID Authorization header when keyed", async () => {
    const { publicKey, privateKey } = vapidKeys();
    process.env.VAPID_PUBLIC_KEY = publicKey;
    process.env.VAPID_PRIVATE_KEY = privateKey;
    let auth = "";
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit): Promise<Response> => {
      auth = String((init?.headers as Record<string, string>)?.Authorization ?? "");
      return new Response(null, { status: 201 });
    }));
    expect(await sendPush({ endpoint: "https://fcm.googleapis.com/fcm/send/abc" })).toEqual({ sent: true, gone: false });
    expect(auth.startsWith("vapid t=")).toBe(true);
  });

  it("reports gone on a 410 so the caller prunes the subscription", async () => {
    const { publicKey, privateKey } = vapidKeys();
    process.env.VAPID_PUBLIC_KEY = publicKey;
    process.env.VAPID_PRIVATE_KEY = privateKey;
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => new Response(null, { status: 410 })));
    expect(await sendPush({ endpoint: "https://fcm.googleapis.com/fcm/send/x" })).toEqual({ sent: false, gone: true });
  });
});
