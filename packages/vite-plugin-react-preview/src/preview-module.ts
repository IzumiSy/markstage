import type { PreviewBlockEntry } from "./preview-utils";

export const VIRTUAL_PREFIX = "virtual:mrp-preview-";
export const REGISTRY_MODULE_ID = "virtual:mrp-preview-registry";
export const STANDALONE_CLIENT_MODULE_ID = "virtual:mrp-standalone-client";

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
 * Generate the standalone preview HTML page shell.
 *
 * Used by both dev-server middleware and production build to produce the
 * `__preview/:blockId` pages. The `scriptSrc` parameter is the path to the
 * standalone client entry (virtual module ID in dev, hashed filename in build).
 */
export function generateStandaloneHtml(scriptSrc: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
    <style>html,body{background-color:#fff}html.dark,html.dark body{background-color:#1a1a1a}</style>
    <script>!function(){var t=new URLSearchParams(location.search).get("theme");if(t==="dark"||t==="light"){document.documentElement.style.colorScheme=t;document.documentElement.setAttribute("data-theme",t);document.documentElement.classList.add(t)}}()</script>
  </head>
  <body style="margin:0">
    <div id="root" style="display:flex;justify-content:center;align-items:center;min-height:100vh;padding:24px"></div>
    <script type="module" src="/${scriptSrc}"></script>
  </body>
</html>`;
}

/**
 * Generate the virtual module code for a preview block.
 *
 * The module exports a React component as default and the CSS string as `css`.
 * The host component (e.g. PreviewBlock) is responsible for mounting the
 * component into an iframe container and injecting the CSS.
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
      `import __mrp_css from ${JSON.stringify(cssImport + "?inline")};`,
      `export const css = __mrp_css;`,
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
