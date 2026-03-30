import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "preview-transform": "src/preview-transform.ts",
    iframe: "src/plugins/iframe-common.ts",
  },
  format: ["esm"],
});
