import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EsignButton } from "@/features/product-finder/EsignButton";
import type { SavedQuote } from "@/lib/product-finder-quotes";

/**
 * EsignButton is a self-contained leaf: it does not read the Zustand store or
 * next/navigation. It drives entirely off its props + the /api/esign/request
 * seam, so each test stubs `fetch` (vi.stubGlobal) to script the GET probe
 * (configured? testMode?) and the POST send, exactly as the project's other
 * fetch-in-effect render tests do.
 */

function quote(overrides: Partial<SavedQuote> = {}): SavedQuote {
  return {
    id: "q1",
    number: "Q-20260619-0001",
    customer: "Acme Industrial",
    project: "Plant retrofit",
    lines: [],
    total: 1200,
    status: "sent",
    createdAt: 1_700_000_000_000,
    customerId: null,
    ...overrides,
  };
}

/** A fetch stub that answers the GET probe and (optionally) the POST send. */
function makeFetch(opts: {
  configured?: boolean;
  testMode?: boolean;
  post?: () => { ok: boolean; body: unknown };
  pollStatus?: string;
}) {
  return vi.fn(async (url: string | URL, init?: { method?: string }) => {
    const href = typeof url === "string" ? url : url.toString();
    if (init?.method === "POST") {
      const r = opts.post?.() ?? { ok: true, body: { esignId: "es_1", status: "sent" } };
      return { ok: r.ok, json: async () => r.body };
    }
    if (href.includes("esignId=")) {
      // status poll
      return { ok: true, json: async () => ({ esign: { status: opts.pollStatus ?? "viewed" } }) };
    }
    // initial GET probe
    return {
      ok: true,
      json: async () => ({ configured: opts.configured ?? true, testMode: opts.testMode ?? true }),
    };
  });
}

const buildFileUrl = () => "https://origin.example/quote/q1.pdf";

describe("EsignButton (render)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("dormant / gating", () => {
    it("renders nothing while the seam is unconfigured (dormant demo)", async () => {
      vi.stubGlobal("fetch", makeFetch({ configured: false }));
      const { container } = render(<EsignButton quote={quote()} buildFileUrl={buildFileUrl} />);
      // The GET probe resolves to {configured:false}; nothing should ever appear.
      await waitFor(() => expect(container).toBeEmptyDOMElement());
      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing for a quote that is neither draft nor sent (e.g. won)", async () => {
      vi.stubGlobal("fetch", makeFetch({ configured: true }));
      const { container } = render(
        <EsignButton quote={quote({ status: "won" })} buildFileUrl={buildFileUrl} />,
      );
      await waitFor(() => expect(container).toBeEmptyDOMElement());
      expect(container).toBeEmptyDOMElement();
    });

    it("renders the action for a draft quote when configured", async () => {
      vi.stubGlobal("fetch", makeFetch({ configured: true }));
      render(<EsignButton quote={quote({ status: "draft" })} buildFileUrl={buildFileUrl} />);
      expect(
        await screen.findByRole("button", { name: /Send quote .* for e-signature/ }),
      ).toBeInTheDocument();
    });
  });

  describe("send flow", () => {
    it("opens the email field, sends, and shows the test-mode 'Sent for signature' state", async () => {
      const post = vi.fn(() => ({ ok: true, body: { esignId: "es_42", status: "sent" } }));
      vi.stubGlobal("fetch", makeFetch({ configured: true, testMode: true, post }));
      render(<EsignButton quote={quote()} buildFileUrl={buildFileUrl} />);

      const openBtn = await screen.findByRole("button", { name: /Send quote .* for e-signature/ });
      fireEvent.click(openBtn);

      const input = screen.getByLabelText("Signer email address");
      // Send button is disabled until an email is typed.
      const sendBtn = screen.getByRole("button", { name: "Send (test)" });
      expect(sendBtn).toBeDisabled();

      fireEvent.change(input, { target: { value: "  buyer@acme.com  " } });
      expect(sendBtn).not.toBeDisabled();
      fireEvent.click(sendBtn);

      expect(await screen.findByText("Sent for signature (test)")).toBeInTheDocument();
      expect(post).toHaveBeenCalledTimes(1);

      // POST body carried the trimmed email, the quote ids, and the file URL.
      const calls = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls;
      const postCall = calls.find((c) => (c[1] as { method?: string } | undefined)?.method === "POST");
      const body = JSON.parse((postCall?.[1] as { body: string }).body) as Record<string, unknown>;
      expect(body.signerEmail).toBe("buyer@acme.com");
      expect(body.quoteId).toBe("q1");
      expect(body.fileUrl).toBe("https://origin.example/quote/q1.pdf");
      expect(body.signerName).toBe("Acme Industrial");
    });

    it("shows non-test label 'Send' when testMode is false", async () => {
      vi.stubGlobal("fetch", makeFetch({ configured: true, testMode: false }));
      render(<EsignButton quote={quote()} buildFileUrl={buildFileUrl} />);
      fireEvent.click(await screen.findByRole("button", { name: /for e-signature/ }));
      expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
    });

    it("cancel closes the email field and returns to the send button", async () => {
      vi.stubGlobal("fetch", makeFetch({ configured: true }));
      render(<EsignButton quote={quote()} buildFileUrl={buildFileUrl} />);
      fireEvent.click(await screen.findByRole("button", { name: /for e-signature/ }));
      expect(screen.getByLabelText("Signer email address")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "cancel" }));
      expect(screen.queryByLabelText("Signer email address")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /for e-signature/ })).toBeInTheDocument();
    });

    it("surfaces a config error when the server replies enabled:false", async () => {
      const post = vi.fn(() => ({ ok: true, body: { enabled: false } }));
      vi.stubGlobal("fetch", makeFetch({ configured: true, post }));
      render(<EsignButton quote={quote()} buildFileUrl={buildFileUrl} />);
      fireEvent.click(await screen.findByRole("button", { name: /for e-signature/ }));
      fireEvent.change(screen.getByLabelText("Signer email address"), {
        target: { value: "buyer@acme.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Send (test)" }));
      expect(
        await screen.findByText(/Could not send. Check the Dropbox Sign/),
      ).toBeInTheDocument();
      // Stayed on the open form (did not transition to the sent state).
      expect(screen.getByLabelText("Signer email address")).toBeInTheDocument();
    });

    it("surfaces a generic error when the POST throws", async () => {
      const post = vi.fn(() => {
        throw new Error("network down");
      });
      vi.stubGlobal("fetch", makeFetch({ configured: true, post }));
      render(<EsignButton quote={quote()} buildFileUrl={buildFileUrl} />);
      fireEvent.click(await screen.findByRole("button", { name: /for e-signature/ }));
      fireEvent.change(screen.getByLabelText("Signer email address"), {
        target: { value: "buyer@acme.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Send (test)" }));
      expect(await screen.findByText("Could not send. Try again.")).toBeInTheDocument();
    });
  });

  describe("status states", () => {
    it("refresh button re-polls and updates the displayed status", async () => {
      const post = vi.fn(() => ({ ok: true, body: { esignId: "es_99", status: "sent" } }));
      vi.stubGlobal("fetch", makeFetch({ configured: true, post, pollStatus: "viewed" }));
      render(<EsignButton quote={quote()} buildFileUrl={buildFileUrl} />);
      fireEvent.click(await screen.findByRole("button", { name: /for e-signature/ }));
      fireEvent.change(screen.getByLabelText("Signer email address"), {
        target: { value: "buyer@acme.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Send (test)" }));

      const refresh = await screen.findByRole("button", { name: "Refresh signature status" });
      // poll returns "viewed" which is still a non-error, non-signed status → stays "Sent for signature".
      fireEvent.click(refresh);
      await waitFor(() => {
        const calls = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls;
        expect(calls.some((c) => String(c[0]).includes("esignId="))).toBe(true);
      });
      expect(screen.getByText("Sent for signature (test)")).toBeInTheDocument();
    });

    it("renders the 'Signed' badge once the poll reports a signed status", async () => {
      const post = vi.fn(() => ({ ok: true, body: { esignId: "es_signed", status: "sent" } }));
      vi.stubGlobal("fetch", makeFetch({ configured: true, post, pollStatus: "signed" }));
      render(<EsignButton quote={quote()} buildFileUrl={buildFileUrl} />);
      fireEvent.click(await screen.findByRole("button", { name: /for e-signature/ }));
      fireEvent.change(screen.getByLabelText("Signer email address"), {
        target: { value: "buyer@acme.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Send (test)" }));
      const refresh = await screen.findByRole("button", { name: "Refresh signature status" });
      fireEvent.click(refresh);
      expect(await screen.findByText(/Signed/)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Refresh signature status" })).not.toBeInTheDocument();
    });
  });
});
