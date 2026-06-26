/* G5: verify crosses + contradiction policy + dedup.
   Policy: a pair explicitly marked NOT-substitutable in ANY source is removed even if asserted
   positively elsewhere (rejection wins — conservative honesty). Exact dup pairs are already
   deduped on load; multiple distinct targets for one part are kept (valid alternatives, not a
   contradiction). Reports counts. Run: node gen-verify-dedup.cjs [write] */
const XLSX = require("xlsx");
const fs = require("fs");
const TAB = String.fromCharCode(9);
const WRITE = process.argv.includes("write");
const clean = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
const norm = (s) => clean(s).toUpperCase().replace(/[^A-Z0-9]/g, "");
const rows = XLSX.utils; // alias unused

// ── build the REJECTED pair set from negative-verification rows ──
const rejected = new Set();
const undirected = (a, b) => [`${a}>${b}`, `${b}>${a}`];
function addRej(a, b) { const x = norm(a), y = norm(b); if (!x || !y) return; for (const k of undirected(x, y)) rejected.add(k); }

// CrossCheck: "Is the Product Pair a Match?" starting with "no" (excludes Yes/Possible/notes)
(() => {
  const f = "inbox/all/Copy of 2023-05-26_CrossCheck_Unverified-Data-from-Rahul-for-Rick-Weaver-Review.xlsx";
  if (!fs.existsSync(f)) return;
  const a = XLSX.utils.sheet_to_json(XLSX.readFile(f, { raw: false }).Sheets["unverified_data from Rahul whic"], { header: 1, defval: "", raw: false });
  const h = a[0].map(clean);
  const ci = h.indexOf("sim_mfr_part_num"), ti = h.indexOf("substitute_mfr_part_num");
  const vi = h.findIndex((x) => /is the product pair/i.test(x));
  let n = 0;
  for (let i = 1; i < a.length; i++) { const v = clean(a[i][vi]).toLowerCase(); if (v === "no") { addRej(a[i][ci], a[i][ti]); n++; } }
  console.log(`CrossCheck rejections: ${n}`);
})();
// rep_crossref (Leviton test): Substitutable? = N
(() => {
  const f = "inbox/last/Copy of rep_crossref_matches_leviton_test-for-Rick-Weaver.xlsx";
  if (!fs.existsSync(f)) return;
  const a = XLSX.utils.sheet_to_json(XLSX.readFile(f, { raw: false }).Sheets["rep_crossref_matches_leviton"], { header: 1, defval: "", raw: false });
  const h = a[0].map(clean);
  const ci = h.indexOf("ORIGIN_PART_NUM"), ti = h.indexOf("ORIGIN_PART_NUM_comparable");
  const vi = h.findIndex((x) => /substitutable/i.test(x));
  let n = 0;
  for (let i = 1; i < a.length; i++) { const v = clean(a[i][vi]).toUpperCase(); if (v === "N") { addRej(a[i][ci], a[i][ti]); n++; } }
  console.log(`rep_crossref rejections: ${n}`);
})();
console.log(`rejected pair-keys (both directions): ${rejected.size}`);

// ── filter the master ──
const master = "inbox/xref-master.tsv";
const lines = fs.readFileSync(master, "utf8").split("\n").filter(Boolean);
let removed = 0; const kept = [];
const seenPair = new Set();           // exact (comp>tgt) dedup safety net
const compTargets = new Map();        // comp -> Set(targets) for multi-target stats
for (const line of lines) {
  const f = line.split(TAB); if (f.length < 7) continue;
  const ck = f[0], tk = norm(f[4]);
  const key = `${ck}>${tk}`;
  if (rejected.has(key)) { removed++; continue; }       // contradiction: explicitly rejected
  if (seenPair.has(key)) { removed++; continue; }        // redundant exact dup
  seenPair.add(key);
  if (!compTargets.has(ck)) compTargets.set(ck, new Set());
  compTargets.get(ck).add(tk);
  kept.push(line);
}
let multi = 0, maxT = 0;
for (const s of compTargets.values()) { if (s.size > 1) multi++; if (s.size > maxT) maxT = s.size; }
console.log(`\nMaster: ${lines.length} -> ${kept.length} kept (removed ${removed}: rejected+redundant).`);
console.log(`Distinct competitor parts: ${compTargets.size}; with multiple valid targets: ${multi} (max ${maxT}).`);
if (WRITE) { fs.writeFileSync(master, kept.join("\n") + "\n"); console.log("WROTE clean master."); }
else console.log("(dry — pass 'write' to commit)");
