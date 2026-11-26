import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Architecture rule: only *.service.ts files talk to the API (see README, Architecture).
  // Pages and Server Actions call a service; ApiError and the types stay importable everywhere.
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/*.service.ts", "lib/api-client.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/api-client",
              importNames: ["apiFetch"],
              message: "Call the API from a *.service.ts file, then use that service here.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
