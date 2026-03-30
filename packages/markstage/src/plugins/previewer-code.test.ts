import { describe, it, expect, beforeEach } from "vitest";
import { previewCodePlugin, blockRegistry } from "./previewer-code";
import { simpleHash } from "@izumisy/react-preview";

function callTransform(code: string, id: string) {
  const plugin = previewCodePlugin();
  // vitest doesn't run the full Vite pipeline, so call transform() directly
  const transform = plugin.transform as (code: string, id: string) => { code: string } | undefined;
  return transform.call({} as never, code, id);
}

describe("previewCodePlugin", () => {
  beforeEach(() => {
    blockRegistry.clear();
  });

  it("transforms a single ```tsx preview block into <PreviewBlock>", () => {
    const id = "src/Button.preview.mdx";
    const input = [
      "# Hello",
      "",
      "```tsx preview",
      '<Button variant="default">Click</Button>',
      "```",
      "",
      "Some text after",
    ].join("\n");

    const result = callTransform(input, id);
    const blockId = simpleHash(`${id}:0`);
    expect(result!.code).toContain(`blockId={"${blockId}"}`);
    expect(result!.code).toContain(`code={"<Button variant=\\"default\\">Click</Button>"}`);
    expect(result!.code).toContain("<PreviewBlock");
    expect(result!.code).toContain("/>");
    // Should NOT contain children
    expect(result!.code).not.toContain("</PreviewBlock>");
  });

  it("transforms multiple ```tsx preview blocks", () => {
    const id = "src/Multi.preview.mdx";
    const input = ["```tsx preview", "<A />", "```", "", "```tsx preview", "<B />", "```"].join(
      "\n",
    );

    const result = callTransform(input, id);
    const blockId0 = simpleHash(`${id}:0`);
    const blockId1 = simpleHash(`${id}:1`);
    expect(result!.code).toContain(`blockId={"${blockId0}"}`);
    expect(result!.code).toContain(`blockId={"${blockId1}"}`);
    expect(result!.code).toContain(`code={"<A />"}`);
    expect(result!.code).toContain(`code={"<B />"}`);
  });

  it("does not transform regular ```tsx blocks (without 'preview')", () => {
    const input = ["```tsx", "<NotPreview />", "```"].join("\n");

    const result = callTransform(input, "src/Foo.preview.mdx");
    expect(result).toBeUndefined();
  });

  it("returns undefined for non-preview.mdx files", () => {
    const input = ["```tsx preview", "<Button />", "```"].join("\n");

    const result = callTransform(input, "src/Button.tsx");
    expect(result).toBeUndefined();
  });

  it("escapes backslashes and double quotes in code", () => {
    const input = ["```tsx preview", "const re = /\\d+/;", 'const s = "hello";', "```"].join("\n");

    const result = callTransform(input, "src/Escape.preview.mdx");
    expect(result!.code).toContain(`code={"const re = /\\\\d+/;\\nconst s = \\"hello\\";"}`);
  });

  it("preserves multiline code as escaped newlines in code prop", () => {
    const input = ["```tsx preview", "<div>", "  <span>hello</span>", "</div>", "```"].join("\n");

    const result = callTransform(input, "src/Multiline.preview.mdx");
    expect(result!.code).toContain(`code={"<div>\\n  <span>hello</span>\\n</div>"}`);
  });

  it("registers blocks in the shared registry", () => {
    const id = "src/Reg.preview.mdx";
    const input = ['```tsx preview wrap="row"', "<A />", "```"].join("\n");

    callTransform(input, id);
    const blockId = simpleHash(`${id}:0`);
    const entry = blockRegistry.get(blockId);
    expect(entry).toBeDefined();
    expect(entry!.code).toBe("<A />");
    expect(entry!.sourceFile).toBe(id);
    expect(entry!.wrap).toBe("row");
  });

  it("does not include wrap prop in output (handled by iframe)", () => {
    const input = ['```tsx preview wrap="row"', "<A />", "```"].join("\n");

    const result = callTransform(input, "src/NoWrap.preview.mdx");
    expect(result!.code).not.toContain("wrap=");
  });
});
