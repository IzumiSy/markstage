import { describe, it, expect } from "vitest";
import { generateIframeHtml, generatePreviewModuleCode } from "./iframe-html";

describe("generateIframeHtml", () => {
  it("generates basic HTML with script src", () => {
    const html = generateIframeHtml({
      blockId: "abc123",
      scriptSrc: "/virtual:markstage-preview-abc123",
    });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain(
      '<script type="module" src="/virtual:markstage-preview-abc123">',
    );
    expect(html).toContain('<div id="root"></div>');
  });

  it("applies wrap=row style to root div", () => {
    const html = generateIframeHtml({
      blockId: "abc123",
      wrap: "row",
      scriptSrc: "/test.js",
    });
    expect(html).toContain(
      'style="display:flex;flex-wrap:wrap;gap:8px;align-items:center"',
    );
  });

  it("applies wrap=column style to root div", () => {
    const html = generateIframeHtml({
      blockId: "abc123",
      wrap: "column",
      scriptSrc: "/test.js",
    });
    expect(html).toContain(
      'style="display:flex;flex-direction:column;gap:8px"',
    );
  });

  it("does not apply style for unknown wrap value", () => {
    const html = generateIframeHtml({
      blockId: "abc123",
      wrap: "unknown",
      scriptSrc: "/test.js",
    });
    expect(html).toContain('<div id="root"></div>');
  });

  it("includes CSS link tags", () => {
    const html = generateIframeHtml({
      blockId: "abc123",
      scriptSrc: "/test.js",
      cssLinks: ["/assets/style1.css", "/assets/style2.css"],
    });
    expect(html).toContain('<link rel="stylesheet" href="/assets/style1.css">');
    expect(html).toContain('<link rel="stylesheet" href="/assets/style2.css">');
  });

  it("generates valid HTML without cssLinks", () => {
    const html = generateIframeHtml({
      blockId: "abc123",
      scriptSrc: "/test.js",
    });
    expect(html).not.toContain("<link");
  });
});

describe("generatePreviewModuleCode", () => {
  it("generates code with createRoot and ResizeObserver", () => {
    const code = generatePreviewModuleCode("abc123", {
      code: "<Button>Click</Button>",
      sourceFile: "/src/Button.preview.mdx",
    });
    expect(code).toContain('import { createRoot } from "react-dom/client"');
    expect(code).toContain("function Preview()");
    expect(code).toContain("<Button>Click</Button>");
    expect(code).toContain("createRoot");
    expect(code).toContain("ResizeObserver");
    expect(code).toContain('"markstage-resize"');
    expect(code).toContain('"abc123"');
  });

  it("separates import statements from body", () => {
    const code = generatePreviewModuleCode("abc123", {
      code: 'import { Button } from "./Button"\n<Button>Click</Button>',
      sourceFile: "/src/test.mdx",
    });
    const lines = code.split("\n");
    const createRootIdx = lines.findIndex((l) => l.includes("createRoot"));
    const buttonImportIdx = lines.findIndex((l) => l.includes("./Button"));
    const previewIdx = lines.findIndex((l) => l.includes("function Preview"));
    // imports should come before the Preview function
    expect(createRootIdx).toBeLessThan(previewIdx);
    expect(buttonImportIdx).toBeLessThan(previewIdx);
  });

  it("includes CSS import when provided", () => {
    const code = generatePreviewModuleCode(
      "abc123",
      { code: "<div />", sourceFile: "/test.mdx" },
      "virtual:previewer-css",
    );
    expect(code).toContain('import "virtual:previewer-css"');
  });

  it("does not include CSS import when not provided", () => {
    const code = generatePreviewModuleCode("abc123", {
      code: "<div />",
      sourceFile: "/test.mdx",
    });
    expect(code).not.toContain("virtual:previewer-css");
  });
});
