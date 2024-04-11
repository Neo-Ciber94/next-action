/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  entryPoints: ["./src/**/*.ts"],
  plugin: ["typedoc-material-theme"],
  themeColor: "#0085fa",
  out: "docs",
};
