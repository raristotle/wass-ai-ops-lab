"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { parseEprocCSV } from "@/lib/risk/eproc";
import type { EprocAccount } from "@/lib/risk/eproc";

interface Props {
  onImport: (accounts: EprocAccount[]) => void;
}

type Status = { type: "success" | "error"; msg: string } | null;

export function CsvImport({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== "string") {
        setStatus({ type: "error", msg: "Could not read file." });
        return;
      }
      const accounts = parseEprocCSV(text);
      if (accounts.length === 0) {
        setStatus({ type: "error", msg: "No valid rows found. Check column headers." });
      } else {
        onImport(accounts);
        setStatus({
          type: "success",
          msg: `Imported ${accounts.length} account${accounts.length !== 1 ? "s" : ""}.`,
        });
      }
    };
    reader.onerror = () => setStatus({ type: "error", msg: "File read error." });
    reader.readAsText(file);

    // Reset so the same file can be re-imported
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFile}
        aria-label="Import CSV file"
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
      >
        <Upload className="h-3.5 w-3.5" />
        Import CSV
      </button>

      {status && (
        <span
          className={`flex items-center gap-1.5 text-xs ${
            status.type === "success" ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle className="h-3.5 w-3.5" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5" />
          )}
          {status.msg}
        </span>
      )}
    </div>
  );
}
