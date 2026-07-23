import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "out-local/**",
    "out-local-v3/**",
    "out-public/**",
    "out-public-v3/**",
    "out-review-v3-final/**",
    "out-local-v3-final/**",
    "out-public-v3-final/**",
    "build/**",
    "test-results/**",
    "playwright-report/**",
    "next-env.d.ts",
    "public/pdf.worker.min.mjs",
  ]),
]);

export default eslintConfig;
