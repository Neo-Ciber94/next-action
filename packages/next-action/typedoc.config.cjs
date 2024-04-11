/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  entryPoints: [
    "./src/index.ts",
    "./src/server.ts",
    "./src/react.ts",
    "./src/utils.ts",
    "./src/testing/server.ts",
    "./src/testing/client.ts",
  ],
  out: "docs",
};
