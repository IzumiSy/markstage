import type { Plugin, ViteDevServer } from "vite";
import { transformWithEsbuild } from "vite";
import type { PreviewBlockEntry } from "./preview-registry";

export type { PreviewBlockEntry } from "./preview-registry";

export const VIRTUAL_PREFIX = "virtual:markstage-preview-";
export const PREVIEW_ROUTE = "/__markstage_preview/";

export const WRAP_STYLES: Record<string, string> = {
  row: "display:flex;flex-wrap:wrap;gap:8px;align-items:center",
  column: "display:flex;flex-direction:column;gap:8px",
};

/**
 * Generate the HTML page for an iframe preview.
 */
export function generateIframeHtml(options: {
  blockId: string;
  wrap?: string;
  scriptSrc: string;
  cssLinks?: string[];
}): string {
  const rootStyle =
    options.wrap && WRAP_STYLES[options.wrap]
      ? ` style="${WRAP_STYLES[options.wrap]}"`
      : "";

  const cssLinkTags =
    options.cssLinks
      ?.map((f) => `  <link rel="stylesheet" href="${f}">`)
      .join("\n") ?? "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
${cssLinkTags}
  <style>html, body { margin: 0; padding: 16px; background: transparent; }</style>
</head>
<body>
  <div id="root"${rootStyle}></div>
  <script type="module" src="${options.scriptSrc}"></script>
</body>
</html>`;
}

/**
 * Generate the virtual module code for a preview block.
 */
export function generatePreviewModuleCode(
  blockId: string,
  entry: PreviewBlockEntry,
  cssImport?: string,
): string {
  const lines = entry.code.split("\n");
  const blockImports: string[] = [];
  const bodyLines: string[] = [];
  for (const line of lines) {
    if (line.trimStart().startsWith("import ")) {
      blockImports.push(line);
    } else {
      bodyLines.push(line);
    }
  }
  const body = bodyLines.join("\n").trim();

  return [
    `import { createRoot } from "react-dom/client";`,
    ...(cssImport ? [`import ${JSON.stringify(cssImport)};`] : []),
    ...blockImports,
    `function Preview() { return <>${body}</>; }`,
    `createRoot(document.getElementById("root")).render(<Preview />);`,
    `new ResizeObserver(() => {`,
    `  window.parent.postMessage({ type: "markstage-resize", blockId: ${JSON.stringify(blockId)}, height: document.documentElement.scrollHeight }, "*");`,
    `}).observe(document.body);`,
  ].join("\n");
}

export interface IframePluginOptions {
  blockRegistry: Map<string, PreviewBlockEntry>;
  /** CSS module to import in preview iframes (e.g. "virtual:previewer-css" or "@my-lib/styles") */
  cssImport?: string;
}

/**
 * Create the common iframe hook functions for virtual module resolution,
 * code generation, JSX compilation, and dev server middleware.
 *
 * Shared between the standalone CLI previewer and the VitePress plugin.
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
 */
export function createBaseIframePlugin(
  name: string,
  options: IframePluginOptions,
): Plugin {
  const hooks = createIframeHooks(options);
  return {
    name,
    enforce: "pre",
    resolveId: hooks.resolveId,
    load: hooks.load,
    transform: hooks.transform,
    configureServer: hooks.configureServer,
  } as Plugin;
}
