module.exports = {
  env: {
    node: true,
    browser: true,
    es2021: true
  },
  extends: [
    "eslint:recommended",
    "plugin:vue/vue3-recommended",
    "plugin:@typescript-eslint/recommended",
    "@nuxtjs/eslint-config-typescript"
  ],
  overrides: [],
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
    ecmaVersion: "latest",
    sourceType: "module"
  },
  plugins: [
    "vue",
    "@typescript-eslint"
  ],
  rules: {
    // ESLint Suggestions
    curly: ["off", "all"],
    eqeqeq: ["error", "always"],
    "init-declarations": ["error", "always"],
    "no-console": ["warn", { allow: ["warn", "error", "log"] }],
    "no-constant-binary-expression": "error",
    "no-eq-null": "error",
    "no-mixed-operators": "error",
    "no-multi-assign": "error",
    "no-nested-ternary": "error",
    "no-return-assign": ["error", "always"],
    "no-return-await": "error",
    "no-sequences": "error",
    "@typescript-eslint/no-shadow": "error",
    "no-throw-literal": "error",
    "no-undef-init": "off",
    "no-unneeded-ternary": "error",
    "no-unused-expressions": "error",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "no-useless-concat": "error",
    "no-useless-return": "error",
    "no-var": "error",
    "prefer-arrow-callback": "warn",
    "prefer-const": "error",
    "prefer-object-spread": "warn",
    "prefer-promise-reject-errors": "error",
    "prefer-rest-params": "error",
    "prefer-spread": "warn",
    "prefer-template": "warn",
    "require-await": "error",
    "spaced-comment": "warn",
    yoda: "warn",
    "eol-last": "warn",

    // ESLint Layout & Formatting
    "brace-style": ["warn", "1tbs"],
    "array-bracket-newline": ["warn", { multiline: true }],
    "array-bracket-spacing": ["warn", "never"],
    "arrow-parens": ["warn", "as-needed"],
    "comma-dangle": ["warn", "only-multiline"],
    "@typescript-eslint/comma-spacing": ["warn"],
    "dot-location": ["warn", "property"],
    "@typescript-eslint/func-call-spacing": ["warn"],
    "function-call-argument-newline": ["warn", "consistent"],
    "function-paren-newline": ["warn", "multiline"],
    "@typescript-eslint/indent": ["warn", 2, { SwitchCase: 1 }],
    "key-spacing": "warn",
    "keyword-spacing": "warn",
    "max-len": [
      "warn", {
        code: 140,
        tabWidth: 2,
        ignoreComments: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      }
    ],
    "no-multi-spaces": "warn",
    "no-multiple-empty-lines": ["warn", { max: 1 }],
    "no-trailing-spaces": "warn",
    "no-whitespace-before-property": "warn",
    "nonblock-statement-body-position": "warn",
    "object-curly-newline": ["warn", { multiline: true }],
    "object-curly-spacing": ["warn", "always"],
    "object-property-newline": "warn",
    quotes: ["warn", "double"],
    "rest-spread-spacing": "warn",
    semi: ["warn", "never"],
    "space-before-blocks": "warn",
    "space-before-function-paren": [
      "warn", {
        anonymous: "never",
        named: "never",
        asyncArrow: "always"
      }
    ],
    "space-in-parens": "warn",
    "space-infix-ops": "warn",
    "space-unary-ops": "warn",
  }
}
