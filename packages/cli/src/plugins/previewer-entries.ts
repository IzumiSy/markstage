import { basename, relative } from "node:path";
import type { Plugin } from "vite";

/**
 * Virtual module `virtual:previewer-entries` — exports all discovered
 * *.preview.mdx files as an array of { name, Component } objects.
 */
export function previewerEntriesPlugin(hostRoot: string, glob: string): Plugin {
  const MODULE_ID = "virtual:previewer-entries";
  const RESOLVED_ID = "\0" + MODULE_ID;

  return {
    name: "previewer-entries",

    resolveId(id) {
      if (id === MODULE_ID) return RESOLVED_ID;
    },

    async load(id) {
      if (id !== RESOLVED_ID) return;

      const fg = await import("fast-glob");
      const files = await fg.default(glob, {
        cwd: hostRoot,
        absolute: true,
      });

      const entries = await Promise.all(
        files.map(async (file, i) => {
          return {
            varName: `Mod${i}`,
            name: basename(file).replace(/\.preview\.mdx$/, ""),
            file,
            filePath: relative(hostRoot, file),
          };
        }),
      );

      return [
        ...entries.map(
          (e) =>
            `import ${e.varName}, { frontmatter as ${e.varName}Fm } from ${JSON.stringify(e.file)};`,
        ),
        "",
        "export const entries = [",
        ...entries.map(
          (e) =>
            `  { name: ${JSON.stringify(e.name)}, Component: ${e.varName}, frontmatter: ${e.varName}Fm ?? {}, filePath: ${JSON.stringify(e.filePath)} },`,
        ),
        "];",
      ].join("\n");
    },
  };
}
