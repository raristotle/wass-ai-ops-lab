/* G6: build the cross-reference analysis spreadsheet (counts by category / sub-category / manufacturer
   / source) + a full CSV of every cross. Outputs to the user's Downloads. Run: node gen-analysis-xlsx.cjs */
const XLSX = require("xlsx");
const fs = require("fs");
const TAB = String.fromCharCode(9);
const OUT_XLSX = "C:/Users/raris/Downloads/Meridian-Cross-Reference-Analysis.xlsx";
const OUT_CSV = "C:/Users/raris/Downloads/Meridian-All-Crosses.csv";

// Map a source file to a high-level product category. Order matters (specific first).
function category(src) {
  const s = src.toLowerCase();
  if (/camera|hik|hanwha|dahua|speco|invid|pelco|axis|surveillance|video|inaxsys/.test(s)) return "Security & Surveillance";
  if (/eaton|danfoss/.test(s)) return "Power & Hydraulic";
  if (/panduit/.test(s)) return "Wire Management & Network";
  if (/conduitfitting|conduit|fitting|atkore|cantex/.test(s)) return "Conduit & Fittings";
  if (/wiremanagement/.test(s)) return "Wire Management & Network";
  if (/cable[_ ]?tie/.test(s)) return "Cable Ties";
  if (/enclosure|hoffman|hammond/.test(s)) return "Enclosures";
  if (/electricalhardware|strut|hardware/.test(s)) return "Electrical Hardware & Strut";
  if (/fuse|ferraz|mersen|bussmann/.test(s)) return "Fuses & Circuit Protection";
  if (/lighting|lamp|ballast/.test(s)) return "Lighting";
  if (/safety|stocked ds/.test(s)) return "Safety & PPE";
  if (/snapon|hilti|wright|proto|bosch|dewalt|greenlee|ridgid|tools_comparable|tool/.test(s)) return "Tools";
  if (/batter/.test(s)) return "Batteries";
  if (/tape|adhesive/.test(s)) return "Tapes & Adhesives";
  if (/thomas|t&b|new_tnb|wiring device|hubbell|leviton|abb empower/.test(s)) return "Wiring Devices & Connectors";
  if (/measure|fluke|flir|extech/.test(s)) return "Test & Measurement";
  if (/micrel|semiconductor|allegro/.test(s)) return "Semiconductors & Electronic Components";
  if (/\brfi\b|rf industries|rf coax|coax|commscope/.test(s)) return "RF & Coax Connectors";
  if (/hexseal|switch boot|toggle|boot/.test(s)) return "Switch Boots & Seals";
  if (/\bcit\b|cutler/.test(s)) return "Switches & Relays";
  if (/diversitech/.test(s)) return "HVAC & Controls";
  if (/belden|quabbin|alpha|carol|lake cable/.test(s)) return "Wire & Cable";
  if (/uline|box partner/.test(s)) return "Packaging & Industrial MRO";
  if (/audiblevisual/.test(s)) return "Audible & Visual Signaling";
  if (/industrialequipment/.test(s)) return "Industrial Equipment";
  if (/southwire|liberty|northern|corning|master cable|datacenter|wire|cable/.test(s)) return "Wire & Cable";
  if (/3m/.test(s)) return "Tapes, Abrasives & Connectors (3M)";
  if (/owned brand|crosscheck|rep crossref/.test(s)) return "Mixed / Multi-Category";
  return "Other";
}
const subFor = (src) => src.replace(/_comparables$/i, "").replace(/[_]/g, " ").replace(/ \d{4}-\d{2}-\d{2}.*$/, "").trim();
const rel = (r) => (r === "e" ? "Equivalent" : "Functional substitute");

const lines = fs.readFileSync("inbox/xref-master.tsv", "utf8").split("\n").filter(Boolean);
const byCat = new Map(), bySub = new Map(), byTgt = new Map(), byComp = new Map(), bySrc = new Map();
const inc = (m, k, n = 1) => m.set(k, (m.get(k) || 0) + n);

// stream the full CSV while aggregating
const csv = ["Category,Sub-Category,Competitor Brand,Competitor Part,Target Manufacturer,Target Part,Relation,Source"];
const esc = (s) => { s = String(s == null ? "" : s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
for (const line of lines) {
  const f = line.split(TAB); if (f.length < 7) continue;
  const cat = category(f[5]);
  inc(byCat, cat); inc(bySub, `${cat}|${subFor(f[5])}`); inc(byTgt, f[3]); inc(byComp, f[1]); inc(bySrc, f[5]);
  csv.push([esc(cat), esc(subFor(f[5])), esc(f[1]), esc(f[2]), esc(f[3]), esc(f[4]), rel(f[6]), esc(f[5])].join(","));
}
fs.writeFileSync(OUT_CSV, csv.join("\n") + "\n");

// ── build the workbook ──
const wb = XLSX.utils.book_new();
const total = lines.length;
const aoa = (header, rows) => XLSX.utils.aoa_to_sheet([header, ...rows]);
const sortDesc = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]);

// Overview
XLSX.utils.book_append_sheet(wb, aoa(["Meridian Cross-Reference Analysis", ""], [
  ["Generated", "2026-06-25"],
  ["Total documented cross-reference pairs", total],
  ["Distinct categories", byCat.size],
  ["Distinct sub-categories", bySub.size],
  ["Distinct target manufacturers", byTgt.size],
  ["Distinct competitor brands", byComp.size],
  ["Source files", bySrc.size],
  ["", ""],
  ["Note", "Each row in 'Meridian-All-Crosses.csv' is one documented competitor->target pair."],
  ["Honesty", "Pairs explicitly marked not-substitutable were removed; no parts invented."],
]), "Overview");
// By Category
XLSX.utils.book_append_sheet(wb, aoa(["Category", "Cross count", "% of total"],
  sortDesc(byCat).map(([k, v]) => [k, v, (100 * v / total).toFixed(2) + "%"])), "By Category");
// By Sub-Category
XLSX.utils.book_append_sheet(wb, aoa(["Category", "Sub-Category (source domain)", "Cross count"],
  sortDesc(bySub).map(([k, v]) => { const [c, s] = k.split("|"); return [c, s, v]; })), "By Sub-Category");
// By Target Manufacturer
XLSX.utils.book_append_sheet(wb, aoa(["Target Manufacturer", "Cross count"],
  sortDesc(byTgt).map(([k, v]) => [k, v])), "By Target Manufacturer");
// By Competitor Brand
XLSX.utils.book_append_sheet(wb, aoa(["Competitor / Legacy Brand", "Cross count"],
  sortDesc(byComp).map(([k, v]) => [k, v])), "By Competitor Brand");
// By Source
XLSX.utils.book_append_sheet(wb, aoa(["Source File", "Category", "Cross count"],
  sortDesc(bySrc).map(([k, v]) => [k, category(k), v])), "By Source File");

XLSX.writeFile(wb, OUT_XLSX);
console.log(`Wrote ${OUT_XLSX}`);
console.log(`Wrote ${OUT_CSV} (${total} rows)`);
console.log(`Categories: ${byCat.size}, sub-categories: ${bySub.size}, target mfrs: ${byTgt.size}`);
console.log("Top categories:", sortDesc(byCat).slice(0, 8).map(([k, v]) => `${k}=${v}`).join(", "));
