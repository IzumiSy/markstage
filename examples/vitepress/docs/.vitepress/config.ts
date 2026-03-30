import { defineConfig } from "vitepress";
import { createMarkstagePlugin } from "@izumisy/vitepress-plugin-react-preview";

const markstage = createMarkstagePlugin({
  css: "@tailor-platform/app-shell/styles",
});

export default defineConfig({
  title: "Markstage + VitePress Example",
  description: "Example of using Markstage preview blocks in VitePress",

  markdown: {
    config(md) {
      md.use(markstage.markdownIt);
    },
  },

  vite: {
    plugins: [...markstage.vite()],
  },
});
