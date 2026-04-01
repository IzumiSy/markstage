import { describe, it, expect } from "vitest";
import {
  extractPreviewBlocks,
  escapeJsString,
  hasPreviewBlocks,
} from "./preview-transform";

describe("extractPreviewBlocks", () => {
  it("extracts a single preview block", () => {
    const input = [
      "# Hello",
      "",
      "```tsx preview",
      '<Button variant="default">Click</Button>',
      "```",
      "",
      "Some text after",
    ].join("\n");

    const blocks = extractPreviewBlocks(input);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].code).toBe('<Button variant="default">Click</Button>');
  });

  it("extracts multiple preview blocks", () => {
    const input = [
      "```tsx preview",
      "<A />",
      "```",
      "",
      "```tsx preview",
      "<B />",
      "```",
    ].join("\n");

    const blocks = extractPreviewBlocks(input);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].code).toBe("<A />");
    expect(blocks[1].code).toBe("<B />");
  });

  it("returns empty array for non-preview blocks", () => {
    const input = ["```tsx", "<NotPreview />", "```"].join("\n");
    expect(extractPreviewBlocks(input)).toHaveLength(0);
  });

  it("preserves multiline code", () => {
    const input = [
      "```tsx preview",
      "<div>",
      "  <span>hello</span>",
      "</div>",
      "```",
    ].join("\n");

    const blocks = extractPreviewBlocks(input);
    expect(blocks[0].code).toBe("<div>\n  <span>hello</span>\n</div>");
  });

  it("provides correct start/end positions", () => {
    const prefix = "# Hello\n\n";
    const fence = "```tsx preview\n<A />\n```";
    const input = prefix + fence;

    const blocks = extractPreviewBlocks(input);
    expect(blocks[0].start).toBe(prefix.length);
    expect(blocks[0].end).toBe(input.length);
  });

  it("parses meta attributes from fence info", () => {
    const input = ['```tsx preview wrap="row"', "<A />", "```"].join("\n");

    const blocks = extractPreviewBlocks(input);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].code).toBe("<A />");
    expect(blocks[0].meta).toEqual({ wrap: "row" });
  });

  it("returns empty meta when no attributes are present", () => {
    const input = ["```tsx preview", "<A />", "```"].join("\n");

    const blocks = extractPreviewBlocks(input);
    expect(blocks[0].meta).toEqual({});
  });
});

describe("escapeJsString", () => {
  it("escapes backslashes, quotes, and newlines", () => {
    expect(escapeJsString('a\\b"c\nd')).toBe('a\\\\b\\"c\\nd');
  });
});

describe("hasPreviewBlocks", () => {
  it("returns true when preview blocks exist", () => {
    expect(hasPreviewBlocks("```tsx preview\n<A />\n```")).toBe(true);
  });

  it("returns true when preview blocks have meta attributes", () => {
    expect(hasPreviewBlocks('```tsx preview wrap="row"\n<A />\n```')).toBe(
      true,
    );
  });

  it("returns false for normal code blocks", () => {
    expect(hasPreviewBlocks("```tsx\n<A />\n```")).toBe(false);
  });
});
