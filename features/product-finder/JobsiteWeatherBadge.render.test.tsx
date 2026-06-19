import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { JobsiteWeatherBadge } from "@/features/product-finder/JobsiteWeatherBadge";

// Shapes mirror the component's WeatherResponse / AssessedPeriod contract.
interface AssessedPeriod {
  name: string;
  tempF: number | null;
  precipPct: number | null;
  windMph: number | null;
  shortForecast: string | null;
  risk: "ok" | "caution" | "hold";
  flags: string[];
}
interface WeatherResponse {
  enabled: boolean;
  reason?: string;
  source?: string;
  outlook?: { periods: AssessedPeriod[]; worst: "ok" | "caution" | "hold" };
}

function period(over: Partial<AssessedPeriod> = {}): AssessedPeriod {
  return {
    name: "Tonight",
    tempF: 41,
    precipPct: 60,
    windMph: 18,
    shortForecast: "Rain likely",
    risk: "caution",
    flags: [],
    ...over,
  };
}

/**
 * Stub fetch to resolve /api/weather with the given payload. The badge fires the
 * fetch on mount and calls setState inside the resolving .then(), so callers wrap
 * the wait in waitFor() to let that update settle inside React's act().
 */
function stubWeather(payload: WeatherResponse | null, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok, json: async () => payload }) as unknown as Response),
  );
}

async function flushWeatherFetch() {
  const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
  await waitFor(() => {
    const calls = fetchMock.mock.calls as unknown as [string][];
    expect(calls.some(([u]) => typeof u === "string" && u.includes("/api/weather"))).toBe(true);
  });
}

describe("JobsiteWeatherBadge (component)", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("dormant / empty branches render nothing", () => {
    it("renders nothing when the lane is dormant (enabled:false)", async () => {
      stubWeather({ enabled: false, reason: "no WEATHER_CONTACT" });
      const { container } = render(<JobsiteWeatherBadge location="Houston, TX" />);
      await flushWeatherFetch();
      // Let the setState from the resolved fetch flush, then assert empty.
      await waitFor(() => expect(container).toBeEmptyDOMElement());
    });

    it("renders nothing when enabled but no outlook is present", async () => {
      stubWeather({ enabled: true, source: "nws" });
      const { container } = render(<JobsiteWeatherBadge location="Dallas, TX" />);
      await flushWeatherFetch();
      await waitFor(() => expect(container).toBeEmptyDOMElement());
    });

    it("renders nothing when the outlook has zero periods", async () => {
      stubWeather({ enabled: true, outlook: { periods: [], worst: "ok" } });
      const { container } = render(<JobsiteWeatherBadge location="Austin, TX" />);
      await flushWeatherFetch();
      await waitFor(() => expect(container).toBeEmptyDOMElement());
    });

    it("renders nothing when the fetch responds non-OK (r.ok === false)", async () => {
      stubWeather({ enabled: true, outlook: { periods: [period()], worst: "hold" } }, false);
      const { container } = render(<JobsiteWeatherBadge location="Houston, TX" />);
      await flushWeatherFetch();
      // Non-OK -> .then maps to null -> nothing renders.
      await waitFor(() => expect(container).toBeEmptyDOMElement());
    });

    it("stays empty when fetch rejects (network error path)", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
      const { container } = render(<JobsiteWeatherBadge location="Houston, TX" />);
      await flushWeatherFetch();
      await waitFor(() => expect(container).toBeEmptyDOMElement());
    });
  });

  describe("configured / populated", () => {
    it("renders the risk-labelled badge for a 'hold' outlook (smoke)", async () => {
      stubWeather({
        enabled: true,
        outlook: { periods: [period({ name: "Tonight", risk: "hold" })], worst: "hold" },
      });
      render(<JobsiteWeatherBadge location="Houston, TX" />);
      const btn = await screen.findByRole("button", { name: /Install hold advised · Houston, TX/ });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveAttribute("aria-expanded", "false");
      // The provenance footnote is always shown once the badge is live.
      expect(screen.getByText(/NWS forecast, fetched on demand/i)).toBeInTheDocument();
      // Collapsed: the per-period detail list is not mounted.
      expect(screen.queryByText("Tonight:")).not.toBeInTheDocument();
    });

    it("labels an 'ok' worst-case as window-clear", async () => {
      stubWeather({ enabled: true, outlook: { periods: [period({ risk: "ok" })], worst: "ok" } });
      render(<JobsiteWeatherBadge location="Site A" />);
      expect(await screen.findByRole("button", { name: /Install window clear · Site A/ })).toBeInTheDocument();
    });

    it("labels a 'caution' worst-case distinctly", async () => {
      stubWeather({ enabled: true, outlook: { periods: [period()], worst: "caution" } });
      render(<JobsiteWeatherBadge location="Site B" />);
      expect(await screen.findByRole("button", { name: /Install caution · Site B/ })).toBeInTheDocument();
    });

    it("falls back to the 'ok' style for an unrecognized worst value", async () => {
      // worst outside the RISK_STYLE keys exercises the `?? RISK_STYLE.ok` branch.
      stubWeather({
        enabled: true,
        outlook: { periods: [period()], worst: "blizzard" as unknown as "ok" },
      });
      render(<JobsiteWeatherBadge location="Edge City" />);
      expect(await screen.findByRole("button", { name: /Install window clear · Edge City/ })).toBeInTheDocument();
    });

    it("expands to show period detail with temp/precip/wind and flags, then collapses", async () => {
      stubWeather({
        enabled: true,
        outlook: {
          worst: "hold",
          periods: [
            period({
              name: "Tonight",
              shortForecast: "Heavy rain",
              tempF: 38,
              precipPct: 80,
              windMph: 22,
              flags: ["High wind for lift work", "Below 40°F set point"],
            }),
          ],
        },
      });
      render(<JobsiteWeatherBadge location="Houston, TX" />);
      const btn = await screen.findByRole("button", { name: /Install hold advised/ });

      fireEvent.click(btn);
      expect(btn).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText("Tonight:")).toBeInTheDocument();
      // The detail span concatenates forecast + the optional numeric fields across
      // multiple text nodes; match on the assembled textContent of the span.
      expect(
        screen.getByText(
          (_content, el) =>
            el?.tagName === "SPAN" &&
            (el.textContent ?? "") === "Heavy rain · 38°F · 80% precip · 22 mph",
        ),
      ).toBeInTheDocument();
      // Flags render as their own list.
      expect(screen.getByText("High wind for lift work")).toBeInTheDocument();
      expect(screen.getByText("Below 40°F set point")).toBeInTheDocument();

      fireEvent.click(btn);
      expect(btn).toHaveAttribute("aria-expanded", "false");
      await waitFor(() => expect(screen.queryByText("Tonight:")).not.toBeInTheDocument());
    });

    it("omits the optional numeric suffixes when temp/precip/wind are null", async () => {
      stubWeather({
        enabled: true,
        outlook: {
          worst: "ok",
          periods: [
            period({
              name: "Tomorrow",
              shortForecast: "Sunny",
              tempF: null,
              precipPct: null,
              windMph: null,
              flags: [],
            }),
          ],
        },
      });
      render(<JobsiteWeatherBadge location="Phoenix, AZ" />);
      fireEvent.click(await screen.findByRole("button", { name: /Install window clear/ }));
      // Detail is just the forecast — no "°F", "% precip", or "mph" suffixes, and
      // no flag sub-list for an empty flags array.
      const detail = screen.getByText("Sunny");
      expect(detail).toBeInTheDocument();
      expect(screen.queryByText(/°F/)).not.toBeInTheDocument();
      expect(screen.queryByText(/% precip/)).not.toBeInTheDocument();
      expect(screen.queryByText(/mph/)).not.toBeInTheDocument();
    });

    it("re-fetches and refreshes when the location prop changes", async () => {
      stubWeather({ enabled: true, outlook: { periods: [period()], worst: "caution" } });
      const { rerender } = render(<JobsiteWeatherBadge location="Houston, TX" />);
      expect(await screen.findByRole("button", { name: /· Houston, TX/ })).toBeInTheDocument();

      const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
      const beforeCalls = (fetchMock.mock.calls as unknown as [string][]).length;
      rerender(<JobsiteWeatherBadge location="Dallas, TX" />);
      await waitFor(() => {
        const calls = fetchMock.mock.calls as unknown as [string][];
        expect(calls.length).toBeGreaterThan(beforeCalls);
        expect(calls.some(([u]) => u.includes("Dallas"))).toBe(true);
      });
      // The label tracks the new location prop.
      expect(await screen.findByRole("button", { name: /· Dallas, TX/ })).toBeInTheDocument();
    });

    it("URL-encodes the location into the weather request", async () => {
      stubWeather({ enabled: true, outlook: { periods: [period()], worst: "ok" } });
      render(<JobsiteWeatherBadge location="San Antonio, TX" />);
      await flushWeatherFetch();
      const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
      const calls = fetchMock.mock.calls as unknown as [string][];
      expect(calls[0][0]).toBe("/api/weather?address=San%20Antonio%2C%20TX");
    });
  });
});
