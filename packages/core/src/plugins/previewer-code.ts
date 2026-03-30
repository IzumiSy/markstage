import type { Plugin } from "vite";
import {
  extractPreviewBlocks,
  escapeJsString,
  hasPreviewBlocks,
} from "../preview-transform";
import { blockRegistry, simpleHash } from "./preview-registry";

/**
 * Vite plugin that transforms ` ```tsx preview ` fenced code blocks in .preview.mdx
 * files into `<PreviewBlock>` components rendered inside iframes.
 *
 * Runs BEFORE the MDX plugin so the MDX compiler sees standard markup.
 *
 * Each block is registered in the shared block registry so the iframe plugin
 * can serve / build the isolated preview pages.
 *
 * Usage in .preview.mdx:
 *
 * ```tsx preview
 * <Button variant="default">Default</Button>
 * ```
 *
 * This is expanded into:
 *
 * <PreviewBlock code="..." blockId="..." />
 */

export function previewCodePlugin(): Plugin {
  return {
    name: "previewer-preview-code",
    enforce: "pre",
    transform(code, id) {
      if (!id.endsWith(".preview.mdx")) return;
      if (!hasPreviewBlocks(code)) return;

      const blocks = extractPreviewBlocks(code);
      let transformed = code;
      // Replace in reverse order to preserve positions
      for (let i = blocks.length - 1; i >= 0; i--) {
        const block = blocks[i];
        const blockId = simpleHash(`${id}:${i}`);
        const escaped = escapeJsString(block.code);

        // Register block for the iframe plugin
        blockRegistry.set(blockId, {
          code: block.code,
          sourceFile: id,
          wrap: block.meta.wrap,
        });

        const replacement = `<PreviewBlock code={"${escaped}"} blockId={"${blockId}"} />`;
        transformed =
          transformed.slice(0, block.start) +
          replacement +
          transformed.slice(block.end);
      }

      return { code: transformed, map: null };
    },
  };
}
