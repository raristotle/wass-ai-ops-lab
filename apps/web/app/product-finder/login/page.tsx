"use client";

import { useState, type FormEvent } from "react";
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
import { cn } from "@/lib/utils";

const DEMO_USERS = [
  { email: "sales@wesco.com", name: "Sarah Chen", role: "Sales Rep", branch: "Houston Downtown" },
  { email: "manager@wesco.com", name: "Marcus Rivera", role: "Manager", branch: "Dallas North" },
  { email: "admin@wesco.com", name: "Admin User", role: "Admin", branch: "Corporate" },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useProductFinder((s) => s.login);
  const authError = useProductFinder((s) => s.authError);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          <span className="inline-flex h-9 w-20 items-center justify-center rounded bg-[#00AA13] px-2 text-sm font-bold tracking-widest text-white [font-family:var(--font-titillium,'Arial Bold',sans-serif)]">
            WESCO
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
                    placeholder="you@wesco.com"
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
            </CardContent>
          </Card>

          {/* Demo credentials info box */}
          <div className="mt-6 rounded-lg border border-[#B7C9D3] bg-[#EEF4F7] px-5 py-4 text-sm text-[#1D252D]">
            <p className="mb-3 font-semibold text-[#4F758B]">
              Demo credentials — password for all:{" "}
              <span className="font-bold text-[#1D252D]">wesco2024</span>
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
