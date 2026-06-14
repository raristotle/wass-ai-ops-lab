import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AssistantPanel } from "@/features/product-finder/AssistantPanel";
import { useProductFinder } from "@/lib/product-finder-store";

/**
 * The assistant must show a clear "preview mode" state — and never claim to be
 * active — when no ANTHROPIC_API_KEY is configured (the cost-safe default).
 */
describe("AssistantPanel (component)", () => {
  beforeEach(() => {
    useProductFinder.setState({ assistantOpen: true });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ enabled: false }) }))
    );
  });
  afterEach(() => {
    useProductFinder.setState({ assistantOpen: false });
    vi.unstubAllGlobals();
  });

  it("renders the dormant 'preview mode' banner and suggestion prompts", async () => {
    render(<AssistantPanel />);
    expect(screen.getByRole("dialog", { name: "Ask Meridian" })).toBeInTheDocument();
    expect(screen.getByText(/What do you stock that replaces a Bussmann FRN-R-30/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Preview mode/)).toBeInTheDocument());
    expect(screen.getByText(/ANTHROPIC_API_KEY/)).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    useProductFinder.setState({ assistantOpen: false });
    const { container } = render(<AssistantPanel />);
    expect(container).toBeEmptyDOMElement();
  });
});
