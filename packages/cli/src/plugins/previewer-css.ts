import { resolve } from "node:path";
import type { Plugin } from "vite";

/**
 * Virtual module `virtual:previewer-css` — imports the host project's
 * CSS file if configured, or exports nothing.
 */
export function previewerCssPlugin(hostRoot: string, css?: string): Plugin {
  const MODULE_ID = "virtual:previewer-css";
  // Suffix with .css so Vite routes this through its CSS pipeline instead
  // of serving it as a JS module.
  const RESOLVED_ID = "\0" + MODULE_ID + ".css";

  return {
    name: "previewer-css",

    resolveId(id) {
      if (id === MODULE_ID) return RESOLVED_ID;
    },

    load(id) {
      if (id !== RESOLVED_ID) return;
      if (!css) return "";

      const cssPath = resolve(hostRoot, css);
      return `@import ${JSON.stringify(cssPath)};`;
    },
  };
}
