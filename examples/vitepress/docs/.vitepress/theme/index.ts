import DefaultTheme from "vitepress/theme";
import PreviewBlock from "@markstage/vitepress-plugin/PreviewBlock.vue";
import type { Theme } from "vitepress";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("PreviewBlock", PreviewBlock);
  },
} satisfies Theme;
