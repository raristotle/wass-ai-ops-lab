# Tamper-evident audit log — v4-S2 #5

A hash-**chained**, HMAC-**keyed** activity log for SOC2/compliance readiness.
Records key business events (signatures, orders, deposits, quote decisions) so an
auditor can prove the trail wasn't altered. Pure core in
`lib/product-finder-audit.ts`; durable, tenant-scoped storage via the persistence
seam. **$0, always on.**

## Why HMAC, not plain SHA-256

Plain SHA-256 chaining lets *anyone who can read the stored log* recompute a
consistent chain after editing it — so it isn't tamper-**evident** against a
reader. Here each entry's hash is `HMAC-SHA256(secret, canonical(entry))`, where
the secret is server-only. Without the key, a tamperer can't produce a valid
hash, so `verifyAuditChain` detects insertion, deletion, reordering, or any field
edit and reports the first broken sequence number.

## Model

Each `AuditEntry`: `{ seq, at, actor, action, target, detail, prevHash, hash }`.

- `seq` is contiguous from 0; `prevHash` links to the prior entry's `hash`.
- `appendAuditEntry(chain, input, secret)` returns a new chain (input unmutated).
- `verifyAuditChain(chain, secret)` → `{ valid, brokenAt, length }`.
- `auditCsvRows` / `AUDIT_CSV_HEADER` build the compliance CSV (each row carries
  its hash and the prior hash so the chain is reconstructable offline).

`node:crypto` is server-only; client code imports **types only**, so this module
never enters a browser bundle.

## Storage & API

- One chain per tenant in the durable `audit` namespace
  (`forTenant(getStore(), tenantId)`), appended via the CAS `mutate` helper so
  concurrent writes can't fork the chain. In-memory when `POSTGRES_URL` is unset,
  durable (Neon) when set.
- **`POST /api/audit`** — append `{ actor, action, target, detail }`
  (auth-gated, rate-limited, tenant-scoped).
- **`GET /api/audit`** — `{ entries, verification, signed, total }` (recent
  entries for display + whole-chain verification).
- **`GET /api/audit?verify=1`** — verification only.
- **`GET /api/audit?format=csv`** — the full chain as a CSV download.
- Server-observed events append automatically — e.g. the e-sign webhook writes
  `esign.signed` / `esign.declined` (`lib/server/audit-log.ts → recordAuditEventSafe`).

## UI

`AuditLogCard` on the manager dashboard shows the recent entries, a live
**✓ Chain verified / ✗ Broken @ #n** badge, and a one-click CSV export. Hidden
when the chain is empty.

## Production signing key

The HMAC key is `AUDIT_SECRET`, falling back to `SESSION_SECRET`, then a dev
constant. For production tamper-evidence set **`AUDIT_SECRET`** (or rely on the
SSO `SESSION_SECRET`) — with the dev constant the chain still catches accidental
edits but not an adversary who knows the constant. The card surfaces which mode
is active ("HMAC-signed (production key)" vs "dev signing key").

No 3rd-party account is required.
