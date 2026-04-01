import type { PreviewBlockEntry } from "./preview-utils";

export const VIRTUAL_PREFIX = "virtual:markstage-preview-";
export const REGISTRY_MODULE_ID = "virtual:markstage-preview-registry";

export const WRAP_STYLES: Record<string, string> = {
  row: "flex-wrap:wrap;gap:8px",
  column: "flex-direction:column;gap:8px",
};

export const ALIGN_STYLES: Record<string, string> = {
  center: "justify-content:center;align-items:center",
  start: "justify-content:center;align-items:flex-start",
  end: "justify-content:center;align-items:flex-end",
};

/**
 * Generate the virtual module code for a preview block.
 *
 * The module exports a React component as default and the CSS string as `css`.
 * The host component (e.g. PreviewBlock) is responsible for mounting the
 * component into a shadow DOM container and injecting the CSS.
 */
export function generatePreviewModuleCode(
  _blockId: string,
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

  const cssLines: string[] = [];
  if (cssImport) {
    cssLines.push(
      `import __markstage_css from ${JSON.stringify(cssImport + "?inline")};`,
      `export const css = __markstage_css;`,
    );
  } else {
    cssLines.push(`export const css = "";`);
  }

  return [
    ...cssLines,
    ...blockImports,
    `export default function Preview() { return <>${body}</>; }`,
  ].join("\n");
}
