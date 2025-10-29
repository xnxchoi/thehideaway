import { fileURLToPath } from "url";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTS from "eslint-config-next/typescript";

const __filename = fileURLToPath(import.meta.url);

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTS,
  prettier,
  {
    rules: {
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-expressions": "off",
      "react-hooks/refs": "off",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "off",
	    "react-hooks/immutability": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          vars: "all",
          args: "after-used",
          ignoreRestSiblings: false,
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^(_|ignore)"
        }
      ]
    }
  },
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts"
  ])
]);

export default eslintConfig;
