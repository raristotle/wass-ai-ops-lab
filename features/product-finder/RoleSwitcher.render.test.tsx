import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RoleSwitcher } from "@/features/product-finder/RoleSwitcher";
import {
  useProductFinder,
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
} from "@/lib/product-finder-store";

/**
 * Render-coverage for the header demo-role switcher. It reads `user` + `login`
 * from the real Zustand store, so we seed the store via setState and exercise
 * both the signed-out and logged-in branches plus the onChange guards/handler.
 *
 * login() best-effort POSTs to /api/auth/login (establishServerSession) and
 * writes localStorage, so stub fetch to keep it inert under jsdom.
 */
describe("RoleSwitcher (component)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({}) })),
    );
    useProductFinder.setState({ user: null, authError: null });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    useProductFinder.setState({ user: null, authError: null });
  });

  it("renders the demo-role label and one option per demo account when signed out", () => {
    render(<RoleSwitcher />);

    // The labelled combobox is the switcher itself.
    const select = screen.getByLabelText("Demo role:");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("demo")).toBeInTheDocument();

    // Signed out → the placeholder option is present and selected.
    expect(screen.getByRole("option", { name: "— Signed out —" })).toBeInTheDocument();
    expect((select as HTMLSelectElement).value).toBe("");

    // One option per demo account (plus the signed-out placeholder).
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(DEMO_ACCOUNTS.length + 1);
    for (const account of DEMO_ACCOUNTS) {
      expect(
        screen.getByRole("option", { name: `${account.name} — ${account.role}` }),
      ).toBeInTheDocument();
    }
  });

  it("does NOT render the signed-out placeholder once a user is logged in", () => {
    const account = DEMO_ACCOUNTS[0];
    useProductFinder.setState({
      user: { name: account.name, email: account.email, role: account.role, branch: "B", branchId: "b" },
    });
    render(<RoleSwitcher />);

    const select = screen.getByLabelText("Demo role:") as HTMLSelectElement;
    expect(select.value).toBe(account.email);
    expect(screen.queryByRole("option", { name: "— Signed out —" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(DEMO_ACCOUNTS.length);
  });

  it("logs in via the store when a different account is selected", () => {
    render(<RoleSwitcher />);
    const select = screen.getByLabelText("Demo role:");
    const target = DEMO_ACCOUNTS[1];

    fireEvent.change(select, { target: { value: target.email } });

    const user = useProductFinder.getState().user;
    expect(user?.email).toBe(target.email);
    expect(user?.role).toBe(target.role);

    // Best-effort server session POST was attempted with the demo password.
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const call = fetchMock.mock.calls[0] as unknown as [string, { body: string }];
    expect(call[0]).toBe("/api/auth/login");
    expect(JSON.parse(call[1].body)).toMatchObject({
      email: target.email,
      password: DEMO_PASSWORD,
    });
  });

  it("ignores the change when the empty value is chosen (early-return guard)", () => {
    const account = DEMO_ACCOUNTS[0];
    useProductFinder.setState({
      user: { name: account.name, email: account.email, role: account.role, branch: "B", branchId: "b" },
    });
    render(<RoleSwitcher />);
    const select = screen.getByLabelText("Demo role:");

    // Choosing the empty value (no matching option when logged in) must not log out / re-login.
    fireEvent.change(select, { target: { value: "" } });

    expect(useProductFinder.getState().user?.email).toBe(account.email);
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock.mock.calls).toHaveLength(0);
  });

  it("ignores re-selecting the already-active account (no redundant login)", () => {
    const account = DEMO_ACCOUNTS[0];
    useProductFinder.setState({
      user: { name: account.name, email: account.email, role: account.role, branch: "B", branchId: "b" },
    });
    render(<RoleSwitcher />);
    const select = screen.getByLabelText("Demo role:");

    fireEvent.change(select, { target: { value: account.email } });

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock.mock.calls).toHaveLength(0);
  });
});
