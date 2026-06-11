"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ─── Minimal Web Speech API surface (lib.dom omits it; strict-typed, no any) ──

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
  length: number;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike {
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// ─── Mic icon (stroke style matches SearchBar icons) ─────────────────────────

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 shrink-0", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface VoiceSearchButtonProps {
  /** Live (interim) transcript while listening — for echoing into the input. */
  onInterim: (text: string) => void;
  /** Final transcript when recognition ends normally (not cancelled/errored). */
  onFinal: (text: string) => void;
  className?: string;
}

/**
 * Web Speech API voice-search trigger. Renders nothing when the browser has
 * no SpeechRecognition support (SSR-safe — support is detected in an effect).
 * Click toggles listening; a second click cancels without firing onFinal.
 */
export function VoiceSearchButton({ onInterim, onFinal, className }: VoiceSearchButtonProps) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const cancelledRef = useRef(false);
  const finalTextRef = useRef("");

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
  }, []);

  // Cancel cleanly on unmount — never fire onFinal after unmount.
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      recognitionRef.current?.stop();
    };
  }, []);

  if (!supported) return null;

  function handleClick() {
    if (listening) {
      // Cancel: onend must NOT fire onFinal.
      cancelledRef.current = true;
      recognitionRef.current?.stop();
      return;
    }

    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    cancelledRef.current = false;
    finalTextRef.current = "";

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (finalText) finalTextRef.current = finalText;
      const joined = `${finalText} ${interimText}`.trim();
      if (joined) onInterim(joined);
    };

    recognition.onerror = () => {
      // not-allowed / no-speech / anything else: end cleanly, run no search.
      cancelledRef.current = true;
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      const text = finalTextRef.current;
      finalTextRef.current = "";
      if (!cancelledRef.current && text) onFinal(text);
    };

    recognitionRef.current = recognition;
    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
      recognitionRef.current = null;
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={listening ? "Stop voice search" : "Search by voice"}
        aria-pressed={listening}
        title={listening ? "Stop listening" : "Search by voice"}
        className={cn(
          "flex items-center focus-visible:outline-none",
          listening
            ? "animate-pulse text-[#DB6B30]"
            : "text-slate-400 hover:text-[#1D252D]",
          className,
        )}
      >
        <MicIcon />
      </button>

      {/* One-line privacy disclaimer while the mic is hot. Positioned against
          the input row's relative wrapper (this component's mount point). */}
      {listening && (
        <span className="absolute left-0 top-full z-10 mt-1 rounded bg-[#1D252D] px-2 py-1 text-[10px] text-[#B7C9D3]">
          Voice search uses your browser&apos;s speech service — audio may be processed off-device.
        </span>
      )}
    </>
  );
}
