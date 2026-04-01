import type MarkdownIt from "markdown-it";
import {
  simpleHash,
  parseMeta,
  type PreviewBlockEntry,
} from "@izumisy/react-preview";

/**
 * Create a markdown-it plugin that transforms ` ```tsx preview ` fenced code blocks
 * into a `<PreviewBlock>` Vue component with the code passed as props.
 *
 * Blocks are registered in the shared registry so the preview Vite plugin
 * can serve the preview pages.
 *
 * The code is base64-encoded to avoid escaping issues in HTML attributes.
 */
export function createMarkdownItPlugin(
  blockRegistry: Map<string, PreviewBlockEntry>,
) {
  return function markdownItPreviewPlugin(md: MarkdownIt): void {
    const defaultFence = md.renderer.rules.fence!;

    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const info = token.info.trim();

      if (info.startsWith("tsx preview")) {
        const code = token.content.replace(/\n$/, "");
        const encodedCode = Buffer.from(code).toString("base64");

        const pageId = env.relativePath || "unknown";
        // Use the source line number from the token for a stable,
        // parser-independent block identifier.
        const line = token.map?.[0] ?? 0;
        const blockId = simpleHash(`${pageId}:${line}`);

        const meta = parseMeta(info.slice("tsx preview".length));

        const isStandalone = meta.standalone === "true";

        // Register block in the shared registry for the preview plugin
        blockRegistry.set(blockId, {
          code,
          sourceFile: "",
          wrap: meta.wrap,
          height: meta.height,
          standalone: isStandalone,
        });

        // Use VitePress's configured Shiki highlighter if available
        const highlighted = md.options.highlight?.(code, "tsx", "") ?? "";
        const encodedHighlighted = Buffer.from(highlighted).toString("base64");

        const heightAttr = meta.height ? ` height="${meta.height}"` : "";
        const wrapAttr = meta.wrap ? ` wrap="${meta.wrap}"` : "";
        const alignAttr = meta.align ? ` align="${meta.align}"` : "";
        const standaloneAttr = isStandalone ? ` standalone="true"` : "";

        return `<PreviewBlock code="${encodedCode}" block-id="${blockId}" highlighted="${encodedHighlighted}"${heightAttr}${wrapAttr}${alignAttr}${standaloneAttr} />\n`;
      }

      return defaultFence(tokens, idx, options, env, self);
    };
  };
}
