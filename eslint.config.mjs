import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

// Source lives at the repo root (lib/, features/, components/, data/) while the
// Next app is in apps/web. A single root config lets one `eslint .` lint it all.
const eslintConfig = [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/*.config.{js,mjs,ts}",
      "**/next-env.d.ts",
      "prisma/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    settings: { next: { rootDir: "apps/web/" } },
    rules: {
      // Allow intentional `_`-prefixed discards (e.g. omitting a field via rest destructuring).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
];

export default eslintConfig;
