/* Ingest PDF-extracted cross pairs (from the extract-pdf-crosses workflow) into the master.
   Reads the workflow .output file, parses the JSON, junk-filters + dedups, appends to master.
   Run: node gen-ingest-pdf-crosses.cjs <output-file> [write] */
const fs = require("fs");
const TAB = String.fromCharCode(9);
const OUTFILE = process.argv[2];
const WRITE = process.argv.includes("write");
const clean = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
const normKey = (s) => clean(s).toUpperCase().replace(/[^A-Z0-9]/g, "");
const JUNK = new Set(["NOCROSS","NONE","NA","NAN","TBD","NULL","0","DIRECT","FUNCTIONAL","EXACT","NOTINSAP","NOTFOUND","SEEBELOW","DISCONTINUED","OBSOLETE","YES","NO","POSSIBLE","TRUE","FALSE","UNKNOWN","MULTIPLE","VARIOUS","SAME","NOEQUIVALENT","NOEQUIV","NOMATCH","PAGE"]);
const JUNK_PHRASE = /(does not|no equivalent|no cross|see (note|below|page)|discontinued|n\/a)/i;
function junk(p){const c=clean(p);if(!c||c.length<2||c.length>48)return true;if(!/[A-Za-z0-9]/.test(c))return true;const t=c.toUpperCase().replace(/[^A-Z0-9]/g,"");if(!t||JUNK.has(t))return true;if(JUNK_PHRASE.test(c))return true;if((c.match(/\s/g)||[]).length>=3)return true;return false;}

// load master
const seen = new Set(); const rows = [];
for (const line of fs.readFileSync("inbox/xref-master.tsv", "utf8").split("\n")) { if (!line) continue; const f = line.split(TAB); if (f.length < 7) continue; seen.add(`${normKey(f[2])}>${normKey(f[4])}`); rows.push(f); }
const start = rows.length;

// extract the JSON object containing "pdfs" from the output file
const raw = fs.readFileSync(OUTFILE, "utf8");
const p = raw.indexOf('"pdfs"');
let s0 = raw.lastIndexOf("{", p);
let depth = 0, end = -1, inStr = false, esc = false;
for (let k = s0; k < raw.length; k++) { const c = raw[k]; if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; } if (c === '"') inStr = true; else if (c === "{") depth++; else if (c === "}") { depth--; if (depth === 0) { end = k + 1; break; } } }
const obj = JSON.parse(raw.slice(s0, end));

const stats = {};
function add(src, cb, cp, tb, tp) {
  if (junk(cp) || junk(tp)) return false;
  const ck = normKey(cp), tk = normKey(tp); if (!ck || !tk || ck === tk) return false;
  const k = `${ck}>${tk}`; if (seen.has(k)) return false; seen.add(k);
  rows.push([ck, clean(cb) || "?", clean(cp), clean(tb) || "?", clean(tp), src, "f"]);
  stats[src] = (stats[src] || 0) + 1; return true;
}
for (const pdf of obj.pdfs) {
  const tb = clean(pdf.targetBrand) || "?";
  const src = `PDF: ${clean(pdf.file).replace(/\.pdf$/i, "")}`;
  for (const pr of (pdf.pairs || [])) add(src, pr.competitorBrand || "", pr.competitorPart, tb, pr.targetPart);
}
console.log("Per-PDF ingested:");
for (const pdf of obj.pdfs) { const src = `PDF: ${clean(pdf.file).replace(/\.pdf$/i, "")}`; console.log(`  ${clean(pdf.file).slice(0, 42).padEnd(42)} tgt=${(clean(pdf.targetBrand) || "?").padEnd(10)} extracted ${String(pdf.count).padStart(5)} -> added ${String(stats[src] || 0).padStart(5)}`); if (pdf.note) console.log(`        note: ${clean(pdf.note).slice(0, 130)}`); }
console.log(`\nAdded ${rows.length - start} new pairs -> master ${rows.length}.`);
if (WRITE) { fs.writeFileSync("inbox/xref-master.tsv", rows.map((r) => r.join(TAB)).join("\n") + "\n"); console.log("WROTE master."); }
else console.log("(dry — pass 'write')");
