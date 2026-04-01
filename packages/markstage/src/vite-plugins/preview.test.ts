import { describe, it, expect, beforeEach } from "vitest";
import { previewPlugin, type PreviewPlugin } from "./preview";
import { simpleHash } from "@izumisy/react-preview";

let plugin: PreviewPlugin;

async function callTransform(code: string, id: string) {
  const transform = plugin.transform as (
    code: string,
    id: string,
  ) => Promise<{ code: string } | undefined>;
  return transform.call({} as never, code, id);
}

describe("previewPlugin", () => {
  beforeEach(() => {
    plugin = previewPlugin(async () => []);
  });

  it("transforms a single ```tsx preview block into <PreviewBlock>", async () => {
    const id = "src/Button.md";
    const input = [
      "# Hello",
      "",
      "```tsx preview",
      '<Button variant="default">Click</Button>',
      "```",
      "",
      "Some text after",
    ].join("\n");

    const result = await callTransform(input, id);
    const blockId = simpleHash(`${id}:0`);
    expect(result!.code).toContain(`blockId={"${blockId}"}`);
    expect(result!.code).toContain(
      `code={"<Button variant=\\"default\\">Click</Button>"}`,
    );
    expect(result!.code).toContain("<PreviewBlock");
    expect(result!.code).toContain("/>");
    // Should NOT contain children
    expect(result!.code).not.toContain("</PreviewBlock>");
  });

  it("transforms multiple ```tsx preview blocks", async () => {
    const id = "src/Multi.md";
    const input = [
      "```tsx preview",
      "<A />",
      "```",
      "",
      "```tsx preview",
      "<B />",
      "```",
    ].join("\n");

    const result = await callTransform(input, id);
    const blockId0 = simpleHash(`${id}:0`);
    const blockId1 = simpleHash(`${id}:1`);
    expect(result!.code).toContain(`blockId={"${blockId0}"}`);
    expect(result!.code).toContain(`blockId={"${blockId1}"}`);
    expect(result!.code).toContain(`code={"<A />"}`);
    expect(result!.code).toContain(`code={"<B />"}`);
  });

  it("does not transform regular ```tsx blocks (without 'preview')", async () => {
    const input = ["```tsx", "<NotPreview />", "```"].join("\n");

    const result = await callTransform(input, "src/Foo.md");
    expect(result).toBeUndefined();
  });

  it("returns undefined for non-md files", async () => {
    const input = ["```tsx preview", "<Button />", "```"].join("\n");

    const result = await callTransform(input, "src/Button.tsx");
    expect(result).toBeUndefined();
  });

  it("escapes backslashes and double quotes in code", async () => {
    const input = [
      "```tsx preview",
      "const re = /\\d+/;",
      'const s = "hello";',
      "```",
    ].join("\n");

    const result = await callTransform(input, "src/Escape.md");
    expect(result!.code).toContain(
      `code={"const re = /\\\\d+/;\\nconst s = \\"hello\\";"}`,
    );
  });

  it("preserves multiline code as escaped newlines in code prop", async () => {
    const input = [
      "```tsx preview",
      "<div>",
      "  <span>hello</span>",
      "</div>",
      "```",
    ].join("\n");

    const result = await callTransform(input, "src/Multiline.md");
    expect(result!.code).toContain(
      `code={"<div>\\n  <span>hello</span>\\n</div>"}`,
    );
  });

  it("registers blocks in the block registry", async () => {
    const id = "src/Reg.md";
    const input = ['```tsx preview wrap="row"', "<A />", "```"].join("\n");

    await callTransform(input, id);
    const blockId = simpleHash(`${id}:0`);
    const entry = plugin.blockRegistry.get(blockId);
    expect(entry).toBeDefined();
    expect(entry!.code).toBe("<A />");
    expect(entry!.sourceFile).toBe(id);
    expect(entry!.wrap).toBe("row");
  });

  it("does not include wrap prop in output (handled by preview plugin)", async () => {
    const input = ['```tsx preview wrap="row"', "<A />", "```"].join("\n");

    const result = await callTransform(input, "src/NoWrap.md");
    expect(result!.code).toContain('wrap={"row"}');
  });
});
