import type { Plugin } from "vite";

/**
 * Replaces the `<title>` in index.html with the configured title.
 */
export function previewerHtmlTitlePlugin(title: string): Plugin {
  return {
    name: "previewer-html-title",
    transformIndexHtml(html) {
      return html.replaceAll("{{title}}", title);
    },
  };
}
