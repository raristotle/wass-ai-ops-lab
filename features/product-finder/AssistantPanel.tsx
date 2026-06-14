"use client";

import { useEffect, useRef, useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { apiAssistant } from "@/lib/product-finder-api";
import { cn } from "@/lib/utils";

/**
 * Ask Meridian (conversational) — a chat slide-over. Sends the conversation to
 * /api/assistant, which answers grounded in catalog + cross-reference tools when
 * ANTHROPIC_API_KEY is configured, or returns a labeled "ready to activate"
 * message otherwise. The deterministic Job Wizard remains the zero-cost path.
 */

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
}

const SUGGESTIONS = [
  "What do you stock that replaces a Bussmann FRN-R-30?",
  "Is the LC1D09G7 in stock, and what crosses to it?",
  "Find 20A breakers in stock under $30",
  "What are the specs on the Hoffman CSD16126?",
];

const TOOL_LABEL: Record<string, string> = {
  search_products: "searched the catalog",
  cross_reference: "cross-referenced a part",
  product_detail: "pulled product detail",
};

export function AssistantPanel() {
  const open = useProductFinder((s) => s.assistantOpen);
  const setOpen = useProductFinder((s) => s.setAssistantOpen);
  const setJobWizardOpen = useProductFinder((s) => s.setJobWizardOpen);

  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/assistant")
      .then((r) => r.json())
      .then((d) => setEnabled(!!d.enabled))
      .catch(() => setEnabled(false));
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  if (!open) return null;

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next: ChatTurn[] = [...turns, { role: "user", content: q }];
    setTurns(next);
    setInput("");
    setBusy(true);
    try {
      const res = await apiAssistant(next.map(({ role, content }) => ({ role, content })));
      setEnabled(res.enabled);
      setTurns([...next, { role: "assistant", content: res.reply, toolsUsed: res.toolsUsed }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label="Ask Meridian">
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between bg-[#1D252D] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white [font-family:var(--font-titillium,'Arial_Bold',sans-serif)]">
              Ask Meridian <span className="text-[#00AA13]">AI</span>
            </h2>
            <p className="text-[11px] text-[#B7C9D3]">
              Grounded in the catalog &amp; source-backed crosses — no invented parts.
            </p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="text-white/70 hover:text-white" aria-label="Close Ask Meridian">
            ✕
          </button>
        </div>

        {/* Activation banner */}
        {enabled === false && (
          <div className="shrink-0 border-b border-[#EAAA00]/40 bg-[#EAAA00]/10 px-4 py-2 text-[11px] text-[#1D252D]">
            <span className="font-semibold">Preview mode.</span> Set <code>ANTHROPIC_API_KEY</code> on the deployment to
            activate live answers — zero AI cost until then. The Job Wizard and Bulk Cross-Ref work now.
          </div>
        )}

        {/* Conversation */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {turns.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-[#4F758B]">
                Ask in plain English — I search the catalog, cross-reference competitor parts to what we stock (with
                sources), answer spec questions, and check availability.
              </p>
              <div className="space-y-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="block w-full rounded-lg border border-[#B7C9D3] px-3 py-2 text-left text-xs text-[#1D252D] transition-colors hover:border-[#00AA13] hover:bg-[#00AA13]/5"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((t, i) => (
            <div key={i} className={cn("flex", t.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                  t.role === "user" ? "bg-[#00AA13] text-white" : "bg-[#F2F5F7] text-[#1D252D]"
                )}
              >
                {t.content}
                {t.role === "assistant" && t.toolsUsed && t.toolsUsed.length > 0 && (
                  <p className="mt-1.5 text-[10px] italic text-[#4F758B]">
                    ✓ {t.toolsUsed.map((tn) => TOOL_LABEL[tn] ?? tn).join(", ")}
                  </p>
                )}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-[#F2F5F7] px-3 py-2 text-sm text-[#4F758B]">Thinking…</div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-[#B7C9D3]/60 p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Ask about a part, a cross, specs, or stock…"
              className="max-h-28 flex-1 resize-none rounded-lg border border-[#B7C9D3] px-3 py-2 text-sm text-[#1D252D] focus:border-[#00AA13] focus:outline-none focus:ring-1 focus:ring-[#00AA13]"
              aria-label="Ask Meridian message"
            />
            <button
              type="button"
              onClick={() => send(input)}
              disabled={busy || input.trim().length === 0}
              className={cn(
                "shrink-0 rounded-lg bg-[#00AA13] px-3 py-2 text-sm font-semibold text-white hover:bg-[#009911]",
                (busy || input.trim().length === 0) && "opacity-50"
              )}
            >
              Send
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setJobWizardOpen(true);
            }}
            className="mt-2 text-[11px] text-[#004986] underline underline-offset-2 hover:text-[#1D252D]"
          >
            Prefer a guided build? Open the Job Wizard →
          </button>
        </div>
      </div>
    </div>
  );
}
