import type { Plugin } from "vite";
import type { PreviewBlockEntry } from "@markstage/core";
import { createBaseIframePlugin } from "@markstage/core/iframe";
import { createMarkdownItPlugin } from "./markdown-it-plugin";

export type MarkstageVitePressOptions = {
  /** CSS file to inject into preview iframes (e.g. your component library's stylesheet) */
  css?: string;
};

/**
 * Create a Markstage plugin instance for VitePress.
 *
 * Returns an object with:
 * - `markdownIt`: markdown-it plugin that transforms ` ```tsx preview ` fences
 * - `vite()`: Vite plugins that serve preview iframes with live React components
 */
export function createMarkstagePlugin(options: MarkstageVitePressOptions = {}) {
  const blockRegistry = new Map<string, PreviewBlockEntry>();

  return {
    /**
     * markdown-it plugin that transforms ` ```tsx preview ` fences into
     * `<PreviewBlock>` Vue components and registers blocks in the shared registry.
     */
    markdownIt: createMarkdownItPlugin(blockRegistry),

    /**
     * Vite plugins that serve preview iframes with live React components.
     */
    vite(): Plugin[] {
      return [
        createBaseIframePlugin("markstage-vitepress-preview", {
          blockRegistry,
          cssImport: options.css,
        }),
      ];
    },
  };
}
