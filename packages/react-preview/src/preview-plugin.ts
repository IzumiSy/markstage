import type { Plugin } from "vite";
import { transformWithEsbuild } from "vite";
import type { PreviewBlockEntry } from "./preview-utils";
import {
  VIRTUAL_PREFIX,
  REGISTRY_MODULE_ID,
  generatePreviewModuleCode,
} from "./preview-module";

export interface PreviewPluginOptions {
  blockRegistry: Map<string, PreviewBlockEntry>;
  /** CSS file to import in preview blocks (e.g. "@my-lib/styles") */
  cssImport?: string;
}

const RESOLVED_REGISTRY_ID = "\0" + REGISTRY_MODULE_ID;

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

    if (id === REGISTRY_MODULE_ID) {
      return RESOLVED_REGISTRY_ID;
    }

    // Handle both "virtual:markstage-preview-xxx" (from JS imports) and
    // "/virtual:markstage-preview-xxx" (from URL requests)
    const cleanId = id.startsWith("/") ? id.slice(1) : id;
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

    if (!id.startsWith("\0" + VIRTUAL_PREFIX)) return;

    const blockId = id
      .slice(("\0" + VIRTUAL_PREFIX).length)
      .replace(/\.tsx$/, "");
    const entry = blockRegistry.get(blockId);
    if (!entry) return;

    return generatePreviewModuleCode(blockId, entry, cssImport);
  }

  async function transform(code: string, id: string) {
    if (id === RESOLVED_REGISTRY_ID) return; // registry is plain JS, no JSX
    if (id.startsWith("\0" + VIRTUAL_PREFIX)) {
      return transformWithEsbuild(code, id.slice(1), { jsx: "automatic" });
    }
  }

  return { resolveId, load, transform };
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
