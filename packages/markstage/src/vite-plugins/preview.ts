import type { Plugin, ViteDevServer } from "vite";
import {
  extractPreviewBlocks,
  escapeJsString,
  hasPreviewBlocks,
} from "../preview-transform";
import {
  simpleHash,
  type PreviewBlockEntry,
  createPreviewHooks,
  resolveCssImportPath,
  VIRTUAL_PREFIX,
  REGISTRY_MODULE_ID,
} from "@izumisy/react-preview";

export type PreviewPlugin = Plugin & {
  blockRegistry: Map<string, PreviewBlockEntry>;
};

/**
 * Vite plugin that:
 * 1. Transforms ` ```tsx preview ` fenced code blocks in .preview.mdx files
 *    into `<PreviewBlock>` components (runs before the MDX compiler).
 * 2. Provides virtual modules for each preview block so they can be rendered
 *    in isolated shadow-DOM containers.
 * 3. Handles HMR invalidation when preview files change.
 * 4. In build mode, scans preview files upfront to populate the block registry.
 */
export function previewPlugin(
  resolveFiles: () => Promise<string[]>,
  options?: { css?: string; hostRoot?: string },
): PreviewPlugin {
  const blockRegistry = new Map<string, PreviewBlockEntry>();
  let devServer: ViteDevServer | null = null;

  // Resolve CSS path for shadow DOM injection
  const cssImport = options?.css
    ? resolveCssImportPath(options.css, options.hostRoot)
    : undefined;

  const hooks = createPreviewHooks({
    blockRegistry,
    cssImport,
  });

  return {
    name: "markstage-preview",
    enforce: "pre",
    blockRegistry,

    resolveId: hooks.resolveId,
    load: hooks.load,

    async transform(code, id) {
      // Delegate JSX compilation for virtual modules
      const virtualResult = await hooks.transform(code, id);
      if (virtualResult) return virtualResult;

      if (!id.endsWith(".md")) return;

      // Transform ```tsx preview blocks in MDX source into <PreviewBlock> components
      let transformed: string | undefined;
      if (hasPreviewBlocks(code)) {
        const blocks = extractPreviewBlocks(code);
        transformed = code;
        // Replace in reverse order to preserve positions
        for (let i = blocks.length - 1; i >= 0; i--) {
          const block = blocks[i];
          const blockId = simpleHash(`${id}:${i}`);
          const escaped = escapeJsString(block.code);

          const isStandalone = block.meta.standalone === "true";

          // Register block for virtual module resolution
          blockRegistry.set(blockId, {
            code: block.code,
            sourceFile: id,
            wrap: block.meta.wrap,
            height: block.meta.height,
            standalone: isStandalone,
          });

          const heightProp = block.meta.height
            ? ` height={"${block.meta.height}"}`
            : "";
          const wrapProp = block.meta.wrap
            ? ` wrap={"${block.meta.wrap}"}`
            : "";
          const alignProp = block.meta.align
            ? ` align={"${block.meta.align}"}`
            : "";
          const standaloneProp = isStandalone ? ` standalone={true}` : "";
          const replacement = `<PreviewBlock code={"${escaped}"} blockId={"${blockId}"}${heightProp}${wrapProp}${alignProp}${standaloneProp} />`;
          transformed =
            transformed.slice(0, block.start) +
            replacement +
            transformed.slice(block.end);
        }
      }

      // Invalidate cached virtual modules so HMR picks up new code
      if (devServer) {
        for (const [blockId, entry] of blockRegistry) {
          if (entry.sourceFile === id) {
            const mod = devServer.moduleGraph.getModuleById(
              "\0" + VIRTUAL_PREFIX + blockId + ".tsx",
            );
            if (mod) {
              devServer.moduleGraph.invalidateModule(mod);
            }
          }
        }
        // Also invalidate the registry so new/removed blocks are picked up
        const registryMod = devServer.moduleGraph.getModuleById(
          "\0" + REGISTRY_MODULE_ID,
        );
        if (registryMod) {
          devServer.moduleGraph.invalidateModule(registryMod);
        }
      }

      if (transformed) return { code: transformed, map: null };
    },

    configureServer(server: ViteDevServer) {
      devServer = server;

      // Serve standalone preview pages at /__preview/:blockId
      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/^\/__preview\/([a-f0-9]+)(\?.*)?$/);
        if (!match) return next();

        const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/standalone-preview.tsx"></script>
  </body>
</html>`;

        server
          .transformIndexHtml(req.url!, html)
          .then((transformed) => {
            res.setHeader("Content-Type", "text/html");
            res.end(transformed);
          })
          .catch(next);
      });
    },

    // Build mode: scan preview files upfront to populate the block registry
    // before the registry virtual module is loaded.
    async buildStart() {
      const { readFile } = await import("node:fs/promises");
      const files = await resolveFiles();

      for (const file of files) {
        const content = await readFile(file, "utf-8");
        const blocks = extractPreviewBlocks(content);
        if (blocks.length === 0) continue;

        for (let i = 0; i < blocks.length; i++) {
          const blockId = simpleHash(`${file}:${i}`);
          blockRegistry.set(blockId, {
            code: blocks[i].code,
            sourceFile: file,
            wrap: blocks[i].meta.wrap,
            height: blocks[i].meta.height,
          });
        }
      }
    },
  };
}
