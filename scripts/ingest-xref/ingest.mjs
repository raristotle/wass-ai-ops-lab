#!/usr/bin/env node
/**
 * Reusable cross-reference (xref) ingestion tool.
 * ------------------------------------------------
 * Turns a pile of varied competitor→target cross-reference spreadsheets
 * (.xlsx / .xls / .xlsb / .csv) into the packed `data/real/xref-crosses.ts`
 * tier the recommender's cross-match engine reads.
 *
 * It does the boring, error-prone part for you:
 *   1. Walks an input directory of spreadsheets.
 *   2. Auto-detects the competitor-part column and the target-part column from
 *      the header row (synonym + brand heuristics), or uses a per-file override.
 *   3. Extracts (competitorPart → targetPart) pairs, drops junk ("NO CROSS",
 *      "#N/A", blanks, self-crosses), and dedupes against everything already
 *      ingested.
 *   4. Re-packs the merged set to data/real/xref-crosses.ts (interned brands +
 *      sources, tab-delimited rows — keeps the literal small and server-only).
 *
 * USAGE
 *   node scripts/ingest-xref/ingest.mjs --input <dir> [--master <tsv>] [--dry]
 *
 *   --input   directory of spreadsheets to ingest (required)
 *   --master  path to the running master TSV of already-ingested pairs.
 *             Defaults to <input>/../xref-master.tsv. Created if missing.
 *   --dry     parse + report only; write nothing. ALWAYS run --dry first and
 *             eyeball the per-file "comp / tgt / sample" lines before a real run.
 *   --overrides <json>  path to a JSON file of per-file column overrides (see
 *             sources.example.json). Use it for files the auto-detector flags ??.
 *
 * ADD A NEW FILE
 *   Drop the spreadsheet in the input dir and re-run. If it shows ?? (columns
 *   not confidently detected), add an entry to your overrides JSON:
 *     { "My File.xlsx": { "sheet": "Sheet1", "comp": "Competitor Part",
 *       "tgt": "Our Part", "compBrand": "Acme", "tgtBrand": "Hubbell",
 *       "source": "My File 2024", "relation": "functional-substitute",
 *       "filterCol": "Is Match?", "filterVal": "yes" } }
 *   then re-run. Idempotent: re-ingesting the same file adds nothing new.
 *
 * This is intentionally dependency-light (only `xlsx`, already in the repo) and
 * writes plain TS, so the catalog build stays a pure `import`.
 */
import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
// xlsx is a dev-only dependency of this build-time tool (never imported by app code,
// so it never reaches the browser bundle). Install it with `npm i -D xlsx`, or point
// XLSX_PATH at an existing install.
function loadXLSX() {
  for (const c of ["xlsx", process.env.XLSX_PATH].filter(Boolean)) {
    try { return require(c); } catch { /* try next */ }
  }
  console.error("ERROR: xlsx not found. Run `npm i -D xlsx`, or set XLSX_PATH to its module path.");
  process.exit(1);
}
const XLSX = loadXLSX();

const TAB = String.fromCharCode(9);
const clean = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
const normKey = (s) => clean(s).toUpperCase().replace(/[^A-Z0-9]/g, "");

// ── argv ──
const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const DRY = argv.includes("--dry");
const INPUT = arg("--input");
if (!INPUT) {
  console.error("ERROR: --input <dir> is required. See header for usage.");
  process.exit(1);
}
const MASTER = arg("--master", path.join(INPUT, "..", "xref-master.tsv"));
const OVERRIDES_PATH = arg("--overrides");
const OVERRIDES = OVERRIDES_PATH && fs.existsSync(OVERRIDES_PATH)
  ? JSON.parse(fs.readFileSync(OVERRIDES_PATH, "utf8"))
  : {};
const OUT_TS = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..", "data", "real", "xref-crosses.ts");

// ── detection heuristics ──
// A column is "part-like" if its header reads like a part identifier AND it is
// not obviously a description / qty / price / date column.
const PART_HDR = /(part|catalog|cat\b|sku|item|number|no\.?$|mpn|model|sim|cross|comparable|upgrade)/i;
const NOT_PART_HDR = /(descr|description|\btype\b|\bname\b|uom|\bqty\b|quantity|price|cost|\bdate\b|class|category|brand|mfr name|manufacturer name|vendor name|status|notes?|comment)/i;
// Which side a part-like column belongs to.
const COMP_HDR = /(competitor|\bcomp\b|comp[_ ]?part|comp[_ ]?cat|comp item|national brand|\bnb[_ ]|their|legacy|cross ?from|\bfrom\b|source[_ ]?(sim|cat|item|num)|sim_mfr_part|current catalog|origin_part_num_legacy|vndr|anixter northern item|hikvision|dahua)/i;
const TGT_HDR = /(our |wesco|owned brand|\bob[_ ]|comparable|replacement|\bto\b|catalog no|origin_part_num_hub|new catalog|new liberty|upgrade part|substitute_mfr_part|productskunum|pelco|inaxsys|madison|bosch item|3m (cross|part)|hub\b)/i;

function partLike(hdr) {
  const h = clean(hdr);
  if (!h) return false;
  return PART_HDR.test(h) && !NOT_PART_HDR.test(h);
}

/** Detect comp/tgt columns for a sheet. Returns {comp,tgt} as header strings or null. */
function detect(headers) {
  const idx = headers.map((h, i) => ({ h: clean(h), i })).filter((x) => x.h);
  const parts = idx.filter((x) => partLike(x.h));
  let comp = parts.find((x) => COMP_HDR.test(x.h));
  let tgt = parts.find((x) => TGT_HDR.test(x.h) && (!comp || x.i !== comp.i));
  // Fallbacks: if exactly two part-like columns, assume left=comp, right=tgt.
  if ((!comp || !tgt) && parts.length >= 2) {
    if (!comp) comp = parts[0];
    if (!tgt) tgt = parts.find((x) => x.i !== comp.i) || null;
  }
  return { comp: comp ? comp.h : null, tgt: tgt ? tgt.h : null };
}

// ── junk filter ──
// Relationship words / placeholders that show up where a part number should be — these are
// not parts. Compared after stripping non-alphanumerics so "NO-CROSS"/"no cross" both match.
const JUNK_TOKENS = new Set([
  "NOCROSS", "NONE", "NA", "NAN", "TBD", "NULL", "0", "DIRECT", "FUNCTIONAL", "EXACT", "EXACTMATCH",
  "CLOSEMATCH", "FUNCTIONALEQUIVALENT", "DIRECTEQUIVALENT", "NOTINSAP", "NOTFOUND", "SEEBELOW",
  "SEENOTE", "DISCONTINUED", "OBSOLETE", "YES", "NO", "POSSIBLE", "MAYBE", "TRUE", "FALSE",
  "UNKNOWN", "MULTIPLE", "VARIOUS", "SAME", "NOEQUIVALENT", "NOEQUIV", "NOMATCH",
]);
const JUNK_PHRASE = /(does not|do not|not have|no equivalent|no cross|see (note|below|tab|sheet)|discontinued|obsolete|n\/a)/i;
function isJunkPart(p) {
  const c = clean(p);
  if (!c || c.length < 2 || c.length > 48) return true;
  if (!/[A-Za-z0-9]/.test(c)) return true;
  const tok = c.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!tok || JUNK_TOKENS.has(tok)) return true;
  if (JUNK_PHRASE.test(c)) return true;
  if ((c.match(/\s/g) || []).length >= 3) return true; // 4+ whitespace-separated tokens ≠ one part
  return false;
}

// ── load existing master ──
/** Each master row: compKey \t compBrand \t compPart \t tgtBrand \t tgtPart \t source \t rel */
const seen = new Set(); // `${compKey}>${tgtKey}`
const rows = [];
if (fs.existsSync(MASTER)) {
  const data = fs.readFileSync(MASTER, "utf8");
  for (const line of data.split("\n")) {
    if (!line) continue;
    const f = line.split(TAB);
    if (f.length < 7) continue;
    const k = `${normKey(f[2])}>${normKey(f[4])}`;
    if (seen.has(k)) continue;
    seen.add(k);
    rows.push(f);
  }
}
const startCount = rows.length;

function addPair(compBrand, compPart, tgtBrand, tgtPart, source, rel) {
  if (isJunkPart(compPart) || isJunkPart(tgtPart)) return false;
  const ck = normKey(compPart), tk = normKey(tgtPart);
  if (!ck || !tk || ck === tk) return false;
  const k = `${ck}>${tk}`;
  if (seen.has(k)) return false;
  seen.add(k);
  rows.push([ck, clean(compBrand) || "?", clean(compPart), clean(tgtBrand) || "?", clean(tgtPart), clean(source), rel === "equivalent" ? "e" : "f"]);
  return true;
}

// ── process input dir ──
const EXT = new Set([".xlsx", ".xls", ".xlsb", ".csv"]);
const files = fs.readdirSync(INPUT).filter((f) => EXT.has(path.extname(f).toLowerCase())).sort();
const report = [];
for (const file of files) {
  const full = path.join(INPUT, file);
  let wb;
  try { wb = XLSX.readFile(full, { raw: false }); }
  catch (e) { report.push({ file, status: "ERR", note: e.message }); continue; }
  const ov = OVERRIDES[file] || {};
  if (ov.skip) { report.push({ file, status: "SKIP", note: ov.skip === true ? "override: skip" : ov.skip }); continue; }
  const sheetName = ov.sheet || wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  if (!ws) { report.push({ file, status: "ERR", note: `sheet ${sheetName} missing` }); continue; }
  const a = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false });
  if (a.length < 2) { report.push({ file, status: "EMPTY", note: "no data rows" }); continue; }
  const headers = (a[0] || []).map(clean);

  // ── wide / matrix mode: one "key" column crosses to several brand columns on the same row ──
  // override: { "wide": { "key": "VNDR ITEM", "keyBrand": "Corning", "brands": ["CommScope","Panduit"] } }
  // emits, per brand column with a value: competitor=row[brand] (brand=col header) → target=row[key].
  if (ov.wide) {
    const ki = headers.findIndex((h) => h.toLowerCase() === String(ov.wide.key).toLowerCase());
    const bcols = ov.wide.brands.map((b) => ({ b, i: headers.findIndex((h) => h.toLowerCase() === String(b).toLowerCase()) })).filter((x) => x.i >= 0);
    const source = ov.source || file.replace(/\.(xlsx?|xlsb|csv)$/i, "");
    const rel = ov.relation || "functional-substitute";
    let added = 0; const samples = [];
    for (let i = 1; i < a.length; i++) {
      const keyVal = a[i][ki];
      if (isJunkPart(keyVal)) continue;
      for (const { b, i: bi } of bcols) {
        if (addPair(b, a[i][bi], ov.wide.keyBrand || "", keyVal, source, rel)) {
          added++;
          if (samples.length < 2) samples.push(`${clean(a[i][bi])} (${b}) → ${clean(keyVal)}`);
        }
      }
    }
    report.push({ file, status: "OK", comp: `${bcols.length} brand cols`, tgt: ov.wide.key, scanned: a.length - 1, added, samples });
    continue;
  }

  const det = ov.comp && ov.tgt ? { comp: ov.comp, tgt: ov.tgt } : detect(headers);
  if (!det.comp || !det.tgt) {
    report.push({ file, status: "??", note: `comp=${det.comp || "-"} tgt=${det.tgt || "-"}`, sheet: sheetName });
    continue;
  }
  const ci = headers.findIndex((h) => h.toLowerCase() === det.comp.toLowerCase());
  const ti = headers.findIndex((h) => h.toLowerCase() === det.tgt.toLowerCase());
  const fi = ov.filterCol ? headers.findIndex((h) => h.toLowerCase() === String(ov.filterCol).toLowerCase()) : -1;
  // Optional per-row brand columns (some files name the competitor/target brand per line).
  const cbi = ov.compBrandCol ? headers.findIndex((h) => h.toLowerCase() === String(ov.compBrandCol).toLowerCase()) : -1;
  const tbi = ov.tgtBrandCol ? headers.findIndex((h) => h.toLowerCase() === String(ov.tgtBrandCol).toLowerCase()) : -1;
  const source = ov.source || file.replace(/\.(xlsx?|xlsb|csv)$/i, "");
  const rel = ov.relation || "functional-substitute";
  // Brand labels are cosmetic (the part numbers drive the lookup); derive sensible defaults.
  const compBrand = ov.compBrand || (/legacy/i.test(det.comp) ? "Competitor (legacy)" : "");
  const tgtBrand = ov.tgtBrand
    || (/hub/i.test(det.tgt) ? "Wesco (comparable)" : det.tgt.replace(/[_ ]?(part|catalog|cat|sku|item|number|no\.?|cross).*$/i, "").trim())
    || "";
  let added = 0, scanned = 0;
  const samples = [];
  for (let i = 1; i < a.length; i++) {
    const r = a[i];
    if (fi >= 0 && ov.filterVal && clean(r[fi]).toLowerCase() !== String(ov.filterVal).toLowerCase()) continue;
    scanned++;
    const cb = cbi >= 0 ? (clean(r[cbi]) || compBrand) : compBrand;
    const tb = tbi >= 0 ? (clean(r[tbi]) || tgtBrand) : tgtBrand;
    if (addPair(cb, r[ci], tb, r[ti], source, rel)) {
      added++;
      if (samples.length < 2) samples.push(`${clean(r[ci])} → ${clean(r[ti])}`);
    }
  }
  report.push({ file, status: "OK", comp: det.comp, tgt: det.tgt, scanned, added, samples });
}

// ── report ──
console.log(`\nMaster start: ${startCount} pairs  |  files: ${files.length}  |  mode: ${DRY ? "DRY (no write)" : "WRITE"}\n`);
for (const r of report) {
  if (r.status === "OK") {
    console.log(`OK  ${r.file.slice(0, 50).padEnd(50)} +${String(r.added).padStart(6)}  [${r.comp} → ${r.tgt}]`);
    for (const s of r.samples) console.log(`        e.g. ${s}`);
  } else {
    console.log(`${r.status.padEnd(3)} ${r.file.slice(0, 50).padEnd(50)} ${r.note || ""}`);
  }
}
const okCount = report.filter((r) => r.status === "OK").length;
const added = rows.length - startCount;
console.log(`\nDetected+ingested ${okCount}/${files.length} files. Added ${added} new pairs → master total ${rows.length}.`);
const flagged = report.filter((r) => r.status === "??").map((r) => r.file);
if (flagged.length) console.log(`\nNeeds override (${flagged.length}): ${flagged.join(", ")}`);

if (DRY) { console.log("\n--dry: nothing written. Re-run without --dry to commit."); process.exit(0); }

// ── write master TSV ──
fs.writeFileSync(MASTER, rows.map((r) => r.join(TAB)).join("\n") + "\n");

// ── pack to data/real/xref-crosses.ts ──
const brands = new Map(), sources = new Map();
const intern = (m, v) => { const k = clean(v) || "?"; if (!m.has(k)) m.set(k, m.size); return m.get(k); };
const packed = rows.map((r) => {
  const cb = intern(brands, r[1]), tb = intern(brands, r[3]), si = intern(sources, r[5]);
  // packed row: cbIdx \t competitorPart \t tbIdx \t targetPart \t srcIdx \t rel
  return [cb, r[2], tb, r[4], si, r[6]].join(TAB);
}).join("\n");
const brandArr = [...brands.keys()];
const srcArr = [...sources.keys()];
const ts = `// AUTO-GENERATED by scripts/ingest-xref/ingest.mjs — do not edit by hand.
// ${rows.length} verified competitor→target cross-references, ingested from rep-supplied
// manufacturer cross files. Packed (interned brands + sources, tab-delimited rows) so the
// literal stays small and the data is server-only (never shipped to the browser bundle).
//
// Row layout (XREF_PACKED, newline-separated): cbIdx \\t competitorPart \\t tbIdx \\t targetPart \\t srcIdx \\t rel
//   cbIdx/tbIdx index XREF_BRANDS · srcIdx indexes XREF_SOURCES · rel = 'e' (equivalent) | 'f' (functional-substitute)
/* eslint-disable */
export const XREF_BRANDS: string[] = ${JSON.stringify(brandArr)};
export const XREF_SOURCES: string[] = ${JSON.stringify(srcArr)};
export const XREF_PACKED = ${JSON.stringify(packed)};
`;
fs.writeFileSync(OUT_TS, ts);
const mb = (Buffer.byteLength(ts) / 1048576).toFixed(1);
console.log(`\nWrote ${path.relative(process.cwd(), OUT_TS)} — ${rows.length} pairs, ${brandArr.length} brands, ${srcArr.length} sources, ${mb}MB.`);
console.log(`Wrote master ${path.relative(process.cwd(), MASTER)}.`);
