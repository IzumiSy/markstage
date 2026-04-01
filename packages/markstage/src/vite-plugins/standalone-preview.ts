import { resolve, dirname } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { Plugin, ResolvedConfig } from "vite";
import type { PreviewPlugin } from "./preview";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(__dirname, "..", "app");

/**
 * Vite plugin that generates standalone preview HTML pages during build.
 *
 * Each preview block gets its own HTML page at `__preview/{blockId}.html`
 * which renders the component in a full page context (no shadow DOM).
 * This is useful for components that use portals (dialogs, sheets, popovers).
 */
export function standalonePreviewPlugin(
  getPreviewPlugin: () => PreviewPlugin,
): Plugin {
  let resolvedConfig: ResolvedConfig;
  let isBuild = false;

  return {
    name: "markstage-standalone-preview",

    configResolved(config) {
      resolvedConfig = config;
      isBuild = config.command === "build";
    },

    config(config, { command }) {
      if (command === "serve") return;

      // Add standalone-preview.html as an additional rollup input
      const existingInput = config.build?.rollupOptions?.input;
      const inputs: Record<string, string> =
        typeof existingInput === "string"
          ? { main: existingInput }
          : Array.isArray(existingInput)
            ? Object.fromEntries(existingInput.map((f, i) => [`input${i}`, f]))
            : { ...existingInput };

      inputs["standalone-preview"] = resolve(
        APP_DIR,
        "standalone-preview.html",
      );

      return {
        build: {
          rollupOptions: {
            input: inputs,
          },
        },
      };
    },

    async writeBundle(options, bundle) {
      if (!isBuild) return;

      const previewPlugin = getPreviewPlugin();
      const blockIds = [...previewPlugin.blockRegistry.keys()];
      if (blockIds.length === 0) return;

      const outDir = options.dir ?? resolvedConfig.build.outDir;

      // Find the standalone entry HTML in the bundle output
      let standaloneHtml: string | undefined;
      for (const [fileName, asset] of Object.entries(bundle)) {
        if (asset.type === "asset" && fileName === "standalone-preview.html") {
          standaloneHtml = asset.source as string;
          break;
        }
      }

      if (!standaloneHtml) return;

      const previewDir = resolve(outDir, "__preview");
      await mkdir(previewDir, { recursive: true });

      // Generate one HTML page per blockId — the standalone entry script
      // reads the blockId from the URL pathname at runtime.
      for (const blockId of blockIds) {
        await writeFile(resolve(previewDir, `${blockId}.html`), standaloneHtml);
      }
    },
  };
}
