import type { Plugin } from "vite";
import type { PreviewerRepo } from "../config";

/**
 * Virtual module `virtual:previewer-config` — exposes the resolved
 * repo configuration so the app can render source links.
 */
export function previewerConfigPlugin(title: string, repo?: PreviewerRepo): Plugin {
  const MODULE_ID = "virtual:previewer-config";
  const RESOLVED_ID = "\0" + MODULE_ID;

  return {
    name: "previewer-config",

    resolveId(id) {
      if (id === MODULE_ID) return RESOLVED_ID;
    },

    load(id) {
      if (id !== RESOLVED_ID) return;

      const lines: string[] = [];

      lines.push(`export const title = ${JSON.stringify(title)};`);

      if (repo) {
        // Strip trailing slash from URL
        const normalizedUrl = repo.url.replace(/\/+$/, "");
        const ref = repo.ref ?? "main";
        lines.push(`export const repo = ${JSON.stringify({ url: normalizedUrl, ref })};`);
      } else {
        lines.push("export const repo = null;");
      }

      return lines.join("\n");
    },
  };
}
