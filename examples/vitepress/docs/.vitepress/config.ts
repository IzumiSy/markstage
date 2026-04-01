import { defineConfig } from "vitepress";
import { createMarkstagePlugin } from "@izumisy/vitepress-plugin-react-preview";

const markstage = createMarkstagePlugin({
  css: "@tailor-platform/app-shell/styles",
});

export default defineConfig({
  title: "VitePress Example",
  description: "Example of using Markstage preview blocks in VitePress",

  themeConfig: {
    sidebar: [
      {
        text: "Components",
        items: [
          { text: "Button", link: "/examples/button" },
          { text: "Combobox", link: "/examples/combobox" },
          { text: "Layout", link: "/examples/layout" },
          { text: "Sheet", link: "/examples/sheet" },
          { text: "Table", link: "/examples/table" },
        ],
      },
    ],
  },

  markdown: {
    config(md) {
      md.use(markstage.markdownIt);
    },
  },

  vite: {
    plugins: [...markstage.vite()],
  },
});
