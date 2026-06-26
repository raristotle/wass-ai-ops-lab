/* G4: backfill missing manufacturer names ("?") on cross pairs using the source/column the brand is
   implied by. Only fills where the brand is unambiguous from the source; leaves genuinely-unknown as
   "?" (honest). Run: node gen-backfill-brands.cjs [write] */
const fs = require("fs");
const TAB = String.fromCharCode(9);
const WRITE = process.argv.includes("write");
// source (col 5) -> { comp, tgt } brand to use when that side is "?"
const MAP = {
  "Leviton rep crossref (Y-verified)": { comp: "Leviton" },
  "Uline-to-Box-Partners-Competitor Cross Ref": { comp: "Uline", tgt: "Box Partners" },
  "Southwire GoFwd PN cross to Industry (1)": { comp: "Southwire", tgt: "Madison" },
  "Southwire GoFwd PN cross to Industry": { comp: "Southwire", tgt: "Madison" },
  "Northern to Liberty Cross 2023": { comp: "Northern", tgt: "Liberty" },
  "Northern to Liberty Cross": { comp: "Northern", tgt: "Liberty" },
  "New_TNB_Catalog_Numbers_Sept2022 (1)": { comp: "Thomas & Betts", tgt: "Thomas & Betts" },
  "Speco Comparison Chart Hik - Dahua": { comp: "Dahua", tgt: "Speco" },
  "Wesco Cable Tie MFG Data from Web 12-5-22": { comp: "Various", tgt: "3M" },
  "Cable_Ties_Comps": { comp: "Competitor", tgt: "Wesco (comparable)" },
  "Vendor Comparison Chart - Pelco": { comp: "Dahua", tgt: "Pelco" },
  "Inaxsys-HIK CROSSOVER (002)": { comp: "Hikvision", tgt: "Inaxsys" },
};
const lines = fs.readFileSync("inbox/xref-master.tsv", "utf8").split("\n").filter(Boolean);
let fixed = 0, remain = 0;
const out = lines.map((line) => {
  const f = line.split(TAB); if (f.length < 7) return line;
  const m = MAP[f[5]];
  if (m) { if (f[1] === "?" && m.comp) { f[1] = m.comp; fixed++; } if (f[3] === "?" && m.tgt) { f[3] = m.tgt; fixed++; } }
  if (f[1] === "?" || f[3] === "?") remain++;
  return f.join(TAB);
});
console.log(`Backfilled ${fixed} brand labels; ${remain} pairs still have a ? brand (left honest).`);
if (WRITE) { fs.writeFileSync("inbox/xref-master.tsv", out.join("\n") + "\n"); console.log("WROTE master."); }
else console.log("(dry)");
