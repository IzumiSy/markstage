import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";
import { transformWithEsbuild } from "vite";
import type { PreviewBlockEntry } from "./preview-utils";
import {
  VIRTUAL_PREFIX,
  REGISTRY_MODULE_ID,
  STANDALONE_CLIENT_MODULE_ID,
  WRAP_STYLES,
  ALIGN_STYLES,
  generatePreviewModuleCode,
} from "./preview-module";

export interface PreviewPluginOptions {
  blockRegistry: Map<string, PreviewBlockEntry>;
  /** CSS file to import in preview blocks (e.g. "@my-lib/styles") */
  cssImport?: string;
  /**
   * When true, skip the configureServer middleware for standalone preview
   * pages (the consumer provides its own). Defaults to false.
   */
  skipStandaloneServer?: boolean;
}

const RESOLVED_REGISTRY_ID = "\0" + REGISTRY_MODULE_ID;
const RESOLVED_STANDALONE_CLIENT_ID = "\0" + STANDALONE_CLIENT_MODULE_ID;

/**
 * Create the common preview hook functions for virtual module resolution,
 * code generation, and JSX compilation.
 *
 * Shared between the standalone CLI previewer and framework-specific plugins.
 */
export function createPreviewHooks(options: PreviewPluginOptions) {
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

    // Strip leading "/" so URL requests (e.g. from <script src="/virtual:...">)
    // match the same way as JS imports.
    const cleanId = id.startsWith("/") ? id.slice(1) : id;

    if (cleanId === REGISTRY_MODULE_ID) {
      return RESOLVED_REGISTRY_ID;
    }

    if (cleanId === STANDALONE_CLIENT_MODULE_ID) {
      return RESOLVED_STANDALONE_CLIENT_ID;
    }

    if (cleanId.startsWith(VIRTUAL_PREFIX)) {
      return "\0" + cleanId + ".tsx";
    }

    return null;
  }

  function load(id: string) {
    if (id === RESOLVED_REGISTRY_ID) {
      const entries = [...blockRegistry.keys()];
      const imports = entries.map(
        (blockId) =>
          `  ${JSON.stringify(blockId)}: () => import(${JSON.stringify(VIRTUAL_PREFIX + blockId)})`,
      );
      return `export const registry = {\n${imports.join(",\n")}\n};\n`;
    }

    if (id === RESOLVED_STANDALONE_CLIENT_ID) {
      return generateStandaloneClientCode();
    }

    if (!id.startsWith("\0" + VIRTUAL_PREFIX)) return;

    const blockId = id
      .slice(("\0" + VIRTUAL_PREFIX).length)
      .replace(/\.tsx$/, "");
    const entry = blockRegistry.get(blockId);
    if (!entry) return;

    return generatePreviewModuleCode(blockId, entry, cssImport);
  }

  async function transform(code: string, id: string) {
    if (id === RESOLVED_REGISTRY_ID || id === RESOLVED_STANDALONE_CLIENT_ID)
      return;
    if (id.startsWith("\0" + VIRTUAL_PREFIX)) {
      return transformWithEsbuild(code, id.slice(1), { jsx: "automatic" });
    }
  }

  return { resolveId, load, transform };
}

function generateStandaloneClientCode(): string {
  return `\
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { registry } from ${JSON.stringify(REGISTRY_MODULE_ID)};

var WRAP_STYLES = ${JSON.stringify(WRAP_STYLES)};
var ALIGN_STYLES = ${JSON.stringify(ALIGN_STYLES)};

var blockId = location.pathname.split("/").pop().replace(/\\.html$/, "");
var params = new URLSearchParams(location.search);

var themeParam = params.get("theme");
if (themeParam === "dark" || themeParam === "light") {
  document.documentElement.setAttribute("data-theme", themeParam);
  document.documentElement.classList.add(themeParam);
}

var wrapParam = params.get("wrap");
var alignParam = params.get("align");
var root = document.getElementById("root");
if (wrapParam && WRAP_STYLES[wrapParam]) root.style.cssText += ";" + WRAP_STYLES[wrapParam];
if (alignParam && ALIGN_STYLES[alignParam]) root.style.cssText += ";" + ALIGN_STYLES[alignParam];

registry[blockId]().then(function(mod) {
  if (mod.css) {
    var style = document.createElement("style");
    style.textContent = mod.css;
    document.head.appendChild(style);
  }
  createRoot(root).render(createElement(mod.default));

  new ResizeObserver(function() {
    window.parent.postMessage(
      { type: "markstage-resize", blockId: blockId, height: root.scrollHeight },
      "*"
    );
  }).observe(root);
});
`;
}

/**
 * Create a complete preview Vite plugin from the common hooks.
 * Suitable for consumers that don't need to extend the plugin (e.g. VitePress).
 */
export function createBasePreviewPlugin(
  name: string,
  options: PreviewPluginOptions,
): Plugin[] {
  const hooks = createPreviewHooks(options);
  let isSsrBuild = false;

  return [
    {
      name,
      enforce: "pre",
      configResolved(config) {
        isSsrBuild = !!config.build?.ssr;
      },
      resolveId: hooks.resolveId,
      load(id) {
        // During SSR, return stubs to avoid processing React components server-side
        if (isSsrBuild) {
          if (id === RESOLVED_REGISTRY_ID) {
            return `export const registry = {};`;
          }
          if (id.startsWith("\0" + VIRTUAL_PREFIX)) {
            return `export const css = ""; export default function Preview() { return null; }`;
          }
        }
        return hooks.load(id);
      },
      transform: hooks.transform,
      configureServer(server: ViteDevServer) {
        if (options.skipStandaloneServer) return;

        const standaloneHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
  </head>
  <body style="margin:0">
    <div id="root" style="display:flex;justify-content:center;align-items:center;min-height:100vh;padding:24px;background:#ffffff"></div>
    <script type="module" src="/${STANDALONE_CLIENT_MODULE_ID}"></script>
  </body>
</html>`;

        // Serve standalone preview pages at /__preview/:blockId
        server.middlewares.use((req, res, next) => {
          const match = req.url?.match(/^\/__preview\/([a-f0-9]+)(\?.*)?$/);
          if (!match) return next();

          // Invalidate the cached registry so it reflects the latest
          // blockRegistry contents (blocks may have been registered lazily
          // by a markdown-it plugin after the module was first loaded).
          const registryMod =
            server.moduleGraph.getModuleById(RESOLVED_REGISTRY_ID);
          if (registryMod) {
            server.moduleGraph.invalidateModule(registryMod);
          }

          server
            .transformIndexHtml(req.url!, standaloneHtml)
            .then((transformed) => {
              res.setHeader("Content-Type", "text/html");
              res.end(transformed);
            })
            .catch(next);
        });
      },
      config() {
        return {
          // Dedupe React so imports from plugin source files (e.g. PreviewBlock.vue
          // in vitepress-plugin) resolve to the consumer project's React copy.
          resolve: {
            dedupe: ["react", "react-dom"],
          },
          build: {
            rollupOptions: {
              onwarn(warning, defaultHandler) {
                // React component libraries (e.g. @base-ui/react) use "use client"
                // directives for Server Components support. Rollup does not recognise
                // these directives and emits MODULE_LEVEL_DIRECTIVE warnings for every
                // file that contains one. The warnings are harmless because preview
                // blocks run entirely on the client side, so we suppress them here.
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
          // During SSR builds (e.g. VitePress), externalize React so Rollup
          // doesn't attempt to bundle it from Vue components that dynamically
          // import it only on the client side.
          ssr: {
            external: [
              "react",
              "react-dom",
              "react-dom/client",
              "react/jsx-runtime",
            ],
          },
        };
      },
    } as Plugin,
  ];
}

export interface PreviewBuildPluginOptions {
  blockRegistry: Map<string, PreviewBlockEntry>;
  /**
   * Called during `buildStart` to pre-populate the blockRegistry before
   * Rollup loads any modules. This is critical for frameworks like VitePress
   * where blocks are normally registered lazily during the transform phase
   * — too late for the registry virtual module to include them.
   */
  scanBlocks?: (root: string) => void | Promise<void>;
}

/**
 * Vite plugin that generates standalone preview HTML pages during build.
 *
 * Each preview block gets its own HTML page at `__preview/{blockId}.html`.
 * Use alongside `createBasePreviewPlugin` for consumers like VitePress that
 * need static preview pages in production.
 */
export function createPreviewBuildPlugin(
  options: PreviewBuildPluginOptions,
): Plugin {
  const { blockRegistry } = options;
  let resolvedConfig: ResolvedConfig;
  let isSsrBuild = false;
  let standaloneChunkRefId: string | undefined;

  return {
    name: "markstage-preview-build",

    configResolved(config) {
      resolvedConfig = config;
      isSsrBuild = !!config.build?.ssr;
    },

    async buildStart() {
      if (isSsrBuild || resolvedConfig.command === "serve") return;
      if (options.scanBlocks) {
        await options.scanBlocks(resolvedConfig.root);
      }
      standaloneChunkRefId = this.emitFile({
        type: "chunk",
        id: STANDALONE_CLIENT_MODULE_ID,
        name: "markstage-standalone-preview",
      });
    },

    async generateBundle(_options, _bundle) {
      if (isSsrBuild || !standaloneChunkRefId) return;

      const blockIds = [...blockRegistry.keys()];
      if (blockIds.length === 0) return;

      const standaloneFileName = this.getFileName(standaloneChunkRefId);

      for (const blockId of blockIds) {
        const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
  </head>
  <body style="margin:0">
    <div id="root" style="display:flex;justify-content:center;align-items:center;min-height:100vh;padding:24px;background:#ffffff"></div>
    <script type="module" src="/${standaloneFileName}"></script>
  </body>
</html>`;

        this.emitFile({
          type: "asset",
          fileName: `__preview/${blockId}.html`,
          source: html,
        });
      }
    },
  };
}
