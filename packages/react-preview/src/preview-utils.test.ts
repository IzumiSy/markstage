import { describe, it, expect } from "vitest";
import { simpleHash, parseMeta, resolveCssImportPath } from "./preview-utils";

describe("simpleHash", () => {
  it("returns an 8-character hex string", () => {
    const hash = simpleHash("test");
    expect(hash).toHaveLength(8);
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("returns the same hash for the same input", () => {
    expect(simpleHash("hello")).toBe(simpleHash("hello"));
  });

  it("returns different hashes for different inputs", () => {
    expect(simpleHash("a")).not.toBe(simpleHash("b"));
  });
});

describe("parseMeta", () => {
  it("parses a single key-value pair", () => {
    expect(parseMeta('wrap="row"')).toEqual({ wrap: "row" });
  });

  it("parses multiple key-value pairs", () => {
    expect(parseMeta('wrap="row" title="hello"')).toEqual({
      wrap: "row",
      title: "hello",
    });
  });

  it("returns empty object for empty string", () => {
    expect(parseMeta("")).toEqual({});
  });

  it("returns empty object for string without valid pairs", () => {
    expect(parseMeta("no-pairs-here")).toEqual({});
  });
});

describe("resolveCssImportPath", () => {
  it("returns scoped package specifier as-is", () => {
    expect(resolveCssImportPath("@foo/bar/styles")).toBe("@foo/bar/styles");
  });

  it("returns non-scoped package specifier as-is", () => {
    expect(resolveCssImportPath("some-package/styles.css")).toBe(
      "some-package/styles.css",
    );
  });

  it("resolves relative path against hostRoot", () => {
    const result = resolveCssImportPath("./src/global.css", "/project");
    expect(result).toContain("/project/src/global.css");
  });

  it("resolves absolute path as-is", () => {
    expect(resolveCssImportPath("/abs/styles.css", "/project")).toBe(
      "/abs/styles.css",
    );
  });

  it("returns relative path as-is when hostRoot is not provided", () => {
    expect(resolveCssImportPath("./src/global.css")).toBe("./src/global.css");
  });
});
