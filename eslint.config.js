import globals from "globals";

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // Basic JavaScript rules
      "no-unused-vars": "warn",
      "no-undef": "error",
      "no-console": "off",
      "no-debugger": "warn",

      // Code style rules
      indent: ["error", 2],
      quotes: ["error", "double"],
      semi: ["error", "always"],

      // Line length rules - allow longer lines for object literals
      "max-len": [
        "error",
        {
          code: 140,
          ignorePattern: "^\\s*\\{.*\\},$",
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],

      // Object formatting
      "object-curly-spacing": ["error", "always"],
      "comma-dangle": ["error", "only-multiline"],

      // Import/Export
      "no-duplicate-imports": "error",

      // Best practices
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "warn",
      "no-trailing-spaces": "error",
    },
  },
  {
    // Ignore node_modules and dist directories
    ignores: ["node_modules/**", "dist/**", "public/**", "src/libs/**"],
  },
];
