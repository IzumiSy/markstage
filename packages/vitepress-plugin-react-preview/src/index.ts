import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { Plugin } from "vite";
import type { PreviewBlockEntry } from "@izumisy/react-preview";
import {
  createBasePreviewPlugin,
  createPreviewBuildPlugin,
  simpleHash,
  parseMeta,
} from "@izumisy/react-preview";
import { createMarkdownItPlugin } from "./markdown-it-plugin";

export type MarkstageVitePressOptions = {
  /** CSS file to inject into preview blocks (e.g. your component library's stylesheet) */
  css?: string;
};

/**
 * Recursively find all .md files under a directory.
 */
function findMarkdownFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".") || entry === "node_modules") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...findMarkdownFiles(full));
    } else if (full.endsWith(".md")) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Pre-scan markdown files to populate the block registry before Rollup
 * resolves the registry virtual module.
 */
function scanMarkdownBlocks(
  root: string,
  blockRegistry: Map<string, PreviewBlockEntry>,
): void {
  const mdFiles = findMarkdownFiles(root);
  for (const file of mdFiles) {
    const content = readFileSync(file, "utf-8");
    const relativePath = relative(root, file);

    // Match all fenced code blocks — use source line number for blockId
    const fenceRe = /^(`{3,})\s*(\S.*?)?\n([\s\S]*?)^\1\s*$/gm;
    let m: RegExpExecArray | null;
    while ((m = fenceRe.exec(content)) !== null) {
      const info = (m[2] || "").trim();
      if (info.startsWith("tsx preview")) {
        const code = m[3].replace(/\n$/, "");
        // Compute 0-based line number from the match offset
        const line = content.slice(0, m.index).split("\n").length - 1;
        const blockId = simpleHash(`${relativePath}:${line}`);
        const meta = parseMeta(info.slice("tsx preview".length));
        blockRegistry.set(blockId, {
          code,
          sourceFile: "",
          wrap: meta.wrap,
          height: meta.height,
          standalone: meta.standalone === "true",
        });
      }
    }
  }
}

/**
 * Create a Markstage plugin instance for VitePress.
 *
 * Returns an object with:
 * - `markdownIt`: markdown-it plugin that transforms ` ```tsx preview ` fences
 * - `vite()`: Vite plugins that serve preview blocks with live React components
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
     * Vite plugins that provide virtual modules for preview blocks.
     */
    vite(): Plugin[] {
      return [
        ...createBasePreviewPlugin("markstage-vitepress-preview", {
          blockRegistry,
          cssImport: options.css,
        }),
        createPreviewBuildPlugin({
          blockRegistry,
          scanBlocks: (root) => scanMarkdownBlocks(root, blockRegistry),
        }),
      ];
    },
  };
}
