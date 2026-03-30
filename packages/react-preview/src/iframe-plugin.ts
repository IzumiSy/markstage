import type { Plugin, ViteDevServer, ResolvedConfig } from "vite";
import { transformWithEsbuild } from "vite";
import type { PreviewBlockEntry } from "./preview-utils";
import {
  VIRTUAL_PREFIX,
  PREVIEW_ROUTE,
  generateIframeHtml,
  generatePreviewModuleCode,
} from "./iframe-html";

export interface IframePluginOptions {
  blockRegistry: Map<string, PreviewBlockEntry>;
  /** CSS module to import in preview iframes (e.g. "virtual:previewer-css" or "@my-lib/styles") */
  cssImport?: string;
}

/**
 * Create the common iframe hook functions for virtual module resolution,
 * code generation, JSX compilation, and dev server middleware.
 *
 * Shared between the standalone CLI previewer and framework-specific plugins.
 */
export function createIframeHooks(options: IframePluginOptions) {
  const { blockRegistry, cssImport } = options;

  function resolveId(this: any, id: string, importer?: string) {
    if (importer?.startsWith("\0" + VIRTUAL_PREFIX)) {
      const blockId = importer
        .slice(("\0" + VIRTUAL_PREFIX).length)
        .replace(/\.tsx$/, "");
      const entry = blockRegistry.get(blockId);
      if (entry?.sourceFile) {
        return this.resolve(id, entry.sourceFile, { skipSelf: true });
      }
    }

    // Handle both "virtual:markstage-preview-xxx" (from JS imports) and
    // "/virtual:markstage-preview-xxx" (from HTML script src URL requests)
    const cleanId = id.startsWith("/") ? id.slice(1) : id;
    if (cleanId.startsWith(VIRTUAL_PREFIX)) {
      return "\0" + cleanId + ".tsx";
    }

    return null;
  }

  function load(id: string) {
    if (!id.startsWith("\0" + VIRTUAL_PREFIX)) return;

    const blockId = id
      .slice(("\0" + VIRTUAL_PREFIX).length)
      .replace(/\.tsx$/, "");
    const entry = blockRegistry.get(blockId);
    if (!entry) return;

    return generatePreviewModuleCode(blockId, entry, cssImport);
  }

  async function transform(code: string, id: string) {
    if (id.startsWith("\0" + VIRTUAL_PREFIX)) {
      return transformWithEsbuild(code, id.slice(1), { jsx: "automatic" });
    }
  }

  function configureServer(server: ViteDevServer) {
    server.middlewares.use((req, res, next) => {
      const url = req.url;
      if (!url?.startsWith(PREVIEW_ROUTE)) return next();

      const urlObj = new URL(url, "http://localhost");
      const blockId = urlObj.pathname
        .slice(PREVIEW_ROUTE.length)
        .replace(/\.html$/, "");

      const entry = blockRegistry.get(blockId);

      const html = generateIframeHtml({
        blockId,
        wrap: entry?.wrap,
        scriptSrc: `/${VIRTUAL_PREFIX}${blockId}`,
      });

      server
        .transformIndexHtml(url, html)
        .then((transformed) => {
          res.setHeader("Content-Type", "text/html");
          res.end(transformed);
        })
        .catch(next);
    });
  }

  return { resolveId, load, transform, configureServer };
}

/**
 * Create a complete iframe Vite plugin from the common hooks.
 * Suitable for consumers that don't need to extend the plugin (e.g. VitePress).
 *
 * Returns two plugins:
 * 1. `enforce: 'pre'` plugin for virtual module resolution, loading, transform, and dev server
 * 2. Build plugin that emits preview chunk entries and generates HTML files
 */
export function createBaseIframePlugin(
  name: string,
  options: IframePluginOptions,
): Plugin[] {
  const hooks = createIframeHooks(options);
  const { blockRegistry } = options;

  // Build state
  const chunkRefIds = new Map<string, string>();
  const emittedBlocks = new Set<string>();
  let resolvedConfig: ResolvedConfig;
  let isSsrBuild = false;

  return [
    {
      name,
      enforce: "pre",
      resolveId: hooks.resolveId,
      load: hooks.load,
      transform: hooks.transform,
      configureServer: hooks.configureServer,
    } as Plugin,
    {
      name: `${name}:build`,
      enforce: "post",
      config() {
        return {
          build: {
            rollupOptions: {
              onwarn(warning, defaultHandler) {
                // React component libraries (e.g. @base-ui/react) use "use client"
                // directives for Server Components support. Rollup does not recognise
                // these directives and emits MODULE_LEVEL_DIRECTIVE warnings for every
                // file that contains one. The warnings are harmless because preview
                // iframes run entirely on the client side, so we suppress them here.
                if (
                  warning.code === "MODULE_LEVEL_DIRECTIVE" &&
                  warning.message.includes('"use client"')
                ) {
                  return;
                }
                defaultHandler(warning);
              },
            },
          },
        };
      },
      configResolved(config) {
        resolvedConfig = config;
        isSsrBuild = !!config.build?.ssr;
      },
      buildStart() {
        chunkRefIds.clear();
        emittedBlocks.clear();
      },
      transform() {
        if (isSsrBuild) return;
        for (const [blockId] of blockRegistry) {
          if (!emittedBlocks.has(blockId)) {
            emittedBlocks.add(blockId);
            const refId = this.emitFile({
              type: "chunk",
              id: VIRTUAL_PREFIX + blockId,
              name: `__preview_${blockId}`,
            });
            chunkRefIds.set(blockId, refId);
          }
        }
      },
      generateBundle(_, bundle) {
        if (isSsrBuild) return;
        const base = resolvedConfig.base || "/";

        function collectCss(fileName: string, seen: Set<string>): string[] {
          if (seen.has(fileName)) return [];
          seen.add(fileName);
          const result: string[] = [];
          const c = bundle[fileName];
          if (c?.type !== "chunk") return result;
          const meta = (c as unknown as Record<string, unknown>)
            .viteMetadata as { importedCss?: Set<string> } | undefined;
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
    } as Plugin,
  ];
}
