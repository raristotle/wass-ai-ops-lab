/* Append found=false part keys from workflow output(s) to enrich-skip.json so build-iter never
   re-attempts unverifiable parts. Run: node record-skips.cjs <output1> [output2 ...] */
const fs = require("fs");
const norm = (s) => String(s == null ? "" : s).toUpperCase().replace(/[^A-Z0-9]/g, "");
const skip = new Set(fs.existsSync("enrich-skip.json") ? JSON.parse(fs.readFileSync("enrich-skip.json", "utf8")) : []);
const before = skip.size;
function extract(file) {
  const raw = fs.readFileSync(file, "utf8");
  const p = raw.indexOf('"results"'); if (p < 0) return [];
  let s0 = raw.lastIndexOf("{", p), depth = 0, end = -1, inStr = false, esc = false;
  for (let k = s0; k < raw.length; k++) { const c = raw[k]; if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; } if (c === '"') inStr = true; else if (c === "{") depth++; else if (c === "}") { depth--; if (depth === 0) { end = k + 1; break; } } }
  return JSON.parse(raw.slice(s0, end)).results || [];
}
for (const f of process.argv.slice(2)) for (const r of extract(f)) if (r && r.found === false) { const k = norm(r.part); if (k) skip.add(k); }
fs.writeFileSync("enrich-skip.json", JSON.stringify([...skip]));
console.log(`skip-list: ${before} -> ${skip.size} (+${skip.size - before})`);
