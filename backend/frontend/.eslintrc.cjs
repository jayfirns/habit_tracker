module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  extends: ["eslint:recommended", "plugin:import/errors", "plugin:import/warnings"],
  parserOptions: {
    sourceType: "module",
  },
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js"],
      },
    },
  },
  rules: {
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
  },
};
