import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PushSubscribeButton } from "@/features/product-finder/PushSubscribeButton";

/**
 * PushSubscribeButton is a self-contained leaf: it reads NO Zustand store. Its
 * branches are driven entirely by browser APIs (navigator.serviceWorker,
 * window.PushManager, Notification) and the /api/push/subscribe fetch probe. So
 * the test seam here is stubbing those globals to walk each Phase:
 *   hidden (unsupported / dormant) → idle → subscribing → on / denied / error.
 *
 * A valid base64url VAPID-ish public key, so urlBase64ToUint8Array() → atob()
 * doesn't throw when the component subscribes.
 */
const PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8";

type PushManagerStub = {
  getSubscription: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
};
type RegistrationStub = { pushManager: PushManagerStub };

/** A subscription object whose toJSON() returns the shape the POST sends. */
function fakeSubscription() {
  return {
    toJSON: () => ({ endpoint: "https://push.example/abc", keys: { p256dh: "x", auth: "y" } }),
  };
}

/**
 * Install the four globals the component probes. `permission` seeds
 * Notification.permission; `requestPermission` is what enable() awaits;
 * `existingSubscription` controls the "already subscribed" branch on mount.
 */
function installBrowserPush(opts: {
  permission?: NotificationPermission;
  requestPermission?: NotificationPermission;
  existingSubscription?: ReturnType<typeof fakeSubscription> | null;
  registrationOnMount?: RegistrationStub | null;
} = {}) {
  const {
    permission = "default",
    requestPermission = "granted",
    existingSubscription = null,
    registrationOnMount = null,
  } = opts;

  const pushManager: PushManagerStub = {
    getSubscription: vi.fn(async () => existingSubscription),
    subscribe: vi.fn(async () => fakeSubscription()),
  };
  const registration: RegistrationStub = { pushManager };

  const serviceWorker = {
    // On-mount probe uses getRegistration(); enable() uses register() + ready.
    getRegistration: vi.fn(async () => registrationOnMount),
    register: vi.fn(async () => registration),
    ready: Promise.resolve(registration),
  };

  vi.stubGlobal("navigator", {
    serviceWorker,
  } as unknown as Navigator);
  // The component checks `"PushManager" in window` and `"Notification" in window`.
  vi.stubGlobal("PushManager", function PushManager() {});
  vi.stubGlobal("Notification", {
    permission,
    requestPermission: vi.fn(async () => requestPermission),
  } as unknown as typeof Notification);

  return { serviceWorker, registration, pushManager };
}

/** Stub fetch's GET probe (configured?) and capture the POST. */
function installFetch(opts: { configured?: boolean; publicKey?: string | null; postOk?: boolean } = {}) {
  const { configured = true, publicKey = PUBLIC_KEY, postOk = true } = opts;
  const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    if (!init || init.method === "GET") {
      return { ok: true, json: async () => ({ configured, publicKey }) };
    }
    // POST register
    return { ok: postOk, json: async () => ({}) };
  });
  vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
  return fetchMock;
}

describe("PushSubscribeButton (component)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stays hidden (renders nothing) when configured but no subscription exists and permission is default — idle button appears", async () => {
    // Smoke: with a configured server + supported browser, the button surfaces in
    // its idle state ("Enable alerts").
    installBrowserPush();
    installFetch();
    render(<PushSubscribeButton />);

    const btn = await screen.findByRole("button", { name: "Enable push alerts" });
    expect(btn).toHaveTextContent("Enable alerts");
    expect(btn).not.toBeDisabled();
    // Renders the 'off' bell glyph while idle.
    expect(btn).toHaveTextContent("🔕");
  });

  it("renders nothing while the integration is dormant (server reports not configured)", async () => {
    installBrowserPush();
    const fetchMock = installFetch({ configured: false });
    const { container } = render(<PushSubscribeButton />);

    // Give the async effect a chance to run, then assert it stayed hidden.
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders nothing when the browser lacks Push support (no serviceWorker/PushManager)", async () => {
    // No installBrowserPush(): navigator has no serviceWorker, window has no
    // PushManager/Notification → `supported` is false → effect returns early.
    const fetchMock = installFetch();
    const { container } = render(<PushSubscribeButton />);

    // The unsupported branch returns before any fetch — give microtasks a tick.
    await Promise.resolve();
    expect(container).toBeEmptyDOMElement();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reflects an already-subscribed browser as 'Alerts on' (disabled) without re-prompting", async () => {
    const sub = fakeSubscription();
    const { serviceWorker } = installBrowserPush({
      existingSubscription: sub,
      registrationOnMount: { pushManager: { getSubscription: vi.fn(async () => sub), subscribe: vi.fn() } },
    });
    installFetch();
    render(<PushSubscribeButton />);

    const btn = await screen.findByRole("button", { name: "Enable push alerts" });
    expect(btn).toHaveTextContent("Alerts on");
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent("🔔");
    // It probed for an existing registration on mount.
    expect(serviceWorker.getRegistration).toHaveBeenCalled();
  });

  it("reflects a previously-blocked permission as 'Alerts blocked' (disabled)", async () => {
    installBrowserPush({ permission: "denied" });
    installFetch();
    render(<PushSubscribeButton />);

    const btn = await screen.findByRole("button", { name: "Enable push alerts" });
    expect(btn).toHaveTextContent("Alerts blocked");
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("title", "Push alerts are blocked in your browser settings");
  });

  it("clicking 'Enable alerts' subscribes, POSTs the subscription, and flips to 'Alerts on'", async () => {
    const { pushManager } = installBrowserPush({ requestPermission: "granted" });
    const fetchMock = installFetch();
    render(<PushSubscribeButton />);

    const btn = await screen.findByRole("button", { name: "Enable push alerts" });
    expect(btn).toHaveTextContent("Enable alerts");

    fireEvent.click(btn);

    // Ends in the "on" state once the POST resolves ok.
    await waitFor(() => expect(btn).toHaveTextContent("Alerts on"));
    expect(btn).toBeDisabled();
    expect(pushManager.subscribe).toHaveBeenCalledTimes(1);

    // A POST carried the subscription's JSON (no raw payload, just the sub).
    const postCall = (fetchMock.mock.calls as unknown as [string, RequestInit][]).find(
      ([, init]) => init?.method === "POST",
    );
    expect(postCall).toBeDefined();
    const body = JSON.parse((postCall![1].body as string) as string) as { subscription: unknown };
    expect(body.subscription).toMatchObject({ endpoint: "https://push.example/abc" });
  });

  it("clicking enable when the user blocks the prompt lands on 'Alerts blocked'", async () => {
    installBrowserPush({ requestPermission: "denied" });
    installFetch();
    render(<PushSubscribeButton />);

    const btn = await screen.findByRole("button", { name: "Enable push alerts" });
    fireEvent.click(btn);

    await waitFor(() => expect(btn).toHaveTextContent("Alerts blocked"));
    expect(btn).toBeDisabled();
  });

  it("a failed POST registration surfaces the 'Try again' (re-clickable) error state", async () => {
    const { pushManager } = installBrowserPush({ requestPermission: "granted" });
    installFetch({ postOk: false });
    render(<PushSubscribeButton />);

    const btn = await screen.findByRole("button", { name: "Enable push alerts" });
    fireEvent.click(btn);

    await waitFor(() => expect(btn).toHaveTextContent("Try again"));
    // 'error' is NOT a disabled phase — the user can retry.
    expect(btn).not.toBeDisabled();
    expect(pushManager.subscribe).toHaveBeenCalled();
  });

  it("a thrown error mid-subscribe (e.g. register rejects) also lands on 'Try again'", async () => {
    const { serviceWorker } = installBrowserPush({ requestPermission: "granted" });
    serviceWorker.register.mockRejectedValueOnce(new Error("SW boom"));
    installFetch();
    render(<PushSubscribeButton />);

    const btn = await screen.findByRole("button", { name: "Enable push alerts" });
    fireEvent.click(btn);

    await waitFor(() => expect(btn).toHaveTextContent("Try again"));
    expect(btn).not.toBeDisabled();
  });
});
