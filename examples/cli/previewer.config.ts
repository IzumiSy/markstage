import { defineConfig } from "@izumisy/markstage";

export default defineConfig({
  title: "CLI Example",
  glob: "src/**/*.preview.mdx",
  css: "@tailor-platform/app-shell/styles",
});
