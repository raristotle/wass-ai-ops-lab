import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { VoiceSearchButton } from "@/features/product-finder/VoiceSearchButton";

/**
 * VoiceSearchButton is a self-contained leaf: it reads no Zustand store and no
 * next/navigation. It detects Web Speech API support in an effect (so it is
 * SSR-safe and renders null until support is confirmed) and drives entirely off
 * its onInterim/onFinal props.
 *
 * jsdom has no SpeechRecognition, so the unsupported branch is the default. To
 * exercise the listening flow we install a controllable fake recognition ctor on
 * `window` and drive its onresult/onend/onerror callbacks by hand — exactly the
 * surface the component wires up.
 */

interface FakeRecognition {
  lang: string;
  interimResults: boolean;
  onresult: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

/** Build a results list shaped like SpeechRecognitionResultList. */
function resultsList(
  entries: Array<{ transcript: string; isFinal: boolean }>,
): unknown {
  const list: Record<number, unknown> & { length: number } = {
    length: entries.length,
  };
  entries.forEach((e, i) => {
    list[i] = { 0: { transcript: e.transcript }, length: 1, isFinal: e.isFinal };
  });
  return list;
}

/** Install a fake SpeechRecognition ctor; returns a handle to the last instance. */
function installRecognition(opts: { startThrows?: boolean } = {}) {
  const instances: FakeRecognition[] = [];
  class Ctor implements FakeRecognition {
    lang = "";
    interimResults = false;
    onresult: ((event: unknown) => void) | null = null;
    onend: (() => void) | null = null;
    onerror: ((event: { error: string }) => void) | null = null;
    start = vi.fn(() => {
      if (opts.startThrows) throw new Error("start failed");
    });
    stop = vi.fn();
    constructor() {
      instances.push(this);
    }
  }
  vi.stubGlobal("SpeechRecognition", Ctor as unknown);
  return {
    last: () => instances[instances.length - 1],
    count: () => instances.length,
  };
}

describe("VoiceSearchButton (render)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("support gating", () => {
    it("renders nothing when the browser has no SpeechRecognition (jsdom default)", () => {
      const { container } = render(
        <VoiceSearchButton onInterim={vi.fn()} onFinal={vi.fn()} />,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it("renders the mic button once support is detected", () => {
      installRecognition();
      render(<VoiceSearchButton onInterim={vi.fn()} onFinal={vi.fn()} />);
      const btn = screen.getByRole("button", { name: "Search by voice" });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveAttribute("aria-pressed", "false");
      // Idle: no privacy disclaimer yet.
      expect(
        screen.queryByText(/audio may be processed off-device/),
      ).not.toBeInTheDocument();
    });

    it("also detects the webkit-prefixed ctor", () => {
      class WebkitCtor {
        lang = "";
        interimResults = false;
        onresult = null;
        onend = null;
        onerror = null;
        start = vi.fn();
        stop = vi.fn();
      }
      vi.stubGlobal("webkitSpeechRecognition", WebkitCtor as unknown);
      render(<VoiceSearchButton onInterim={vi.fn()} onFinal={vi.fn()} />);
      expect(screen.getByRole("button", { name: "Search by voice" })).toBeInTheDocument();
    });

    it("passes through an extra className", () => {
      installRecognition();
      render(
        <VoiceSearchButton onInterim={vi.fn()} onFinal={vi.fn()} className="ml-2" />,
      );
      expect(screen.getByRole("button", { name: "Search by voice" })).toHaveClass("ml-2");
    });
  });

  describe("listening lifecycle", () => {
    it("starts listening on click — configures recognition and shows the live UI", () => {
      const handle = installRecognition();
      render(<VoiceSearchButton onInterim={vi.fn()} onFinal={vi.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: "Search by voice" }));

      const rec = handle.last();
      expect(rec.start).toHaveBeenCalledTimes(1);
      expect(rec.lang).toBe("en-US");
      expect(rec.interimResults).toBe(true);

      // The button flips to the stop affordance and the privacy disclaimer appears.
      const btn = screen.getByRole("button", { name: "Stop voice search" });
      expect(btn).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByText(/audio may be processed off-device/)).toBeInTheDocument();
    });

    it("emits interim transcript via onInterim while listening", () => {
      const onInterim = vi.fn();
      const handle = installRecognition();
      render(<VoiceSearchButton onInterim={onInterim} onFinal={vi.fn()} />);
      fireEvent.click(screen.getByRole("button", { name: "Search by voice" }));

      act(() => {
        handle.last().onresult?.({
          results: resultsList([
            { transcript: "circuit", isFinal: true },
            { transcript: "breaker", isFinal: false },
          ]),
        });
      });
      // Component joins `${finalText} ${interimText}` then trims the ends.
      expect(onInterim).toHaveBeenCalledWith("circuit breaker");
    });

    it("fires onFinal with the captured final text when recognition ends normally", () => {
      const onFinal = vi.fn();
      const handle = installRecognition();
      render(<VoiceSearchButton onInterim={vi.fn()} onFinal={onFinal} />);
      fireEvent.click(screen.getByRole("button", { name: "Search by voice" }));

      act(() => {
        handle.last().onresult?.({
          results: resultsList([{ transcript: "20 amp breaker", isFinal: true }]),
        });
      });
      act(() => handle.last().onend?.());

      expect(onFinal).toHaveBeenCalledTimes(1);
      expect(onFinal).toHaveBeenCalledWith("20 amp breaker");
      // Returns to idle state.
      expect(screen.getByRole("button", { name: "Search by voice" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      expect(
        screen.queryByText(/audio may be processed off-device/),
      ).not.toBeInTheDocument();
    });

    it("does NOT fire onFinal when cancelled via a second click", () => {
      const onFinal = vi.fn();
      const handle = installRecognition();
      render(<VoiceSearchButton onInterim={vi.fn()} onFinal={onFinal} />);
      fireEvent.click(screen.getByRole("button", { name: "Search by voice" }));

      act(() => {
        handle.last().onresult?.({
          results: resultsList([{ transcript: "ignore me", isFinal: true }]),
        });
      });
      // Second click cancels — stop() is requested and the cancelled flag is set.
      const rec = handle.last();
      fireEvent.click(screen.getByRole("button", { name: "Stop voice search" }));
      expect(rec.stop).toHaveBeenCalledTimes(1);

      // The browser then fires onend; because we cancelled, onFinal must not run.
      act(() => rec.onend?.());
      expect(onFinal).not.toHaveBeenCalled();
    });

    it("does NOT fire onFinal when ending with no final text captured", () => {
      const onFinal = vi.fn();
      const handle = installRecognition();
      render(<VoiceSearchButton onInterim={vi.fn()} onFinal={onFinal} />);
      fireEvent.click(screen.getByRole("button", { name: "Search by voice" }));
      // Only interim text seen, no final result.
      act(() => {
        handle.last().onresult?.({
          results: resultsList([{ transcript: "partial", isFinal: false }]),
        });
      });
      act(() => handle.last().onend?.());
      expect(onFinal).not.toHaveBeenCalled();
    });

    it("stops listening cleanly on a recognition error (and suppresses onFinal)", () => {
      const onFinal = vi.fn();
      const handle = installRecognition();
      render(<VoiceSearchButton onInterim={vi.fn()} onFinal={onFinal} />);
      fireEvent.click(screen.getByRole("button", { name: "Search by voice" }));

      act(() => handle.last().onerror?.({ error: "not-allowed" }));
      // UI returns to idle.
      expect(screen.getByRole("button", { name: "Search by voice" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      // A subsequent onend must not fire onFinal because onerror set the cancelled flag.
      act(() => handle.last().onend?.());
      expect(onFinal).not.toHaveBeenCalled();
    });

    it("recovers if recognition.start() throws (resets to idle)", () => {
      const handle = installRecognition({ startThrows: true });
      render(<VoiceSearchButton onInterim={vi.fn()} onFinal={vi.fn()} />);
      fireEvent.click(screen.getByRole("button", { name: "Search by voice" }));
      // start threw → component swallows and returns to idle, ready to retry.
      expect(handle.last().start).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("button", { name: "Search by voice" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });
  });

  describe("cleanup", () => {
    it("stops an in-flight recognition on unmount without firing onFinal", () => {
      const onFinal = vi.fn();
      const handle = installRecognition();
      const { unmount } = render(
        <VoiceSearchButton onInterim={vi.fn()} onFinal={onFinal} />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Search by voice" }));
      const rec = handle.last();
      act(() => {
        rec.onresult?.({
          results: resultsList([{ transcript: "late", isFinal: true }]),
        });
      });
      unmount();
      expect(rec.stop).toHaveBeenCalled();
      // onend after unmount must not surface a search.
      act(() => rec.onend?.());
      expect(onFinal).not.toHaveBeenCalled();
    });
  });
});
