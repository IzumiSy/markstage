import { describe, it, expect } from "vitest";
import { previewerConfigPlugin } from "./previewer-config";

describe("previewerConfigPlugin", () => {
  it("resolves virtual:previewer-config to internal id", () => {
    const plugin = previewerConfigPlugin("Test");
    const resolved = (plugin.resolveId as (id: string) => string | undefined)(
      "virtual:previewer-config",
    );
    expect(resolved).toBe("\0virtual:previewer-config");
  });

  it("returns undefined for non-matching ids", () => {
    const plugin = previewerConfigPlugin("Test");
    const resolved = (plugin.resolveId as (id: string) => string | undefined)("other-module");
    expect(resolved).toBeUndefined();
  });

  it("exports title and repo with trailing slash stripped", () => {
    const plugin = previewerConfigPlugin("My UI", {
      url: "https://github.com/user/repo/",
      ref: "develop",
    });
    const code = (plugin.load as (id: string) => string | undefined)("\0virtual:previewer-config");
    expect(code).toContain('export const title = "My UI"');
    expect(code).toContain('"https://github.com/user/repo"');
    expect(code).toContain('"develop"');
  });

  it("exports null repo when not configured", () => {
    const plugin = previewerConfigPlugin("Test");
    const code = (plugin.load as (id: string) => string | undefined)("\0virtual:previewer-config");
    expect(code).toContain("export const repo = null");
  });

  it("defaults ref to 'main' when not specified", () => {
    const plugin = previewerConfigPlugin("Test", {
      url: "https://github.com/user/repo",
    });
    const code = (plugin.load as (id: string) => string | undefined)("\0virtual:previewer-config");
    expect(code).toContain('"main"');
  });

  it("returns undefined for non-matching load id", () => {
    const plugin = previewerConfigPlugin("Test");
    const code = (plugin.load as (id: string) => string | undefined)("some-other-id");
    expect(code).toBeUndefined();
  });
});
