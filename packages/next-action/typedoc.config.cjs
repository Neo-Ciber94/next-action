/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  entryPoints: ["./src/**/*.ts"],
  plugin: ["typedoc-material-theme", "typedoc-plugin-extras"],
  themeColor: "#0085fa",
  out: "docs",
};
