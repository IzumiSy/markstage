import type { Plugin, ViteDevServer, ResolvedConfig } from "vite";
import { blockRegistry } from "./previewer-code";
import { simpleHash } from "@izumisy/react-preview";
import { extractPreviewBlocks } from "../preview-transform";
import {
  createIframeHooks,
  generateIframeHtml,
  VIRTUAL_PREFIX,
} from "@izumisy/react-preview";

/**
 * Vite plugin that renders each preview block in an isolated iframe.
 *
 * - Dev: serves iframe HTML via middleware at /__markstage_preview/:blockId
 * - Build: scans preview files, emits per-block JS chunks + HTML files
 *   so the result works on static hosting (e.g. GitHub Pages).
 */
export function previewerIframePlugin(
  resolveFiles: () => Promise<string[]>,
): Plugin {
  let resolvedConfig: ResolvedConfig;
  const chunkRefIds = new Map<string, string>();
  let devServer: ViteDevServer | null = null;

  const hooks = createIframeHooks({
    blockRegistry,
    cssImport: "virtual:previewer-css",
  });

  return {
    name: "previewer-iframe",
    enforce: "pre",

    configResolved(config) {
      resolvedConfig = config;
    },

    resolveId: hooks.resolveId,
    load: hooks.load,

    async transform(code, id) {
      // Delegate JSX compilation for virtual modules to shared hooks
      const result = await hooks.transform(code, id);
      if (result) return result;

      // After previewCodePlugin updates the registry for MDX files,
      // invalidate cached virtual modules so HMR picks up new code.
      if (devServer && id.endsWith(".preview.mdx")) {
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
      }
    },

    configureServer(server: ViteDevServer) {
      devServer = server;
      hooks.configureServer(server);
    },

    // Build mode: scan preview files upfront and emit chunk entry points
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

          const refId = this.emitFile({
            type: "chunk",
            id: VIRTUAL_PREFIX + blockId,
            name: `__preview_${blockId}`,
          });
          chunkRefIds.set(blockId, refId);
        }
      }
    },

    // Build mode: emit HTML files that reference the built chunks
    generateBundle(_, bundle) {
      const base = resolvedConfig.base || "/";

      // Recursively collect CSS from a chunk and all its imported chunks
      function collectCss(fileName: string, seen: Set<string>): string[] {
        if (seen.has(fileName)) return [];
        seen.add(fileName);
        const result: string[] = [];
        const c = bundle[fileName];
        if (c?.type !== "chunk") return result;
        const meta = (c as unknown as Record<string, unknown>).viteMetadata as
          | { importedCss?: Set<string> }
          | undefined;
        if (meta?.importedCss) {
          for (const css of meta.importedCss) {
            if (!result.includes(css)) result.push(css);
          }
        }
        for (const imp of c.imports) {
          for (const css of collectCss(imp, seen)) {
            if (!result.includes(css)) result.push(css);
          }
        }
        return result;
      }

      for (const [blockId, refId] of chunkRefIds) {
        const chunkFileName = this.getFileName(refId);

        // Collect CSS files from this chunk and all transitive dependencies
        const cssFiles = collectCss(chunkFileName, new Set());

        const entry = blockRegistry.get(blockId);

        const html = generateIframeHtml({
          blockId,
          wrap: entry?.wrap,
          scriptSrc: `${base}${chunkFileName}`,
          cssLinks: cssFiles.map((f) => `${base}${f}`),
        });

        this.emitFile({
          type: "asset",
          fileName: `__markstage_preview/${blockId}.html`,
          source: html,
        });
      }
    },
  };
}
