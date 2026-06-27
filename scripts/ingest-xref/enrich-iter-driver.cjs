/* Prepare one enrichment iteration toward the targets, robust to session-limit partial runs.
   Targets (cumulative tier sizes): non-Hubbell 7803 (=4803+3000), Hubbell 1871 (=871+1000).
   Re-ranks remaining (excludes whatever is already in the tier files), writes the next chunk to
   enrich-iter/, and reports DONE when both targets are met. Run: node build-iter.cjs */
const fs = require("fs");
const TAB = String.fromCharCode(9);
const clean = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
const norm = (s) => clean(s).toUpperCase().replace(/[^A-Z0-9]/g, "");
const isHub = (b) => /hubbell|wiegmann|burndy|killark|bryant|kellems|taymac|raco|pcore|chance|anderson/i.test(b);
const isHydraulic = (b) => /aeroquip|weatherhead|vickers|synflex|cartridge valve|denison|winner|eaton$/i.test(b) && !/eaton (cutler|electrical|wiring)/i.test(b);
// internal Wesco/Anixter stock numbers — not public manufacturer parts, can't be web-verified
const isInternal = (b) => /wesco \(comparable\)|wesco ds|^wesco$/i.test(b);
const NONHUB_TARGET = 10836, HUB_TARGET = 2911;
const REPO = "C:/Users/raris/wass-ai-ops-lab/data/real/";

function doneSet(file) {
  const s = new Set(); if (!fs.existsSync(file)) return s;
  const re = /"mpn":\s*"((?:[^"\\]|\\.)*)"/g; const ts = fs.readFileSync(file, "utf8"); let m;
  while ((m = re.exec(ts)) !== null) s.add(norm(m[1]));
  return s;
}
const doneNon = doneSet(REPO + "enriched-cross-targets.ts");
const doneHub = doneSet(REPO + "enriched-hubbell.ts");
// parts already tried but unverifiable (found=false) — don't waste research re-attempting them
const skip = new Set(fs.existsSync("enrich-skip.json") ? JSON.parse(fs.readFileSync("enrich-skip.json", "utf8")) : []);
const nonNeed = Math.max(0, NONHUB_TARGET - doneNon.size);
const hubNeed = Math.max(0, HUB_TARGET - doneHub.size);
console.log(`non-Hubbell: ${doneNon.size}/${NONHUB_TARGET} (+${nonNeed} to go) | Hubbell: ${doneHub.size}/${HUB_TARGET} (+${hubNeed} to go)`);
if (nonNeed === 0 && hubNeed === 0) {
  fs.writeFileSync("enrich-iter-meta.json", JSON.stringify({ done: true, total: 0 }));
  console.log("ALL TARGETS MET — DONE"); process.exit(0);
}

// rank remaining
function rank(filterFn, doneS) {
  const freq = new Map(), brand = new Map();
  for (const line of fs.readFileSync("inbox/xref-master.tsv", "utf8").split("\n")) {
    if (!line) continue; const f = line.split(TAB); if (f.length < 7) continue;
    const tb = clean(f[3]), tp = clean(f[4]); if (!filterFn(tb)) continue;
    const nk = norm(tp); if (doneS.has(nk) || skip.has(nk)) continue;
    const k = tb + "||" + tp; if (freq.get(k) === undefined) brand.set(k, tb); freq.set(k, (freq.get(k) || 0) + 1);
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([k, c]) => { const [tb, tp] = k.split("||"); return { brand: tb, part: tp, crossCount: c }; });
}
const SIZE = 40;
// chunk allocation: cap ~40 batches/iteration (session-limit safe), split by remaining need
let nonBatches = nonNeed > 0 ? Math.min(28, Math.ceil(nonNeed / 34)) : 0;
let hubBatches = hubNeed > 0 ? Math.min(14, Math.ceil(hubNeed / 28)) : 0;
if (nonNeed === 0) { hubBatches = Math.min(28, Math.ceil(hubNeed / 28)); }
if (hubNeed === 0) { nonBatches = Math.min(40, Math.ceil(nonNeed / 34)); }

fs.rmSync("enrich-iter", { recursive: true, force: true }); fs.mkdirSync("enrich-iter");
let n = 0;
const writeChunk = (parts, batches) => {
  for (let i = 0; i < batches && i * SIZE < parts.length; i++) {
    fs.writeFileSync("enrich-iter/b-" + String(n).padStart(3, "0") + ".json", JSON.stringify(parts.slice(i * SIZE, i * SIZE + SIZE))); n++;
  }
};
// Hubbell first so the lagging target completes before any session-limit hit mid-chunk
if (hubBatches > 0) writeChunk(rank(isHub, doneHub), hubBatches);
if (nonBatches > 0) writeChunk(rank((b) => !isHub(b) && !isHydraulic(b) && !isInternal(b), doneNon), nonBatches);
fs.writeFileSync("enrich-iter-meta.json", JSON.stringify({ done: false, total: n, nonBatches, hubBatches }));
console.log(`this iteration: ${n} batches (${nonBatches} non-Hub + ${hubBatches} Hub) -> enrich-iter/`);
