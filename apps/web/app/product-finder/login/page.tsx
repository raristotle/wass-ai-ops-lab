"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useProductFinder } from "@/lib/product-finder-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getBrand } from "@/lib/brand";
import { demoSsoUser } from "@/lib/auth/sso";
import { cn } from "@/lib/utils";

const DEMO_USERS = [
  { email: "sales@meridiansupply.com", name: "Sarah Chen", role: "Sales Rep", branch: "Houston Downtown" },
  { email: "manager@meridiansupply.com", name: "Marcus Rivera", role: "Manager", branch: "Dallas North" },
  { email: "admin@meridiansupply.com", name: "Admin User", role: "Admin", branch: "Corporate" },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useProductFinder((s) => s.login);
  const authError = useProductFinder((s) => s.authError);
  const brand = getBrand(useProductFinder((s) => s.brandId));
  const setBrandId = useProductFinder((s) => s.setBrandId);
  const loginWithSso = useProductFinder((s) => s.loginWithSso);

  // The login route is outside AuthGuard (which hydrates saved state), so pull
  // the persisted white-label brand directly after mount.
  useEffect(() => {
    const saved = localStorage.getItem("pf_brand");
    if (saved) setBrandId(saved);
  }, [setBrandId]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SSO seam: ask the server whether a real IdP is configured.
  const [sso, setSso] = useState<{ enabled: boolean; providerName: string } | null>(null);
  const [ssoBusy, setSsoBusy] = useState(false);
  useEffect(() => {
    fetch("/api/auth/sso/config")
      .then((r) => r.json())
      .then(setSso)
      .catch(() => setSso({ enabled: false, providerName: "SSO" }));
  }, []);

  function handleSso() {
    if (sso?.enabled) {
      window.location.href = "/api/auth/sso/start";
      return;
    }
    // Demo SSO: simulate the IdP round-trip, then establish the mapped session.
    setSsoBusy(true);
    setTimeout(() => {
      loginWithSso(demoSsoUser());
      router.push("/product-finder");
    }, 900);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const success = login(email, password);
    if (success) {
      router.push("/product-finder");
    } else {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFB] [font-family:var(--font-source-sans,Arial,sans-serif)]">
      {/* Header */}
      <header className="w-full bg-[#1D252D] px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <span
            className="inline-flex h-9 min-w-20 items-center justify-center rounded px-2 text-sm font-bold tracking-widest text-white [font-family:var(--font-titillium,'Arial Bold',sans-serif)]"
            style={{ backgroundColor: brand.accent }}
          >
            {brand.logoMark}
          </span>
          <span className="text-base font-medium text-[#B7C9D3]">
            AI Product Recommender
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4 pt-8 text-center">
              <CardTitle className="text-2xl font-bold text-[#1D252D] [font-family:var(--font-titillium,'Arial Bold',sans-serif)]">
                Sign In to Product Finder
              </CardTitle>
            </CardHeader>

            <CardContent className="pb-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-[#1D252D]"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@meridiansupply.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="h-10"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-[#1D252D]"
                  >
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-10"
                  />
                </div>

                {/* Error message */}
                {authError && (
                  <p
                    className="rounded-md bg-[#FEF2F2] px-3 py-2 text-sm font-medium text-red-700"
                    role="alert"
                  >
                    {authError}
                  </p>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "mt-2 h-10 w-full bg-[#00AA13] text-sm font-semibold text-white transition-opacity hover:bg-[#009911]",
                    isSubmitting && "opacity-70"
                  )}
                >
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              {/* Enterprise SSO */}
              <div className="mt-5">
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-[#B7C9D3]" />
                  <span className="text-xs text-[#4F758B]">or</span>
                  <span className="h-px flex-1 bg-[#B7C9D3]" />
                </div>
                <button
                  type="button"
                  onClick={handleSso}
                  disabled={ssoBusy}
                  className={cn(
                    "mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#4F758B] text-sm font-semibold text-[#1D252D]",
                    "transition-colors hover:border-[#1D252D] hover:bg-[#1D252D]/5",
                    ssoBusy && "opacity-60"
                  )}
                >
                  <span aria-hidden="true">🔒</span>
                  {ssoBusy ? "Authenticating…" : `Sign in with ${sso?.providerName ?? "SSO"}`}
                </button>
                <p className="mt-1.5 text-center text-[10px] text-[#4F758B]">
                  {sso?.enabled
                    ? "Enterprise single sign-on"
                    : "SSO ready — demo mode. Configure SSO_* to connect your IdP."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Demo credentials info box */}
          <div className="mt-6 rounded-lg border border-[#B7C9D3] bg-[#EEF4F7] px-5 py-4 text-sm text-[#1D252D]">
            <p className="mb-3 font-semibold text-[#4F758B]">
              Demo credentials — password for all:{" "}
              <span className="font-bold text-[#1D252D]">meridian2024</span>
            </p>
            <ul className="flex flex-col gap-2">
              {DEMO_USERS.map((u) => (
                <li key={u.email} className="flex flex-col gap-0.5">
                  <span className="font-medium">{u.email}</span>
                  <span className="text-xs text-[#4F758B]">
                    {u.name} · {u.role} · {u.branch}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
