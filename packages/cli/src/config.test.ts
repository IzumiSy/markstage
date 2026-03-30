import { describe, it, expect } from "vitest";
import { defineConfig } from "./config";

describe("defineConfig", () => {
  it("returns the config object unchanged", () => {
    const config = {
      title: "My Components",
      glob: "src/**/*.preview.mdx",
      css: "./src/styles.css",
      repo: { url: "https://github.com/user/repo", ref: "main" },
    };
    expect(defineConfig(config)).toBe(config);
  });

  it("works with minimal config", () => {
    const config = { title: "Minimal" };
    expect(defineConfig(config)).toEqual({ title: "Minimal" });
  });
});
