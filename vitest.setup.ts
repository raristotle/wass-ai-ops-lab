// Registers @testing-library/jest-dom matchers for component (*.test.tsx) tests.
// Import-only side effect; harmless for node-env tests.
import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement Element.scrollTo / scrollIntoView; components that
// auto-scroll (e.g. AssistantPanel scrolling to the newest message) call them
// during render. Provide no-op stubs so those renders don't throw under jsdom.
if (typeof Element !== "undefined") {
  if (!Element.prototype.scrollTo) {
    Element.prototype.scrollTo = function () {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = function () {};
  }
}
