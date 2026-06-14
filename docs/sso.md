# Enterprise SSO

The Product Finder ships an SSO seam. Out of the box the login screen shows a
**demo SSO** sign-in that simulates the IdP round-trip and maps group claims to
an app role. Point it at a real identity provider (Azure AD, Okta, Ping, …) by
setting environment variables.

## Activate a real IdP

Set these on the deployment (e.g. Vercel project env):

| Variable | Example |
|---|---|
| `SSO_ISSUER` | `https://login.microsoftonline.com/<tenant>/v2.0` |
| `SSO_CLIENT_ID` | the app registration's client id |
| `SSO_AUTHORIZE_URL` | `https://login.microsoftonline.com/<tenant>/oauth2/v2.0/authorize` |
| `SSO_REDIRECT_URI` | `https://app.raristotle.com/product-finder/sso-callback` |
| `SSO_PROVIDER_NAME` | `Azure AD` (button label) |
| `SSO_SCOPE` | optional, default `openid email profile` |

With `SSO_ISSUER` + `SSO_CLIENT_ID` + `SSO_AUTHORIZE_URL` present, the login
button becomes **"Sign in with `<provider>`"** and starts the real OIDC
authorization-code flow (`/api/auth/sso/start` → IdP `authorize` with a CSRF
`state` cookie).

## Role mapping (already built + tested)

The IdP's group/role claims map to the app role in `lib/auth/sso.ts`
(`roleFromClaims` / `mapClaimsToUser`):

- a group containing `admin` / `administrator` / `it-admin` → **admin**
- a group containing `manager` / `branch-manager` / `supervisor` → **manager**
- otherwise → **sales**

`branch` / `branchId` come from claims when present (default Corporate).

## Remaining onboarding step

The token-exchange callback completes the flow against your tenant: the IdP
redirects to `SSO_REDIRECT_URI` with a `code`; exchange it at the IdP's token
endpoint, **verify the `id_token` signature against the IdP JWKS**, then call
`mapClaimsToUser(claims)` and establish the session (`loginWithSso`). This is the
one piece that needs the live tenant (token endpoint + client secret + JWKS), so
it is finished during onboarding rather than shipped with a placeholder.
