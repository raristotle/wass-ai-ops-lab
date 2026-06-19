import { describe, it, expect, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import {
  esignConfigured,
  esignTestMode,
  buildSignatureRequestBody,
  verifyEsignEventHash,
  parseEsignEvent,
  esignOutcomeFromEvent,
  isAllowedFileUrl,
} from "@/lib/integration/esign-live";

const KEY = "test-api-key-abc";

afterEach(() => {
  delete process.env.DROPBOX_SIGN_API_KEY;
  delete process.env.DROPBOX_SIGN_TEST_MODE;
  delete process.env.ESIGN_FILE_URL_HOSTS;
});

describe("esign dormancy gate", () => {
  it("is dormant without the API key", () => {
    expect(esignConfigured()).toBe(false);
  });
  it("is configured once the API key is set", () => {
    process.env.DROPBOX_SIGN_API_KEY = KEY;
    expect(esignConfigured()).toBe(true);
  });
  it("defaults to test mode (free, non-binding) even when configured", () => {
    process.env.DROPBOX_SIGN_API_KEY = KEY;
    expect(esignTestMode()).toBe(true);
  });
  it("only leaves test mode when explicitly set to false", () => {
    process.env.DROPBOX_SIGN_TEST_MODE = "false";
    expect(esignTestMode()).toBe(false);
    process.env.DROPBOX_SIGN_TEST_MODE = "true";
    expect(esignTestMode()).toBe(true);
  });
});

describe("buildSignatureRequestBody", () => {
  it("builds a single-signer request with the quote id in metadata", () => {
    const body = buildSignatureRequestBody({
      quoteId: "Q-7",
      quoteNumber: "Q-20260618-0007",
      signerName: "Jane Buyer",
      signerEmail: "jane@example.com",
      fileUrl: "https://app.example.com/doc.pdf",
      testMode: true,
    });
    expect(body.test_mode).toBe(true);
    expect(body.title).toContain("Q-20260618-0007");
    expect(body.signers).toEqual([{ name: "Jane Buyer", email_address: "jane@example.com" }]);
    expect(body.file_urls).toEqual(["https://app.example.com/doc.pdf"]);
    expect((body.metadata as { quote_id: string }).quote_id).toBe("Q-7");
  });
});

describe("verifyEsignEventHash (HMAC-SHA256 over event_time+event_type, keyed by API key)", () => {
  const eventTime = "1351696104";
  const eventType = "callback_test";

  it("accepts a hash computed with the documented scheme (no separator)", () => {
    const good = createHmac("sha256", KEY).update(`${eventTime}${eventType}`).digest("hex");
    expect(verifyEsignEventHash(eventTime, eventType, good, KEY)).toBe(true);
  });

  it("rejects a hash computed with a separator (proves direct concatenation)", () => {
    const wrong = createHmac("sha256", KEY).update(`${eventTime}.${eventType}`).digest("hex");
    expect(verifyEsignEventHash(eventTime, eventType, wrong, KEY)).toBe(false);
  });

  it("rejects a hash made with the wrong key", () => {
    const wrongKey = createHmac("sha256", "other-key").update(`${eventTime}${eventType}`).digest("hex");
    expect(verifyEsignEventHash(eventTime, eventType, wrongKey, KEY)).toBe(false);
  });

  it("rejects empty/garbage", () => {
    expect(verifyEsignEventHash(eventTime, eventType, "", KEY)).toBe(false);
    expect(verifyEsignEventHash(eventTime, eventType, "deadbeef", KEY)).toBe(false);
    expect(verifyEsignEventHash("", "", "x", KEY)).toBe(false);
  });
});

describe("parseEsignEvent + esignOutcomeFromEvent", () => {
  const evt = (type: string, id: string | null) => ({
    event: { event_time: "1351696104", event_type: type, event_hash: "abc123" },
    ...(id ? { signature_request: { signature_request_id: id } } : {}),
  });

  it("parses the event fields", () => {
    const p = parseEsignEvent(evt("signature_request_signed", "sig-9"));
    expect(p).not.toBeNull();
    expect(p!.eventType).toBe("signature_request_signed");
    expect(p!.eventHash).toBe("abc123");
    expect(p!.signatureRequestId).toBe("sig-9");
  });

  it("returns null when there is no event object", () => {
    expect(parseEsignEvent({})).toBeNull();
    expect(parseEsignEvent({ event: { event_type: "x" } })).toBeNull();
  });

  it("maps signed / all_signed → signed", () => {
    for (const t of ["signature_request_signed", "signature_request_all_signed"]) {
      const o = esignOutcomeFromEvent(parseEsignEvent(evt(t, "sig-1"))!);
      expect(o).toEqual({ signatureRequestId: "sig-1", status: "signed" });
    }
  });

  it("maps declined / viewed / sent", () => {
    expect(esignOutcomeFromEvent(parseEsignEvent(evt("signature_request_declined", "s"))!)!.status).toBe("declined");
    expect(esignOutcomeFromEvent(parseEsignEvent(evt("signature_request_viewed", "s"))!)!.status).toBe("viewed");
    expect(esignOutcomeFromEvent(parseEsignEvent(evt("signature_request_sent", "s"))!)!.status).toBe("sent");
  });

  it("callback_test (no signature_request_id) yields no outcome", () => {
    const p = parseEsignEvent(evt("callback_test", null));
    expect(p).not.toBeNull();
    expect(esignOutcomeFromEvent(p!)).toBeNull();
  });

  it("unknown event types yield no outcome", () => {
    expect(esignOutcomeFromEvent(parseEsignEvent(evt("signature_request_remind", "s"))!)).toBeNull();
  });
});

describe("isAllowedFileUrl (SSRF guard)", () => {
  it("allows https on the request's own origin host", () => {
    expect(isAllowedFileUrl("https://app.raristotle.com/api/pdf/quote?t=x", "app.raristotle.com")).toBe(true);
  });
  it("rejects http and other hosts", () => {
    expect(isAllowedFileUrl("http://app.raristotle.com/x", "app.raristotle.com")).toBe(false);
    expect(isAllowedFileUrl("https://evil.example.com/x", "app.raristotle.com")).toBe(false);
    expect(isAllowedFileUrl("https://169.254.169.254/latest/meta-data", "app.raristotle.com")).toBe(false);
  });
  it("honors the ESIGN_FILE_URL_HOSTS allowlist", () => {
    process.env.ESIGN_FILE_URL_HOSTS = "docs.example.com, cdn.example.com";
    expect(isAllowedFileUrl("https://docs.example.com/q.pdf", "app.raristotle.com")).toBe(true);
    expect(isAllowedFileUrl("https://other.example.com/q.pdf", "app.raristotle.com")).toBe(false);
  });
  it("rejects malformed URLs", () => {
    expect(isAllowedFileUrl("not a url", "app.raristotle.com")).toBe(false);
  });
});
