/**
 * Multi-network PunchOut registration (#15). The app already speaks cXML PunchOut
 * Level-2; this is the supplier-side network registry so large buyers can punch
 * out from SAP Business Network (Ariba) and Coupa into Meridian. Both offer FREE
 * supplier accounts, so this is $0 — the remaining work is endpoint/credential
 * config + buyer-side certification (see docs/punchout-networks.md). Pure data.
 */

export interface PunchOutNetwork {
  id: "sap-business-network" | "coupa";
  label: string;
  /** Supplier PunchOut endpoint the buyer points their SetupRequest at. */
  endpoint: string;
  /** The cXML Credential @domain a buyer uses to identify this network. */
  credentialDomain: string;
  freeSupplierAccount: boolean;
  notes: string;
}

export const PUNCHOUT_NETWORKS: readonly PunchOutNetwork[] = [
  {
    id: "sap-business-network",
    label: "SAP Business Network (Ariba)",
    endpoint: "/api/punchout",
    credentialDomain: "NetworkID",
    freeSupplierAccount: true,
    notes: "Free Standard Account (unlimited PO/invoice exchange). Register Meridian's PunchOut URL + shared secret in the buyer's trading relationship.",
  },
  {
    id: "coupa",
    label: "Coupa",
    endpoint: "/api/punchout",
    credentialDomain: "DUNS",
    freeSupplierAccount: true,
    notes: "Coupa Supplier Portal (CSP) — no supplier fee for basic PunchOut. Configure the cXML PunchOut form + shared secret in the buyer's catalog setup.",
  },
];

/** Resolve a network from a buyer cXML Credential @domain (case-insensitive). */
export function networkForDomain(domain: string): PunchOutNetwork | null {
  const d = domain.trim().toLowerCase();
  return PUNCHOUT_NETWORKS.find((n) => n.credentialDomain.toLowerCase() === d) ?? null;
}
