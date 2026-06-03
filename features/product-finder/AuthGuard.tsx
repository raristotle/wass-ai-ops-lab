"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProductFinder, hydrateAuth } from "@/lib/product-finder-store";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const user = useProductFinder((s) => s.user);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrateAuth();
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && user === null) {
      router.push("/product-finder/login");
    }
  }, [hydrated, user, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded bg-[#00AA13] text-sm font-bold text-white">
              W
            </span>
            <span className="text-lg font-bold tracking-wide text-[#1D252D]">
              WESCO
            </span>
          </div>
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#B7C9D3] border-t-[#00AA13]"
            role="status"
            aria-label="Loading"
          />
          <p className="text-sm text-[#4F758B]">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
