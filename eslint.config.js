/**
 * ESLint Configuration with Hardcore-Inspired Rules
 *
 * This configuration is inspired by eslint-config-hardcore
 * (https://github.com/EvgenyOrekhov/eslint-config-hardcore) but adapted
 * for ESLint 9's flat config format.
 *
 * Included plugins (from hardcore):
 * - eslint-plugin-unicorn: ~105 rules for better JavaScript/TypeScript practices
 * - eslint-plugin-sonarjs: ~86 rules for detecting bugs and code smells
 * - eslint-plugin-security: ~12 rules for security vulnerabilities
 * - eslint-plugin-promise: ~15 rules for promise best practices
 *
 * Additional project-specific plugins:
 * - eslint-plugin-import: Import/export organization and validation
 * - eslint-plugin-jsdoc: JSDoc documentation requirements
 * - typescript-eslint: TypeScript-specific rules
 *
 * Total: 220+ rules from hardcore-inspired plugins + project rules
 */

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import jsdocPlugin from "eslint-plugin-jsdoc";
import unicornPlugin from "eslint-plugin-unicorn";
import sonarjsPlugin from "eslint-plugin-sonarjs";
import securityPlugin from "eslint-plugin-security";
import promisePlugin from "eslint-plugin-promise";
import perfectionistPlugin from "eslint-plugin-perfectionist";

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  // Hardcore-inspired plugin configurations (ESLint 9 compatible)
  unicornPlugin.configs["recommended"],
  sonarjsPlugin.configs.recommended,
  securityPlugin.configs.recommended,
  promisePlugin.configs["flat/recommended"],
  perfectionistPlugin.configs["recommended-natural"],
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      import: importPlugin,
      jsdoc: jsdocPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
        node: true,
      },
    },
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",

      // Complexity rules - max complexity of 3
      complexity: ["error", { max: 3 }],

      // Class member accessibility - enforce no private methods (code smell)
      "@typescript-eslint/explicit-member-accessibility": [
        "error",
        {
          accessibility: "no-public",
          overrides: {
            properties: "off",
            methods: "off",
            constructors: "off",
          },
        },
      ],
      // Disable in favor of perfectionist/sort-classes
      "@typescript-eslint/member-ordering": "off",

      // JSDoc documentation requirements
      "jsdoc/require-jsdoc": [
        "error",
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: true,
            FunctionExpression: true,
          },
          publicOnly: false,
          contexts: [
            "TSInterfaceDeclaration",
            "TSTypeAliasDeclaration",
            "TSEnumDeclaration",
          ],
        },
      ],
      "jsdoc/require-description": "error",
      "jsdoc/require-param": "error",
      "jsdoc/require-param-description": "error",
      "jsdoc/require-param-type": "off", // TypeScript provides types
      "jsdoc/require-returns": "error",
      "jsdoc/require-returns-description": "error",
      "jsdoc/require-returns-type": "off", // TypeScript provides types
      "jsdoc/check-alignment": "error",
      "jsdoc/check-indentation": "error",
      "jsdoc/check-param-names": "error",
      "jsdoc/check-tag-names": "error",
      "jsdoc/check-types": "off", // TypeScript provides types
      "jsdoc/no-undefined-types": "off", // TypeScript provides types
      "jsdoc/valid-types": "off", // TypeScript provides types
      "jsdoc/tag-lines": "off", // Allow flexible tag line spacing

      // Import sorting and organization rules
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling"],
            "index",
            "object",
            "type",
          ],
          pathGroups: [
            {
              pattern: "@repo/**",
              group: "internal",
              position: "before",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
          "newlines-between": "never",
        },
      ],
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",
      "import/no-unresolved": "error",
      "import/named": "error",
      "import/default": "error",
      "import/namespace": "error",
      "import/no-cycle": "error",
      "sort-imports": [
        "error",
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
          allowSeparatedGroups: false,
        },
      ],

      // Hardcore-inspired rule customizations
      // Unicorn adjustments
      "unicorn/no-null": "off", // Allow null for compatibility
      "unicorn/prevent-abbreviations": "off", // Allow common abbreviations
      "unicorn/filename-case": [
        "error",
        {
          cases: {
            kebabCase: true,
            pascalCase: true,
          },
        },
      ],
      "unicorn/no-array-reduce": "off", // Reduce is useful
      "unicorn/no-array-for-each": "off", // forEach is clear
      "unicorn/prefer-top-level-await": "off", // Not always appropriate
      "unicorn/no-process-exit": "off", // CLI needs process.exit
      "unicorn/prefer-module": "off", // Allow flexibility

      // SonarJS adjustments
      "sonarjs/cognitive-complexity": ["error", 5],
      "sonarjs/no-duplicate-string": ["error", { threshold: 5 }],

      // Security adjustments
      "security/detect-object-injection": "off", // Too many false positives

      // Promise adjustments
      "promise/always-return": "off", // TypeScript handles this
      "promise/catch-or-return": [
        "error",
        { allowFinally: true, terminationMethod: ["catch", "finally"] },
      ],

      // Perfectionist sorting rules (auto-fixable!)
      "perfectionist/sort-classes": [
        "error",
        {
          type: "natural",
          order: "asc",
          groups: [
            "static-property",
            "private-property",
            "property",
            "constructor",
            "static-method",
            "method",
            "private-method",
          ],
        },
      ],
      "perfectionist/sort-objects": [
        "error",
        {
          type: "natural",
          order: "asc",
          partitionByComment: true,
        },
      ],
      "perfectionist/sort-interfaces": ["error", { type: "natural", order: "asc" }],
      "perfectionist/sort-enums": ["error", { type: "natural", order: "asc" }],
      "perfectionist/sort-exports": ["error", { type: "natural", order: "asc" }],
      "perfectionist/sort-named-imports": ["error", { type: "natural", order: "asc" }],
      "perfectionist/sort-named-exports": ["error", { type: "natural", order: "asc" }],
      // Disable perfectionist import sorting (conflicts with import plugin)
      "perfectionist/sort-imports": "off",
    },
  },
  {
    ignores: [
      // Dependencies
      "**/node_modules/**",
      "**/jspm_packages/**",
      "**/bower_components/**",

      // Build outputs
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/.nuxt/**",
      "**/out/**",

      // Test coverage
      "**/coverage/**",
      "**/.nyc_output/**",
      "**/lib-cov/**",

      // Cache directories
      "**/.cache/**",
      "**/.parcel-cache/**",
      "**/.turbo/**",
      "**/.vitepress/cache/**",
      "**/.vitepress/dist/**",
      "**/.docusaurus/**",
      "**/.fusebox/**",
      "**/.svelte-kit/**",

      // Temporary files
      "**/tmp/**",
      "**/temp/**",
      "**/.temp/**",

      // Reports and logs
      "**/reports/**",
      "**/logs/**",

      // Tool-specific
      "**/.mastra/**",
      "**/.firebase/**",
      "**/.serverless/**",
      "**/.dynamodb/**",
      "**/.yarn/**",
      "**/.pnp.*",

      // Config files
      "**/vitest.config.ts",
      "**/turbo.json",
      "eslint.config.js",
    ],
  },
];
