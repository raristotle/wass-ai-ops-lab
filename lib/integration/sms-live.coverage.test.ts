import { describe, it, expect, afterEach, vi } from "vitest";
import { smsConfigured, buildSmsForm, sendSms } from "@/lib/integration/sms-live";

// Configured creds the live path needs. Helper keeps each test's intent obvious.
function configure(opts?: { messagingService?: boolean; noSender?: boolean }) {
  process.env.TWILIO_ACCOUNT_SID = "AC123";
  process.env.TWILIO_AUTH_TOKEN = "tok-secret";
  if (opts?.noSender) return;
  if (opts?.messagingService) process.env.TWILIO_MESSAGING_SERVICE_SID = "MG999";
  else process.env.TWILIO_FROM_NUMBER = "+15551234567";
}

afterEach(() => {
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.TWILIO_FROM_NUMBER;
  delete process.env.TWILIO_MESSAGING_SERVICE_SID;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("smsConfigured — env edges", () => {
  it("treats whitespace-only credentials as unset (env() trims to null)", () => {
    process.env.TWILIO_ACCOUNT_SID = "   ";
    process.env.TWILIO_AUTH_TOKEN = "tok";
    process.env.TWILIO_FROM_NUMBER = "+15551234567";
    expect(smsConfigured()).toBe(false);
  });

  it("accepts a Messaging Service SID as the sole sender", () => {
    process.env.TWILIO_ACCOUNT_SID = "AC1";
    process.env.TWILIO_AUTH_TOKEN = "tok";
    process.env.TWILIO_MESSAGING_SERVICE_SID = "MG123";
    expect(smsConfigured()).toBe(true);
  });
});

describe("buildSmsForm — remaining sender branches", () => {
  it("omits both sender fields when neither From nor Messaging Service is set", () => {
    const f = buildSmsForm({ to: "+1555", body: "x" });
    expect(f.get("To")).toBe("+1555");
    expect(f.get("Body")).toBe("x");
    expect(f.get("From")).toBeNull();
    expect(f.get("MessagingServiceSid")).toBeNull();
  });

  it("uses MessagingServiceSid (not From) when only a service SID is set", () => {
    process.env.TWILIO_MESSAGING_SERVICE_SID = "MG777";
    const f = buildSmsForm({ to: "+1555", body: "hello" });
    expect(f.get("MessagingServiceSid")).toBe("MG777");
    expect(f.get("From")).toBeNull();
  });
});

describe("sendSms — success path", () => {
  it("returns {enabled:true,sent:true} with parsed sid/status on a 201", async () => {
    configure();
    const fetchSpy = vi.fn(
      async (): Promise<Response> =>
        new Response(JSON.stringify({ sid: "SM_abc", status: "queued" }), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const r = await sendSms({ to: "+15558675310", body: "Order ready" });
    expect(r).toEqual({ enabled: true, sent: true, sid: "SM_abc", status: "queued" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Verify HTTP Basic auth + form encoding without leaking PII expectations.
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Basic ${Buffer.from("AC123:tok-secret").toString("base64")}`);
    expect(headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    expect(String(init.body)).toContain("To=%2B15558675310");
    expect(String(init.body)).toContain("From=%2B15551234567");
  });

  it("defaults sid to '' and status to 'queued' when the body omits them", async () => {
    configure({ messagingService: true });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => new Response(JSON.stringify({}), { status: 201 })),
    );
    const r = await sendSms({ to: "+1555", body: "x" });
    expect(r).toEqual({ enabled: true, sent: true, sid: "", status: "queued" });
  });

  it("treats an unparseable success body as empty and still succeeds", async () => {
    configure();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => new Response("not-json", { status: 200 })),
    );
    const r = await sendSms({ to: "+1555", body: "x" });
    expect(r).toEqual({ enabled: true, sent: true, sid: "", status: "queued" });
  });
});

describe("sendSms — failure paths (fail-closed, never throws)", () => {
  it("non-OK HTTP returns {enabled:true,sent:false} and logs status/code only", async () => {
    configure();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (): Promise<Response> =>
          new Response(JSON.stringify({ code: 21211, message: "Invalid 'To'" }), { status: 400 }),
      ),
    );

    const r = await sendSms({ to: "+1555", body: "x" });
    // res.ok is false; error_code absent so the code/message fallback is used.
    expect(r).toEqual({ enabled: true, sent: false, errorCode: 21211, errorMessage: "Invalid 'To'" });

    expect(errSpy).toHaveBeenCalledTimes(1);
    const logged = String(errSpy.mock.calls[0]?.[0]);
    expect(logged).toContain("twilio:sms");
    expect(logged).toContain("Twilio HTTP 400");
    // PII (recipient / body) must never appear in logs.
    expect(logged).not.toContain("+1555");
  });

  it("200 OK but error_code present still fails closed (no false positive)", async () => {
    configure();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (): Promise<Response> =>
          new Response(
            JSON.stringify({ sid: "SM_x", status: "failed", error_code: 30006, error_message: "Unreachable carrier" }),
            { status: 200 },
          ),
      ),
    );
    const r = await sendSms({ to: "+1555", body: "x" });
    expect(r).toEqual({
      enabled: true,
      sent: false,
      errorCode: 30006,
      errorMessage: "Unreachable carrier",
    });
  });

  it("non-OK with NO parseable error fields yields null code/message", async () => {
    configure();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => new Response("", { status: 500 })),
    );
    const r = await sendSms({ to: "+1555", body: "x" });
    expect(r).toEqual({ enabled: true, sent: false, errorCode: null, errorMessage: null });
  });

  it("fetch throwing (network/timeout) returns the 'unreachable' fail-closed union", async () => {
    configure();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => {
        throw new Error("network down");
      }),
    );
    const r = await sendSms({ to: "+1555", body: "x" });
    expect(r).toEqual({ enabled: true, sent: false, errorCode: null, errorMessage: "unreachable" });
    expect(errSpy).toHaveBeenCalledTimes(1);
    expect(String(errSpy.mock.calls[0]?.[0])).toContain("twilio:sms");
  });
});

describe("sendSms — dormant guard variants (no network)", () => {
  it("returns no-keys when SID+token set but NO sender is configured", async () => {
    configure({ noSender: true });
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("{}", { status: 201 }));
    vi.stubGlobal("fetch", fetchSpy);
    const r = await sendSms({ to: "+1555", body: "x" });
    expect(r).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns no-keys when only the auth token is missing", async () => {
    process.env.TWILIO_ACCOUNT_SID = "AC1";
    process.env.TWILIO_FROM_NUMBER = "+15551234567";
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("{}", { status: 201 }));
    vi.stubGlobal("fetch", fetchSpy);
    const r = await sendSms({ to: "+1555", body: "x" });
    expect(r).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
