import { NextResponse } from "next/server";
import { readSsoConfig } from "@/lib/auth/sso";

export const dynamic = "force-dynamic";

/**
 * Tells the login screen whether a real IdP is configured and what to label the
 * button. No secrets leave the server — only `enabled` + the provider name.
 */
export function GET() {
  const cfg = readSsoConfig();
  return NextResponse.json({ enabled: cfg.enabled, providerName: cfg.providerName });
}
