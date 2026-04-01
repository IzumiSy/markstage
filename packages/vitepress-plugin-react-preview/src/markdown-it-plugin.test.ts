import { describe, it, expect } from "vitest";
import MarkdownIt from "markdown-it";
import type { PreviewBlockEntry } from "@izumisy/vite-plugin-react-preview";
import { createMarkdownItPlugin } from "./markdown-it-plugin";

function render(src: string, env: Record<string, unknown> = {}) {
  const registry = new Map<string, PreviewBlockEntry>();
  const md = new MarkdownIt();
  md.use(createMarkdownItPlugin(registry));
  return { html: md.render(src, env), registry };
}

describe("markdownItPreviewPlugin", () => {
  it("transforms ```tsx preview into <PreviewBlock> with base64 code", () => {
    const input = "```tsx preview\n<Button>Click</Button>\n```";
    const { html: result } = render(input, {
      relativePath: "components/button.md",
    });

    expect(result).toContain("<PreviewBlock");
    expect(result).toContain("block-id=");
    expect(result).toContain("highlighted=");

    // Verify base64 code attribute decodes correctly
    const codeMatch = result.match(/code="([^"]+)"/);
    expect(codeMatch).not.toBeNull();
    const decoded = Buffer.from(codeMatch![1], "base64").toString("utf-8");
    expect(decoded).toBe("<Button>Click</Button>");
  });

  it("does not transform regular ```tsx blocks", () => {
    const input = "```tsx\n<NotPreview />\n```";
    const { html: result } = render(input);

    expect(result).not.toContain("<PreviewBlock");
    expect(result).toContain("<code");
  });

  it("handles multiple preview blocks", () => {
    const input = "```tsx preview\n<A />\n```\n\n```tsx preview\n<B />\n```";
    const { html: result } = render(input, { relativePath: "test.md" });

    const matches = result.match(/<PreviewBlock/g);
    expect(matches).toHaveLength(2);
  });

  it("registers blocks in the shared registry with wrap metadata", () => {
    const input = '```tsx preview wrap="row"\n<A />\n<B />\n```';
    const registry = new Map<string, PreviewBlockEntry>();
    const md = new MarkdownIt();
    md.use(createMarkdownItPlugin(registry));
    md.render(input, { relativePath: "test.md" });

    expect(registry.size).toBe(1);
    const entry = [...registry.values()][0];
    expect(entry.wrap).toBe("row");
    expect(entry.code).toBe("<A />\n<B />");
  });

  it("includes wrap attribute in rendered HTML", () => {
    const input = '```tsx preview wrap="row"\n<A />\n```';
    const { html: result } = render(input, { relativePath: "test.md" });

    expect(result).toContain('wrap="row"');
  });
});
