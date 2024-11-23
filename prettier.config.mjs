export default {
  overrides: [
    {
      files: ["**/*"],
      semi: true,
      trailingComma: "all",
      tabWidth: 2,
      endOfLine: "auto",
      printWidth: 140,
      plugins: [
        "prettier-plugin-multiline-arrays",
        "prettier-plugin-css-order",
        "@ianvs/prettier-plugin-sort-imports",
        "prettier-plugin-organize-attributes",
        "prettier-plugin-organize-imports",
        "prettier-plugin-packagejson",
        "prettier-plugin-jsdoc",
        "prettier-plugin-tailwindcss",
        "prettier-plugin-classnames",
        "prettier-plugin-merge",
      ],
      attributeGroups: ["$DEFAULT", "^data-"],
      attributeSort: "ASC",
    },
  ],
};
