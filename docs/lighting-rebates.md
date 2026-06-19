# Lighting utility-rebate estimator — v4-S2 #6

Surface an **estimated utility rebate** on LED lighting products — often the
number that closes a retrofit. Pure, deterministic, **$0** (no external call, no
key), in `lib/product-finder-rebates.ts`, shown as a panel in the product detail
modal (`RebatePanel`).

## Why an estimate, not a live lookup

There is **no free, national, programmatic feed of rebate _dollar_ amounts**:

- **DLC QPL** (DesignLights Consortium) and **ENERGY STAR** tell you a product is
  rebate-**eligible** (and give watts/lumens/efficacy), but not the dollars. DLC's
  bulk/API access is a paid membership; ENERGY STAR data is free but only confirms
  certification.
- **DSIRE** is the closest national index of incentive programs, and its API is a
  paid subscription — and it indexes programs, not per-SKU dollars.
- Actual rebate dollars live in each **utility's prescriptive worksheet**.

So the honest $0 design is a **deterministic estimator**: it maps
(fixture category, controls) → an estimated per-fixture range, grounded in real
2025-2026 program structures, and always presents it as an estimate the local
utility confirms. DLC listing is shown as the eligibility gate.

## The estimator

`REBATE_REGISTRY` keys by lighting subcategory with bands drawn from cited
programs (PG&E, Xcel, Energize CT, BriteSwitch trend data):

| Category | Per-unit band | Controls × | Unit |
|---|---|---|---|
| LED Troffers & Panels | $25–$50 | 2.5 | fixture |
| High Bay Fixtures | $75–$150 | 2.0 | fixture |
| Strip & Wrap Fixtures | $15–$40 | 2.0 | fixture |
| LED Downlights | $8–$30 | 2.0 | fixture |
| Lamps & Tubes (TLED) | $2–$10 | 1.0 | lamp |
| Outdoor & Area Lighting | $25–$100 | 1.5 | fixture |

- `estimateRebate(product)` → range + controls-uplift band + DLC eligibility, or
  `null` for non-lighting categories.
- Controls are auto-detected from the product's specs (motion / occupancy /
  photocell / daylight / 0-10V dimming) and apply the higher incentive band.
- `rebateForQuantity(estimate, qty, withControls)` scales to the line quantity.
- Every estimate carries `REBATE_DISCLAIMER` and a `REBATE_TABLE_REVIEWED` date —
  re-check the bands yearly (they've moved ~3%/yr for five years).

## Activation path (optional, future)

The shippable value is the $0 static estimator. Two **dormant** accuracy boosters
are documented for later, both env-gated so the default makes zero external calls:

- **ENERGY STAR** Socrata lookup (free, no key) to confirm certification and
  auto-fill watts/lumens — read live column metadata at integration time; don't
  hard-code Socrata field names; never display the ENERGY STAR badge (the mark is
  trademarked, only the data is open).
- **DLC QPL** snapshot import (free manual CSV behind a MyDLC account) or the paid
  DLC API for real eligibility data per SKU.

No 3rd-party action is required to use the feature as shipped.
