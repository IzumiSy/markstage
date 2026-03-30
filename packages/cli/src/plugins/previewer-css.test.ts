import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { previewerCssPlugin } from "./previewer-css";

describe("previewerCssPlugin", () => {
  it("resolves virtual:previewer-css to internal id", () => {
    const plugin = previewerCssPlugin("/project");
    const resolved = (plugin.resolveId as (id: string) => string | undefined)(
      "virtual:previewer-css",
    );
    expect(resolved).toBe("\0virtual:previewer-css.css");
  });

  it("returns undefined for non-matching ids", () => {
    const plugin = previewerCssPlugin("/project");
    const resolved = (plugin.resolveId as (id: string) => string | undefined)("other-module");
    expect(resolved).toBeUndefined();
  });

  it("returns @import when css is specified", () => {
    const plugin = previewerCssPlugin("/project", "./src/global.css");
    const code = (plugin.load as (id: string) => string | undefined)("\0virtual:previewer-css.css");
    expect(code).toContain("@import");
    expect(code).toContain(resolve("/project", "./src/global.css"));
  });

  it("returns empty string when css is not specified", () => {
    const plugin = previewerCssPlugin("/project");
    const code = (plugin.load as (id: string) => string | undefined)("\0virtual:previewer-css.css");
    expect(code).toBe("");
  });

  it("returns undefined for non-matching load id", () => {
    const plugin = previewerCssPlugin("/project", "./src/global.css");
    const code = (plugin.load as (id: string) => string | undefined)("some-other-id");
    expect(code).toBeUndefined();
  });
});
