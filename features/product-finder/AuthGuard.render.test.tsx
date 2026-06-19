import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthGuard } from "@/features/product-finder/AuthGuard";
import { useProductFinder } from "@/lib/product-finder-store";
import type { AuthUser } from "@/features/product-finder/types";

// AuthGuard pushes to /product-finder/login via next/navigation's useRouter when
// the user is unauthenticated after hydration; mock it so the component renders
// under jsdom and so we can assert the redirect.
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

// Toggle that lets a test suppress AuthGuard's hydration effect so the
// component stays in its initial `hydrated === false` (loading) render. We mock
// the `react` module's useEffect to register a NO-OP effect (rather than skip
// the hook) while the flag is set — skipping the hook entirely would break the
// rules of hooks and corrupt the hook count. The ESM namespace can't be
// redefined via vi.spyOn, so we route through the mock factory.
let suppressEffects = false;
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  const useEffect: typeof actual.useEffect = (cb, deps) =>
    actual.useEffect(suppressEffects ? () => {} : cb, deps);
  return { ...actual, default: actual, useEffect };
});

function user(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    name: "Pat Rep",
    email: "pat@meridian.example",
    role: "sales",
    branch: "Houston",
    branchId: "tx-hou",
    ...overrides,
  };
}

describe("AuthGuard (component)", () => {
  beforeEach(() => {
    pushMock.mockClear();
    localStorage.clear();
    // Reset to the store defaults the guard reads.
    useProductFinder.setState({ user: null, brandId: "meridian" });
  });

  afterEach(() => {
    suppressEffects = false;
    vi.restoreAllMocks();
    localStorage.clear();
    useProductFinder.setState({ user: null, brandId: "meridian" });
  });

  it("renders children once hydrated with an authenticated user (from localStorage)", async () => {
    // hydrateAuth() reads pf_user from localStorage and sets state.user.
    localStorage.setItem("pf_user", JSON.stringify(user()));

    render(
      <AuthGuard>
        <div data-testid="protected">Secret dashboard</div>
      </AuthGuard>,
    );

    // After the hydration effect runs, the guard renders its children.
    await waitFor(() => {
      expect(screen.getByTestId("protected")).toBeInTheDocument();
    });
    expect(screen.getByText("Secret dashboard")).toBeInTheDocument();
    // Authenticated path must NOT redirect.
    expect(pushMock).not.toHaveBeenCalled();
    // State was hydrated from localStorage.
    expect(useProductFinder.getState().user?.email).toBe("pat@meridian.example");
  });

  it("redirects to the login route and renders nothing when no user is present after hydration", async () => {
    // No pf_user in localStorage -> stays null after hydrateAuth().
    const { container } = render(
      <AuthGuard>
        <div data-testid="protected">Secret dashboard</div>
      </AuthGuard>,
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/product-finder/login");
    });
    // Children must not be rendered for an unauthenticated user.
    expect(screen.queryByTestId("protected")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the default Meridian-branded loading spinner before hydration completes", () => {
    // Force the pre-hydration branch deterministically: suppress the effect that
    // flips `hydrated` to true so the component stays in its initial
    // `hydrated === false` render (the loading view).
    suppressEffects = true;

    const { container } = render(
      <AuthGuard>
        <div data-testid="protected">child</div>
      </AuthGuard>,
    );

    // Loading status region present and labeled (WCAG live-region for the spinner).
    const spinner = screen.getByRole("status", { name: "Loading" });
    expect(spinner).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    // Default brand is Meridian -> logo mark "MERIDIAN" with the green accent.
    expect(screen.getByText("MERIDIAN")).toBeInTheDocument();
    const badge = container.querySelector('span[style]') as HTMLElement | null;
    expect(badge).not.toBeNull();
    expect(badge?.style.backgroundColor).toBe("rgb(0, 170, 19)"); // #00AA13
    // Children must NOT be visible while loading; no redirect fires either.
    expect(screen.queryByTestId("protected")).not.toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("uses the configured wesco brand accent + logo mark in the loading spinner", () => {
    useProductFinder.setState({ brandId: "wesco" });
    suppressEffects = true;

    const { container } = render(
      <AuthGuard>
        <div>child</div>
      </AuthGuard>,
    );

    // wesco profile: logoMark "WESCO", accent "#004986".
    expect(screen.getByText("WESCO")).toBeInTheDocument();
    const badge = container.querySelector('span[style]') as HTMLElement | null;
    expect(badge?.style.backgroundColor).toBe("rgb(0, 73, 134)"); // #004986
    // The badge's leading initial is the first char of the logo mark.
    expect(badge?.textContent).toBe("W");
  });

  it("redirects an unauthenticated wesco-branded session as well (brand does not gate auth)", async () => {
    useProductFinder.setState({ brandId: "wesco", user: null });

    render(
      <AuthGuard>
        <div data-testid="protected">child</div>
      </AuthGuard>,
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/product-finder/login");
    });
    expect(screen.queryByTestId("protected")).not.toBeInTheDocument();
  });
});
