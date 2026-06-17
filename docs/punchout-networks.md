# Multi-network PunchOut (SAP Business Network / Coupa) — #15

Meridian already speaks cXML PunchOut and EDI 850 (see procurement export). This
adds a small **network registry** so the same PunchOut surface can be onboarded to
the two dominant B2B procurement networks without code changes per buyer.

## `lib/procurement/punchout-networks.ts`

Pure, dependency-free config:

```ts
PUNCHOUT_NETWORKS // PunchOutNetwork[]
networkForDomain(domain) // → PunchOutNetwork | null
```

| Network | cXML identity `domain` | Free supplier account | Endpoint |
|---|---|---|---|
| SAP Business Network (Ariba) | `NetworkID` | ✅ | `/api/punchout` |
| Coupa | `DUNS` | ✅ | `/api/punchout` |

The `domain` is the cXML `<Credential domain="…">` value each network stamps on
PunchOutSetupRequests — `networkForDomain()` lets the handler recognize which
network a buyer is coming from and echo the correct identity back.

## Why it matters

Both networks offer **free supplier accounts** — Wesco/Meridian can be punch-out
enabled for an Ariba or Coupa buyer at **$0**, and the buyer's requisition flows
straight into Meridian and back as a cart. Registration is an **external,
one-time** step (request a supplier account, share the PunchOut URL + shared
secret); this registry is the code side of that.

## Next step (external)

1. Create the free supplier accounts on SAP Business Network and Coupa.
2. Provide each network the PunchOut setup URL (`…/api/punchout`) and a shared
   secret (store as an env secret, server-only — never commit).
3. Map the buyer's `domain`/`identity` to a tenant if per-tenant catalogs are
   needed.
