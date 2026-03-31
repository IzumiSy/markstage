import { describe, it, expect } from "vitest";
import { generatePreviewModuleCode } from "./preview-module";

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
      "@tailor-platform/app-shell/styles",
    );
    expect(code).toContain(
      'import __markstage_css from "@tailor-platform/app-shell/styles?inline"',
    );
    expect(code).toContain("export const css = __markstage_css");
  });

  it("handles any CSS path with ?inline", () => {
    const code = generatePreviewModuleCode(
      "abc123",
      { code: "<div />", sourceFile: "/test.mdx" },
      "/abs/path/to/styles.css",
    );
    expect(code).toContain(
      'import __markstage_css from "/abs/path/to/styles.css?inline"',
    );
    expect(code).toContain("export const css = __markstage_css");
  });
});
