/* Bespoke parser for merged-cell / wide / multi-sheet cross files the column-auto tool can't map.
   Appends deduped pairs to inbox/xref-master.tsv (7-col: key,compBrand,compPart,tgtBrand,tgtPart,source,rel).
   Run: node gen-merged-crosses.cjs [write]   (omit "write" for a dry report). */
const XLSX = require("xlsx");
const fs = require("fs");
const TAB = String.fromCharCode(9);
const WRITE = process.argv.includes("write");
const clean = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
const normKey = (s) => clean(s).toUpperCase().replace(/[^A-Z0-9]/g, "");
const JUNK = new Set(["NOCROSS","NONE","NA","NAN","TBD","NULL","0","DIRECT","FUNCTIONAL","EXACT","NOTINSAP","NOTFOUND","SEEBELOW","DISCONTINUED","OBSOLETE","YES","NO","POSSIBLE","TRUE","FALSE","UNKNOWN","MULTIPLE","VARIOUS","SAME","NOEQUIVALENT","NOEQUIV","NOMATCH","NEW","OLD","NA1","TBA"]);
const JUNK_PHRASE = /(does not|do not|not have|no equivalent|no cross|see (note|below|tab|sheet)|discontinued|obsolete|n\/a|use dome|no wireless|no cube)/i;
function junk(p){const c=clean(p);if(!c||c.length<2||c.length>48)return true;if(!/[A-Za-z0-9]/.test(c))return true;const t=c.toUpperCase().replace(/[^A-Z0-9]/g,"");if(!t||JUNK.has(t))return true;if(JUNK_PHRASE.test(c))return true;if((c.match(/\s/g)||[]).length>=3)return true;return false;}

const seen = new Set(); const rows = [];
const master = "inbox/xref-master.tsv";
for (const line of fs.readFileSync(master, "utf8").split("\n")) {
  if (!line) continue; const f = line.split(TAB); if (f.length < 7) continue;
  seen.add(`${normKey(f[2])}>${normKey(f[4])}`); rows.push(f);
}
const start = rows.length;
const stats = {};
function add(file, compBrand, compPart, tgtBrand, tgtPart, source, rel) {
  if (junk(compPart) || junk(tgtPart)) return false;
  const ck = normKey(compPart), tk = normKey(tgtPart);
  if (!ck || !tk || ck === tk) return false;
  const k = `${ck}>${tk}`; if (seen.has(k)) return false; seen.add(k);
  rows.push([ck, clean(compBrand) || "?", clean(compPart), clean(tgtBrand) || "?", clean(tgtPart), clean(source), rel === "e" ? "e" : "f"]);
  (stats[file] = stats[file] || { added: 0, samples: [] });
  stats[file].added++;
  if (stats[file].samples.length < 2) stats[file].samples.push(`${clean(compPart)} (${clean(compBrand)}) -> ${clean(tgtPart)}`);
  return true;
}
const sheet = (path, name) => { const wb = XLSX.readFile(path, { raw: false }); const ws = wb.Sheets[name] || wb.Sheets[wb.SheetNames[0]]; return { wb, a: XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false }) }; };

// ── generic emitters ──
// pairwise matrix: partCols=[{brand,col}], cross every pair on each data row (equivalent cameras/tools)
function matrix(file, path, sheetName, hdrRow, partCols, source, rel) {
  const { a } = sheet(path, sheetName);
  for (let i = hdrRow + 1; i < a.length; i++) {
    const r = a[i]; const vals = partCols.map((p) => ({ brand: p.brand, part: r[p.col] })).filter((x) => !junk(x.part));
    for (let x = 0; x < vals.length; x++) for (let y = 0; y < vals.length; y++) if (x !== y) add(file, vals[x].brand, vals[x].part, vals[y].brand, vals[y].part, source, rel);
  }
}
// wide: one key column -> many brand columns (competitor=brandcol -> target=key)
function wide(file, path, sheetName, hdrRow, keyCol, keyBrand, keyBrandCol, brandCols, source, rel) {
  const { a } = sheet(path, sheetName);
  const hdr = a[hdrRow].map(clean);
  const ki = typeof keyCol === "number" ? keyCol : hdr.findIndex((h) => h.toLowerCase() === String(keyCol).toLowerCase());
  const kbi = keyBrandCol ? hdr.findIndex((h) => h.toLowerCase() === String(keyBrandCol).toLowerCase()) : -1;
  const bcols = brandCols.map((b) => ({ brand: b.brand || b, i: typeof b.col === "number" ? b.col : hdr.findIndex((h) => h.toLowerCase() === String(b.col || b).toLowerCase()) })).filter((x) => x.i >= 0);
  for (let i = hdrRow + 1; i < a.length; i++) {
    const r = a[i]; const key = r[ki]; if (junk(key)) continue;
    const kb = kbi >= 0 ? (clean(r[kbi]) || keyBrand) : keyBrand;
    for (const { brand, i: bi } of bcols) add(file, brand, r[bi], kb, key, source, rel);
  }
}

// ===== MERGED CAMERA / TOOL MATRICES =====
// INTERNAL camera: Axis(0) Bosch(5) Hanwha(?) Pelco(?) — locate part cols from row1 headers
(() => {
  const file = "INTERNAL Security Camera";
  const { a } = sheet("inbox/all/INTERNAL ONLY--Security Camera Cross Reference Guide.xlsx", "Security camera conversions");
  const r0 = (a[0] || []).map(clean), r1 = (a[1] || []).map(clean);
  const cols = [];
  for (let c = 0; c < r1.length; c++) {
    const h = r1[c].toLowerCase();
    const isPart = /vendor #|bosch #|hanwha #|pelco #|axis #|part/.test(h) && !/wesco|anixter|axe/.test(h);
    if (isPart) cols.push({ brand: r0[c] || (r0.slice(0, c).reverse().find(Boolean)) || "Camera", col: c });
  }
  if (cols.length >= 2) matrix(file, "inbox/all/INTERNAL ONLY--Security Camera Cross Reference Guide.xlsx", "Security camera conversions", 1, cols, "INTERNAL Camera Cross Guide", "f");
  else stats[file] = { added: 0, samples: ["(no part cols detected)"] };
})();

// SMB Camera Crossover: sheets Hik, Dahua — hdr row3: Hikvision(1) Northern(4) Hanwha(7) Speco(10)
for (const sn of ["Hik", "Dahua "]) {
  matrix("SMB Camera Crossover", "inbox/all/SMB Camera Crossover List Northern.xlsx", sn, 3,
    [{ brand: "Hikvision", col: 1 }, { brand: "Northern", col: 4 }, { brand: "Hanwha", col: 7 }, { brand: "Speco", col: 10 }], "SMB Camera Crossover", "f");
}
// SMB Video Comparison Matrix: DW(1) Geovision(4) Hanwha(7) Hik(10)
matrix("SMB Video Comparison", "inbox/all/SMB VideoComparisonList11.4.2021 (002) (2).xlsx", "Comparison Matrix", 0,
  [{ brand: "Digital Watchdog", col: 1 }, { brand: "Geovision", col: 4 }, { brand: "Hanwha", col: 7 }, { brand: "Hikvision", col: 10 }], "SMB Video Comparison", "f");
// Northern->Hik-Dahua-Hanwha: hdr row5: Northern(1) Hikvision(4) Dahua(5) Hanwha(6)
matrix("Northern Hik-Dahua-Hanwha", "inbox/all/Northern to Hik-Dahua-Hanwha cross reference sheet.xlsx", "Sheet1", 5,
  [{ brand: "Northern", col: 1 }, { brand: "Hikvision", col: 4 }, { brand: "Dahua", col: 5 }, { brand: "Hanwha", col: 6 }], "Northern Camera Cross", "f");
// Hanwha vs Axis (.xlsb) Axis sheet: Axis(0) Hanwha(5)
matrix("Hanwha-Axis", "inbox/all/Hanwha _Axis Competitive Cross Reference May2022.xlsb", "Axis", 0,
  [{ brand: "Axis", col: 0 }, { brand: "Hanwha", col: 5 }], "Hanwha/Axis Competitive Cross", "f");
// Bosch <-> Hilti power tools: Bosch Model(0) Hilti Model(2); data row3+
(() => {
  const { a } = sheet("inbox/all/Bosch- Hilti Cross-Reference 2021.xlsx", "Bosch Power Tools");
  for (let i = 2; i < a.length; i++) { const r = a[i]; if (junk(r[0]) || junk(r[2])) continue; add("Bosch-Hilti", "Hilti", r[2], "Bosch", r[0], "Bosch/Hilti Cross 2021", "f"); }
})();

// ===== OWNED-BRAND / GREENLEE PER-SHEET =====
// OB Offering: per category sheet, NB MFR CATALOG NUMBER(10) [brand col9] -> OB Part Number(1)
(() => {
  const wb = XLSX.readFile("inbox/all/OB Offering with Cross to NB - 08.8.23 v13.xlsx", { raw: false });
  for (const sn of wb.SheetNames) {
    if (/summary/i.test(sn)) continue;
    const a = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: "", raw: false });
    if (a.length < 3) continue;
    const r1 = (a[1] || []).map(clean);
    const obP = r1.findIndex((h) => /part number/i.test(h));
    const nbCat = r1.findIndex((h) => /mfr catalog/i.test(h));
    const nbName = r1.findIndex((h) => /mfr name/i.test(h));
    if (obP < 0 || nbCat < 0) continue;
    for (let i = 2; i < a.length; i++) { const r = a[i]; add("OB Offering", nbName >= 0 ? clean(r[nbName]) || "National Brand" : "National Brand", r[nbCat], "Owned Brand", r[obP], "OB Offering Cross 2023-08-08", "f"); }
  }
})();
// Greenlee: per sheet, competitor(3) [brand=sheet] -> Greenlee CAT #(2)
(() => {
  const wb = XLSX.readFile("inbox/all/Greenlee Manufacture Cross Reference.xlsx", { raw: false });
  for (const sn of wb.SheetNames) {
    if (/^sheet\d*$/i.test(sn)) continue;
    const a = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: "", raw: false });
    if (a.length < 3) continue;
    const r1 = (a[1] || []).map(clean);
    const gcat = r1.findIndex((h) => /cat ?#/i.test(h));
    if (gcat < 0) continue;
    for (let c = gcat + 1; c < r1.length; c++) {
      if (!r1[c]) continue; const compBrand = r1[c].replace(/cat.*$|#.*$|item.*$/i, "").trim() || sn;
      for (let i = 2; i < a.length; i++) { const r = a[i]; add("Greenlee", compBrand, r[c], "Greenlee", r[gcat], "Greenlee Mfr Cross", "f"); }
    }
  }
})();

// ===== NEW-ZIP WIDE USAGE FILES =====
const TOOLB = [{ brand: "DeWalt", col: "DEWALT Item" }, { brand: "Irwin", col: "IRWIN ITEM" }, { brand: "Lenox", col: "LENOX ITEM" }, { brand: "Stanley", col: "Stanley item" }, { brand: "Proto", col: "PROTO item" }];
wide("SnapOn x-ref", "inbox/last/SnapOn 2020FY x reference final.xlsx", "Data 2020FY", 0, "item", "", "Mfr_Name", TOOLB, "SnapOn Tools X-ref 2020FY", "f");
wide("WESCO-Hilti x-ref", "inbox/last/WESCO - Hilti Items 9-2020 thru 9-2021 10.22 x ref final.xlsx", "WESCO Raw DATA", 0, "item", "Hilti", "Mfr_Name", TOOLB, "WESCO/Hilti Tools X-ref", "f");
// Stocked DS to NB: key="Item Number"(owned/DS) <- every "<Brand> Item #" col (exclude CSP / Item Number / Manufacturers)
(() => {
  const { a } = sheet("inbox/last/Stocked DS to NB Cross File.xlsx", "Cross Reference from Eli");
  const hdr = (a[0] || []).map(clean);
  const ki = hdr.findIndex((h) => /^item number$/i.test(h));
  if (ki < 0) return;
  const bcols = [];
  for (let c = 0; c < hdr.length; c++) {
    const h = hdr[c];
    if (/item ?#/i.test(h) && !/csp|^item number$|manufacturers item/i.test(h)) bcols.push({ brand: h.replace(/item ?#.*$/i, "").trim() || "Brand", col: c });
  }
  for (let i = 1; i < a.length; i++) { const r = a[i]; const ds = r[ki]; if (junk(ds)) continue; for (const { brand, col } of bcols) add("Stocked DS to NB", brand, r[col], "Wesco DS (owned)", ds, "Stocked DS->NB Cross", "f"); }
})();

// ── report / write ──
const files = Object.keys(stats).sort();
for (const f of files) { console.log(`${f.padEnd(28)} +${String(stats[f].added).padStart(6)}`); for (const s of stats[f].samples) console.log(`      e.g. ${s}`); }
console.log(`\nAdded ${rows.length - start} new pairs -> master ${rows.length}.`);
if (WRITE) { fs.writeFileSync(master, rows.map((r) => r.join(TAB)).join("\n") + "\n"); console.log("WROTE master."); }
else console.log("(dry — pass 'write' to commit to master)");
