import { describe, it, expect, afterEach, vi } from "vitest";
import { slackConfigured, buildAlert, sendSlackAlert } from "@/lib/integration/slack-alerts";

afterEach(() => {
  delete process.env.SLACK_WEBHOOK_URL;
  delete process.env.SLACK_ALERTS_ENABLED;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("slackConfigured", () => {
  it("is false when no webhook is set (dormant)", () => {
    expect(slackConfigured()).toBe(false);
  });
  it("is true when the webhook is set", () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/T/B/X";
    expect(slackConfigured()).toBe(true);
  });
  it("is false when kill-switched off even with a webhook", () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/T/B/X";
    process.env.SLACK_ALERTS_ENABLED = "false";
    expect(slackConfigured()).toBe(false);
    process.env.SLACK_ALERTS_ENABLED = "0";
    expect(slackConfigured()).toBe(false);
  });
});

describe("buildAlert (pure Block Kit)", () => {
  it("includes the fallback text and a header + fields + link + context", () => {
    const msg = buildAlert({
      title: "New order ord-123",
      text: "New order ord-123 — Acme ($1,200)",
      fields: [
        { label: "Customer", value: "Acme" },
        { label: "Total", value: "$1,200" },
      ],
      link: { url: "https://app.example.com/o/123", label: "Open order" },
      context: "meridian • order.placed",
    });
    expect(msg.text).toBe("New order ord-123 — Acme ($1,200)");
    const types = msg.blocks.map((b) => (b as { type: string }).type);
    expect(types).toEqual(["header", "section", "section", "context"]);
  });

  it("caps fields at 10 and the header at 150 chars", () => {
    const fields = Array.from({ length: 20 }, (_, i) => ({ label: `L${i}`, value: `V${i}` }));
    const msg = buildAlert({ title: "x".repeat(200), text: "t", fields });
    const header = msg.blocks[0] as { text: { text: string } };
    expect(header.text.text.length).toBe(150);
    const section = msg.blocks[1] as { fields: unknown[] };
    expect(section.fields.length).toBe(10);
  });
});

describe("sendSlackAlert", () => {
  it("returns not-configured and makes NO network call when dormant", async () => {
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const r = await sendSlackAlert(buildAlert({ title: "t", text: "t" }));
    expect(r).toEqual({ enabled: false, reason: "not-configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts to the webhook and treats the literal 'ok' body as success", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/T/B/X";
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const r = await sendSlackAlert(buildAlert({ title: "t", text: "t" }));
    expect(r).toEqual({ enabled: true });
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it("returns error (never throws) when the webhook does not return 'ok'", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/T/B/X";
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("invalid_payload", { status: 400 }));
    vi.stubGlobal("fetch", fetchSpy);
    const r = await sendSlackAlert(buildAlert({ title: "t", text: "t" }));
    expect(r).toEqual({ enabled: false, reason: "error" });
  });
});
