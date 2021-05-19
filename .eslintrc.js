module.exports = {
  extends: ["plugin:@typescript-eslint/recommended"],
  rules: {
    "no-console": 1,
    semi: "error",
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  env: {
    es6: true,
    node: true,
  },
};
