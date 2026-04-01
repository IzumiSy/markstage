import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { PreviewBlockEntry } from "@izumisy/vite-plugin-react-preview";
import { simpleHash } from "@izumisy/vite-plugin-react-preview";
import { findMarkdownFiles, scanMarkdownBlocks } from "./index";

const TMP_ROOT = join(tmpdir(), "markstage-test-" + Date.now());

beforeAll(() => {
  mkdirSync(join(TMP_ROOT, "docs", "nested"), { recursive: true });
  mkdirSync(join(TMP_ROOT, ".hidden"), { recursive: true });
  mkdirSync(join(TMP_ROOT, "node_modules", "pkg"), { recursive: true });

  writeFileSync(
    join(TMP_ROOT, "docs", "Button.md"),
    [
      "# Button",
      "",
      "```tsx preview",
      "<button>Click</button>",
      "```",
      "",
      '```tsx preview wrap="row"',
      "<button>A</button>",
      "<button>B</button>",
      "```",
    ].join("\n"),
  );

  writeFileSync(
    join(TMP_ROOT, "docs", "nested", "Card.md"),
    ["# Card", "", "```tsx preview", "<div>Card</div>", "```"].join("\n"),
  );

  // Non-md file should be ignored
  writeFileSync(join(TMP_ROOT, "docs", "readme.txt"), "not markdown");

  // Hidden directory should be skipped
  writeFileSync(
    join(TMP_ROOT, ".hidden", "Secret.md"),
    ["```tsx preview", "<div>Secret</div>", "```"].join("\n"),
  );

  // node_modules should be skipped
  writeFileSync(
    join(TMP_ROOT, "node_modules", "pkg", "Dep.md"),
    ["```tsx preview", "<div>Dep</div>", "```"].join("\n"),
  );
});

afterAll(() => {
  rmSync(TMP_ROOT, { recursive: true, force: true });
});

describe("findMarkdownFiles", () => {
  it("finds .md files in nested directories", () => {
    const files = findMarkdownFiles(TMP_ROOT);
    const names = files.map((f) => f.replace(TMP_ROOT + "/", "")).sort();
    expect(names).toEqual(["docs/Button.md", "docs/nested/Card.md"]);
  });

  it("skips hidden directories", () => {
    const files = findMarkdownFiles(TMP_ROOT);
    expect(files.every((f) => !f.includes(".hidden"))).toBe(true);
  });

  it("skips node_modules", () => {
    const files = findMarkdownFiles(TMP_ROOT);
    expect(files.every((f) => !f.includes("node_modules"))).toBe(true);
  });

  it("skips non-.md files", () => {
    const files = findMarkdownFiles(TMP_ROOT);
    expect(files.every((f) => f.endsWith(".md"))).toBe(true);
  });
});

describe("scanMarkdownBlocks", () => {
  it("finds all preview blocks from .md files", () => {
    const registry = new Map<string, PreviewBlockEntry>();
    scanMarkdownBlocks(TMP_ROOT, registry);
    // Button.md has 2 blocks, Card.md has 1 = 3 total
    expect(registry.size).toBe(3);
  });

  it("does not include blocks from hidden directories or node_modules", () => {
    const registry = new Map<string, PreviewBlockEntry>();
    scanMarkdownBlocks(TMP_ROOT, registry);
    for (const [, entry] of registry) {
      expect(entry.code).not.toContain("Secret");
      expect(entry.code).not.toContain("Dep");
    }
  });

  it("generates stable blockIds based on relative path and line", () => {
    const registry = new Map<string, PreviewBlockEntry>();
    scanMarkdownBlocks(TMP_ROOT, registry);
    // Button.md first block is at line 2 (0-based), relative path = "docs/Button.md"
    const expectedId = simpleHash("docs/Button.md:2");
    expect(registry.has(expectedId)).toBe(true);
  });

  it("extracts correct code content", () => {
    const registry = new Map<string, PreviewBlockEntry>();
    scanMarkdownBlocks(TMP_ROOT, registry);
    const buttonBlockId = simpleHash("docs/Button.md:2");
    expect(registry.get(buttonBlockId)!.code).toBe("<button>Click</button>");
  });

  it("parses meta attributes (wrap)", () => {
    const registry = new Map<string, PreviewBlockEntry>();
    scanMarkdownBlocks(TMP_ROOT, registry);
    // Second block in Button.md is at line 6 (0-based)
    const wrapBlockId = simpleHash("docs/Button.md:6");
    expect(registry.get(wrapBlockId)!.wrap).toBe("row");
  });
});
