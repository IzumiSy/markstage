import type { PreviewBlockEntry } from "./preview-utils";

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
  <style>html, body { margin: 0; padding: 16px; background: transparent; overflow: hidden; }</style>
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

  // Virtual CSS modules (e.g. "virtual:previewer-css") don't support the
  // ?inline query. Use ?inline only for real CSS files (package specifiers)
  // so the CSS is inlined in JS rather than extracted to a separate file.
  // This avoids polluting iframes with unrelated CSS when cssCodeSplit is
  // disabled (e.g. VitePress merges all CSS into a single file).
  const cssLines: string[] = [];
  if (cssImport) {
    if (cssImport.startsWith("virtual:")) {
      cssLines.push(`import ${JSON.stringify(cssImport)};`);
    } else {
      cssLines.push(
        `import __markstage_css from ${JSON.stringify(cssImport + "?inline")};`,
        `{ const s = document.createElement("style"); s.textContent = __markstage_css; document.head.appendChild(s); }`,
      );
    }
  }

  return [
    `import { createRoot } from "react-dom/client";`,
    ...cssLines,
    ...blockImports,
    `function Preview() { return <>${body}</>; }`,
    `const __markstage_root = document.getElementById("root");`,
    `createRoot(__markstage_root).render(<Preview />);`,
    `new ResizeObserver(() => {`,
    `  window.parent.postMessage({ type: "markstage-resize", blockId: ${JSON.stringify(blockId)}, height: document.documentElement.scrollHeight }, "*");`,
    `}).observe(__markstage_root);`,
  ].join("\n");
}
