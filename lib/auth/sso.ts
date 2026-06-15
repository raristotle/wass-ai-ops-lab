import type { AuthUser } from "@/features/product-finder/types";

/**
 * Enterprise SSO seam.
 *
 * The recommender's demo session is client-side (localStorage). This module is
 * the swap-in point for real single sign-on: when an OIDC identity provider is
 * configured (SSO_* env vars — Azure AD, Okta, Ping, …) the login screen offers
 * "Sign in with <provider>", redirects to the IdP's authorize endpoint, and maps
 * the returned identity claims to an app user/role. Until an IdP is configured,
 * a clearly-labeled DEMO SSO sign-in simulates the round-trip so the flow is
 * demonstrable without a tenant. Password login is always available.
 *
 * Pure + isomorphic — config detection, authorize-URL construction, and
 * claims→user mapping are all unit-testable without a network or a real IdP.
 */

export interface SsoConfig {
  /** A real IdP is configured (issuer + client id + authorize endpoint present). */
  enabled: boolean;
  /** Display name for the button, e.g. "Azure AD" / "Okta". */
  providerName: string;
  issuer?: string;
  clientId?: string;
  authorizeUrl?: string;
  redirectUri?: string;
  /** Token endpoint (authorization-code exchange) + JWKS (id_token verification). */
  tokenUrl?: string;
  jwksUrl?: string;
  clientSecret?: string;
  scope: string;
}

const DEFAULT_SCOPE = "openid email profile";

export function readSsoConfig(env: Record<string, string | undefined> = process.env): SsoConfig {
  const issuer = env.SSO_ISSUER?.trim();
  const clientId = env.SSO_CLIENT_ID?.trim();
  const authorizeUrl = env.SSO_AUTHORIZE_URL?.trim();
  const redirectUri = env.SSO_REDIRECT_URI?.trim();
  const enabled = Boolean(issuer && clientId && authorizeUrl);
  return {
    enabled,
    providerName: env.SSO_PROVIDER_NAME?.trim() || "SSO",
    issuer,
    clientId,
    authorizeUrl,
    redirectUri,
    tokenUrl: env.SSO_TOKEN_URL?.trim(),
    jwksUrl: env.SSO_JWKS_URL?.trim(),
    clientSecret: env.SSO_CLIENT_SECRET?.trim(),
    scope: env.SSO_SCOPE?.trim() || DEFAULT_SCOPE,
  };
}

/** Build the OIDC authorization-code-flow URL to redirect the browser to. */
export function buildAuthorizeUrl(config: SsoConfig, state: string): string {
  if (!config.enabled || !config.authorizeUrl || !config.clientId) {
    throw new Error("SSO is not configured");
  }
  const u = new URL(config.authorizeUrl);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", config.clientId);
  if (config.redirectUri) u.searchParams.set("redirect_uri", config.redirectUri);
  u.searchParams.set("scope", config.scope);
  u.searchParams.set("state", state);
  return u.toString();
}

/** OIDC/SAML claims as returned by the IdP (the bits we read). */
export interface IdpClaims {
  email?: string;
  name?: string;
  /** Group / role memberships used to derive the app role. */
  groups?: string[];
  roles?: string[];
  /** Optional branch mapping claim, when the IdP carries it. */
  branch?: string;
  branchId?: string;
  /** Tenant/organization claim (Azure `tid`, Google `hd`, or a custom `tenant`). */
  tid?: string;
}

const ROLE_GROUP = {
  admin: ["admin", "administrator", "it-admin"],
  manager: ["manager", "branch-manager", "supervisor"],
} as const;

/** Derive the app role from IdP group/role claims (default: sales). */
export function roleFromClaims(claims: IdpClaims): AuthUser["role"] {
  const memberships = [...(claims.groups ?? []), ...(claims.roles ?? [])].map((g) => g.toLowerCase());
  if (memberships.some((g) => ROLE_GROUP.admin.some((m) => g.includes(m)))) return "admin";
  if (memberships.some((g) => ROLE_GROUP.manager.some((m) => g.includes(m)))) return "manager";
  return "sales";
}

/** Map IdP claims to an app user, or null when there is no usable identity. */
export function mapClaimsToUser(claims: IdpClaims): AuthUser | null {
  const email = claims.email?.trim();
  if (!email) return null;
  return {
    name: claims.name?.trim() || email.split("@")[0],
    email,
    role: roleFromClaims(claims),
    branch: claims.branch?.trim() || "Corporate",
    branchId: claims.branchId?.trim() || "B-CORP",
  };
}

/**
 * The persona signed in by the DEMO SSO flow (no IdP configured). Mapped exactly
 * as a real "manager" group membership would map — proving the role-from-claims
 * path end to end on stage.
 */
export const DEMO_SSO_CLAIMS: IdpClaims = {
  email: "j.okafor@enterprise-buyer.com",
  name: "Jordan Okafor",
  groups: ["wesco-branch-manager"],
  branch: "Enterprise SSO",
  branchId: "B-SSO",
};

export function demoSsoUser(): AuthUser {
  // mapClaimsToUser never returns null for these claims (email present).
  return mapClaimsToUser(DEMO_SSO_CLAIMS) as AuthUser;
}
