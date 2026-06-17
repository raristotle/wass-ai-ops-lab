import { describe, it, expect } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useModalA11y } from "@/features/product-finder/useModalA11y";

// Minimal modal harness exercising the hook the way the real modals use it:
// a trigger button opens a [role="dialog"] whose close button carries closeRef.
function Harness() {
  const [open, setOpen] = useState(false);
  const closeRef = useModalA11y(open, () => setOpen(false));
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Test dialog">
          <button type="button" ref={closeRef} onClick={() => setOpen(false)} aria-label="Close">
            ×
          </button>
          <input aria-label="field" />
        </div>
      )}
    </div>
  );
}

describe("useModalA11y focus management (WCAG 2.4.3)", () => {
  it("moves focus into the dialog on open and RETURNS it to the trigger on close", () => {
    render(<Harness />);
    const openBtn = screen.getByRole("button", { name: "Open" });
    openBtn.focus();
    expect(document.activeElement).toBe(openBtn);

    fireEvent.click(openBtn);
    const closeBtn = screen.getByRole("button", { name: "Close" });
    expect(document.activeElement).toBe(closeBtn); // focus entered the dialog

    fireEvent.click(closeBtn);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(openBtn); // focus restored to trigger
  });

  it("closes on Escape and restores focus to the trigger", () => {
    render(<Harness />);
    const openBtn = screen.getByRole("button", { name: "Open" });
    openBtn.focus();
    fireEvent.click(openBtn);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(openBtn);
  });
});
