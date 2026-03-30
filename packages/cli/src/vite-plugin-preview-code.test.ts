import { describe, it, expect } from "vitest";
import { previewCodePlugin } from "./vite-plugin-preview-code";

function callTransform(code: string, id: string) {
  const plugin = previewCodePlugin();
  // vitest doesn't run the full Vite pipeline, so call transform() directly
  const transform = plugin.transform as (code: string, id: string) => { code: string } | undefined;
  return transform.call({} as never, code, id);
}

describe("previewCodePlugin", () => {
  it("transforms a single ```tsx preview block into <PreviewBlock>", () => {
    const input = [
      "# Hello",
      "",
      "```tsx preview",
      '<Button variant="default">Click</Button>',
      "```",
      "",
      "Some text after",
    ].join("\n");

    const result = callTransform(input, "src/Button.preview.mdx");
    expect(result!.code).toMatchInlineSnapshot(`
      "# Hello

      <PreviewBlock code={"<Button variant=\\"default\\">Click</Button>"}>
      <Button variant="default">Click</Button>
      </PreviewBlock>

      Some text after"
    `);
  });

  it("transforms multiple ```tsx preview blocks", () => {
    const input = ["```tsx preview", "<A />", "```", "", "```tsx preview", "<B />", "```"].join(
      "\n",
    );

    const result = callTransform(input, "src/Multi.preview.mdx");
    expect(result!.code).toMatchInlineSnapshot(`
      "<PreviewBlock code={"<A />"}>
      <A />
      </PreviewBlock>

      <PreviewBlock code={"<B />"}>
      <B />
      </PreviewBlock>"
    `);
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
    expect(result!.code).toMatchInlineSnapshot(`
      "<PreviewBlock code={"const re = /\\\\d+/;\\nconst s = \\"hello\\";"}>
      const re = /\\d+/;
      const s = "hello";
      </PreviewBlock>"
    `);
  });

  it("preserves multiline code as escaped newlines in code prop", () => {
    const input = ["```tsx preview", "<div>", "  <span>hello</span>", "</div>", "```"].join("\n");

    const result = callTransform(input, "src/Multiline.preview.mdx");
    expect(result!.code).toMatchInlineSnapshot(`
      "<PreviewBlock code={"<div>\\n  <span>hello</span>\\n</div>"}>
      <div>
        <span>hello</span>
      </div>
      </PreviewBlock>"
    `);
  });
});
