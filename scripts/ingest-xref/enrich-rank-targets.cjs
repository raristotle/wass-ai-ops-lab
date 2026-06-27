const fs = require("fs");
const TAB = String.fromCharCode(9);
const clean = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
const norm = (s) => clean(s).toUpperCase().replace(/[^A-Z0-9]/g, "");
const isHub = (b) => /hubbell|wiegmann|burndy|killark|bryant|kellems|taymac|raco/i.test(b);
const isHydraulic = (b) => /aeroquip|weatherhead|vickers|synflex|cartridge valve|denison|winner|eaton$/i.test(b) && !/eaton (cutler|electrical|wiring)/i.test(b);
// already-enriched non-Hubbell mpns
const done = new Set();
const ts = fs.readFileSync("C:/Users/raris/wass-ai-ops-lab/data/real/enriched-cross-targets.ts", "utf8");
const re = /"mpn":\s*"((?:[^"\\]|\\.)*)"/g;
let m;
while ((m = re.exec(ts)) !== null) done.add(norm(m[1]));
console.log("already enriched (non-Hubbell): " + done.size);
// rank non-Hub non-hydraulic by freq, skip done
const freq = new Map(), brand = new Map();
for (const line of fs.readFileSync("inbox/xref-master.tsv", "utf8").split("\n")) {
  if (!line) continue; const f = line.split(TAB); if (f.length < 7) continue;
  const tb = clean(f[3]), tp = clean(f[4]);
  if (isHub(tb) || isHydraulic(tb)) continue;
  if (done.has(norm(tp))) continue;
  const k = tb + "||" + tp; if (freq.get(k) === undefined) brand.set(k, tb);
  freq.set(k, (freq.get(k) || 0) + 1);
}
const ranked = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3000);
fs.rmSync("enrich-n3k", { recursive: true, force: true }); fs.mkdirSync("enrich-n3k");
const SIZE = 40; let n = 0;
for (let i = 0; i < ranked.length; i += SIZE) {
  const b = ranked.slice(i, i + SIZE).map(([k, c]) => { const [tb, tp] = k.split("||"); return { brand: tb, part: tp, crossCount: c }; });
  fs.writeFileSync("enrich-n3k/b-" + String(n).padStart(3, "0") + ".json", JSON.stringify(b)); n++;
}
console.log("next-3000 non-Hubbell -> " + n + " batches (freq " + ranked[0][1] + "->" + ranked[ranked.length - 1][1] + "); top brands:");
const bc = {};
for (const [k] of ranked) { const b = brand.get(k); bc[b] = (bc[b] || 0) + 1; }
for (const [b, c] of Object.entries(bc).sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log("  " + String(c).padStart(4) + "  " + b);
fs.writeFileSync("enrich-progress.json", JSON.stringify({ nonHub: { dir: "enrich-n3k", next: 0, end: n }, hub: { dir: "hubbell-batches", next: 45, end: 70 } }, null, 1));
console.log("wrote enrich-progress.json (nonHub 0.." + n + ", hub 45..70)");
