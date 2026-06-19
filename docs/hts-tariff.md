# Per-subcategory HTS + landed-duty model (DI-7)

The real-data replacement for the chapter-level tariff approximation behind the
landed-cost overlay (v3-S3 #14). Every catalog subcategory now maps to a **real,
web-verified HTS subheading** with its **actual** MFN duty and a **per-subcategory**
Section 301 rate — so the landed cost a rep sees reflects what the importer of record
actually pays, not a flat 25% on everything.

- Data: [data/real/hts-codes.ts](../data/real/hts-codes.ts) — one representative
  verified subheading per subcategory (80 entries).
- Model: [hts-tariff.ts](../lib/catalog/hts-tariff.ts) — `htsEntryForSubcategory`,
  `landedTariffForLine`. Pure, deterministic, $0.
- Wired into: [compliance.ts](../lib/catalog/compliance.ts) (the displayed HTS code is
  now the real per-subcategory code) and `/api/bom/analyze` → the BOM Intelligence
  modal (real HTS + layered duty per line).

## What it computes

A landed duty that stacks the three layers a US importer actually pays:

| Layer | Applies to | Source |
|---|---|---|
| **MFN** (General / Column 1) | any non-US origin | USITC HTS, 2026 revision |
| **Section 301** | China origin only, **per-subcategory** | USTR Lists 1–4A / HTS Chapter 99 (9903.88) |
| **Section 232** | steel articles (cable tray, strut, steel conduit, racks) | steel-tariff actions |

The headline improvement over the old flat-chapter model is the **per-subcategory
Section 301 rate**. For example:

| Subcategory | HTS | MFN | Section 301 (China) |
|---|---|---|---|
| Circuit Breakers | 8536.20.00 | 2.7% | **25%** (List 3) |
| Network Switches | 8517.62.00 | Free | **7.5%** (List 4A) |
| Displays (ADP monitors) | 8528.52.00 | Free | **7.5%** (List 4A) |
| Occupancy Sensors | 9031.80.80 | Free | **7.5%** (List 4A) |
| Cable Tray (steel) | 7308.90.95 | Free | 25% **+ 25% Section 232** |
| Racks & Cabinets (steel) | 9403.20.00 | Free | 25% (List 3) **+ 232** |

The old model charged a flat 25% on all of chapter 84/85 — overstating datacom/AV
duty by 3× and missing the steel 232 surcharge entirely. The new model gets each right.

## How it was sourced

A 13-agent research workflow web-verified each electrical product family against the
**official USITC HTS** (hts.usitc.gov / reststop API, 2026 revision) and the **USTR
Section 301** Chapter 99 mapping. Each entry carries a `confidence` level; the notes
field records the alternative codes (a subcategory can span several real codes by
material/voltage/construction) and any provisional assignment.

## Honest caveats (documented in the data file)

This is the **HTS General duty + Section 301 (+ steel 232)** layer only. It does **not**
model:

- **FTA preferences** — USMCA / Korea origin is often Free; the model applies MFN to
  all non-US origins (conservative).
- **Section 301 product exclusions** — some codes have active exclusions.
- **Compound specific duties** — clock-based timers (HTS 9107) carry per-unit + per-jewel
  specific duties; only the ad-valorem component is modeled (noted on that entry).
- **IEEPA / reciprocal overlays** — out of scope; verify separately at entry time.
- A couple of **provisional** 301 assignments (LED lamps 8539.52, timers 9107) are
  flagged in the data and should be broker-confirmed.

Everything is **advisory** — a customs broker confirms a binding classification, and the
HTS revises ~3×/year, so re-verify a specific rate before relying on it. Real
(verified/curated) catalog parts still get **no** fabricated compliance/HTS at all
(`complianceForProduct` returns null for them), exactly as before.

## Tests

[hts-tariff.test.ts](../lib/catalog/hts-tariff.test.ts) — table well-formedness, the
10-digit code formatter, MFN+301 stacking, the per-subcategory 301 rate (datacom 7.5%
≠ flat 25%), steel 232 stacking, US-origin = $0, and the unmapped-subcategory fallback.
The existing `tariff.test.ts` (legacy chapter model) and `compliance.test.ts` stay green —
the new model is an additive path used when a subcategory is known.
