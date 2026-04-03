import { describe, it, expect } from "vitest";
import {
  generatePreviewModuleCode,
  generateStandaloneHtml,
} from "./preview-module";

describe("generatePreviewModuleCode", () => {
  it("exports a default Preview component", () => {
    const code = generatePreviewModuleCode("abc123", {
      code: "<Button>Click</Button>",
      sourceFile: "/src/Button.preview.mdx",
    });
    expect(code).toContain("export default function Preview()");
    expect(code).toContain("<Button>Click</Button>");
  });

  it("does not include createRoot or ResizeObserver", () => {
    const code = generatePreviewModuleCode("abc123", {
      code: "<Button>Click</Button>",
      sourceFile: "/src/Button.preview.mdx",
    });
    expect(code).not.toContain("createRoot");
    expect(code).not.toContain("ResizeObserver");
    expect(code).not.toContain("postMessage");
  });

  it("exports css as empty string when no CSS import", () => {
    const code = generatePreviewModuleCode("abc123", {
      code: "<div />",
      sourceFile: "/test.mdx",
    });
    expect(code).toContain('export const css = ""');
  });

  it("separates import statements from body", () => {
    const code = generatePreviewModuleCode("abc123", {
      code: 'import { Button } from "./Button"\n<Button>Click</Button>',
      sourceFile: "/src/test.mdx",
    });
    const lines = code.split("\n");
    const buttonImportIdx = lines.findIndex((l) => l.includes("./Button"));
    const previewIdx = lines.findIndex((l) =>
      l.includes("export default function Preview"),
    );
    expect(buttonImportIdx).toBeLessThan(previewIdx);
  });

  it("imports CSS with ?inline and exports as css", () => {
    const code = generatePreviewModuleCode(
      "abc123",
      { code: "<div />", sourceFile: "/test.mdx" },
      "@scope/package/styles",
    );
    expect(code).toContain(
      'import __mrp_css from "@scope/package/styles?inline"',
    );
    expect(code).toContain("export const css = __mrp_css");
  });

  it("handles any CSS path with ?inline", () => {
    const code = generatePreviewModuleCode(
      "abc123",
      { code: "<div />", sourceFile: "/test.mdx" },
      "/abs/path/to/styles.css",
    );
    expect(code).toContain(
      'import __mrp_css from "/abs/path/to/styles.css?inline"',
    );
    expect(code).toContain("export const css = __mrp_css");
  });
});

describe("generateStandaloneHtml", () => {
  it("produces valid HTML with doctype", () => {
    const html = generateStandaloneHtml("assets/client.js");
    expect(html).toMatch(/^<!doctype html>/);
    expect(html).toContain("</html>");
  });

  it("includes a script tag with the given src", () => {
    const html = generateStandaloneHtml("assets/standalone-abc123.js");
    expect(html).toContain(
      '<script type="module" src="/assets/standalone-abc123.js"></script>',
    );
  });

  it("includes the #root container div", () => {
    const html = generateStandaloneHtml("client.js");
    expect(html).toContain('id="root"');
  });

  it("includes an inline theme initialization script", () => {
    const html = generateStandaloneHtml("client.js");
    expect(html).toContain("data-theme");
    expect(html).toContain("colorScheme");
  });
});
