import { describe, it, expect, afterEach, vi } from "vitest";
import { smsConfigured, buildSmsForm, sendSms } from "@/lib/integration/sms-live";

afterEach(() => {
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.TWILIO_FROM_NUMBER;
  delete process.env.TWILIO_MESSAGING_SERVICE_SID;
  vi.unstubAllGlobals();
});

describe("smsConfigured", () => {
  it("requires SID + token + a sender (From or Messaging Service)", () => {
    expect(smsConfigured()).toBe(false);
    process.env.TWILIO_ACCOUNT_SID = "AC1";
    process.env.TWILIO_AUTH_TOKEN = "tok";
    expect(smsConfigured()).toBe(false); // no sender yet
    process.env.TWILIO_FROM_NUMBER = "+15551234567";
    expect(smsConfigured()).toBe(true);
  });
});

describe("buildSmsForm (pure)", () => {
  it("sets To + Body + From when a From number is configured", () => {
    process.env.TWILIO_FROM_NUMBER = "+15551234567";
    const f = buildSmsForm({ to: "+15558675310", body: "Order ready" });
    expect(f.get("To")).toBe("+15558675310");
    expect(f.get("Body")).toBe("Order ready");
    expect(f.get("From")).toBe("+15551234567");
    expect(f.get("MessagingServiceSid")).toBeNull();
  });

  it("prefers a Messaging Service SID over From when both are set", () => {
    process.env.TWILIO_FROM_NUMBER = "+15551234567";
    process.env.TWILIO_MESSAGING_SERVICE_SID = "MG123";
    const f = buildSmsForm({ to: "+1555", body: "x" });
    expect(f.get("MessagingServiceSid")).toBe("MG123");
    expect(f.get("From")).toBeNull();
  });
});

describe("sendSms (dormant)", () => {
  it("returns no-keys and makes NO network call when unconfigured", async () => {
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("{}", { status: 201 }));
    vi.stubGlobal("fetch", fetchSpy);
    const r = await sendSms({ to: "+15558675310", body: "hi" });
    expect(r).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
