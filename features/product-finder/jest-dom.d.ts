// Makes the @testing-library/jest-dom matchers (toBeInTheDocument, etc.)
// visible to tsc for the component (*.test.tsx) tests. The runtime registration
// lives in vitest.setup.ts; this only carries the type augmentation, and sits
// under features/ so apps/web/tsconfig.json's include picks it up.
import "@testing-library/jest-dom/vitest";
