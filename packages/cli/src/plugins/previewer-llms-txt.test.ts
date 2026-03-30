import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolve } from "node:path";
import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { previewerLlmsTxtPlugin } from "./previewer-llms-txt";

describe("previewerLlmsTxtPlugin", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(resolve(tmpdir(), "markstage-test-"));
  });

  // oxlint-disable-next-line -- cleanup
  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("generates llms.txt via generateBundle", async () => {
    await mkdir(resolve(tmpDir, "src"), { recursive: true });
    await writeFile(
      resolve(tmpDir, "src/Button.preview.mdx"),
      [
        "---",
        "title: Button",
        "description: A clickable button",
        "sidebar:",
        "  group: Actions",
        "  order: 1",
        "---",
        "# Button",
      ].join("\n"),
    );

    const plugin = previewerLlmsTxtPlugin("My UI", tmpDir, "src/**/*.preview.mdx", {
      url: "https://github.com/user/repo",
      ref: "main",
    });

    const emitted: { type: string; fileName: string; source: string }[] = [];
    const ctx = {
      emitFile(file: { type: string; fileName: string; source: string }) {
        emitted.push(file);
      },
    };

    await (plugin.generateBundle as () => Promise<void>).call(ctx);

    expect(emitted).toHaveLength(1);
    expect(emitted[0].fileName).toBe("llms.txt");
    const text = emitted[0].source;
    expect(text).toContain("# My UI");
    expect(text).toContain("## Actions");
    expect(text).toContain("Button");
    expect(text).toContain("A clickable button");
    expect(text).toContain("raw.githubusercontent.com");
    expect(text).toContain("## Reference");
    expect(text).toContain("https://github.com/user/repo");
  });

  it("excludes hidden entries", async () => {
    await mkdir(resolve(tmpDir, "src"), { recursive: true });
    await writeFile(
      resolve(tmpDir, "src/Hidden.preview.mdx"),
      ["---", "title: Hidden", "hidden: true", "---", "# Hidden"].join("\n"),
    );
    await writeFile(
      resolve(tmpDir, "src/Visible.preview.mdx"),
      ["---", "title: Visible", "description: Shown", "---", "# Visible"].join("\n"),
    );

    const plugin = previewerLlmsTxtPlugin("Test", tmpDir, "src/**/*.preview.mdx", {
      url: "https://github.com/user/repo",
    });

    const emitted: { type: string; fileName: string; source: string }[] = [];
    const ctx = {
      emitFile(file: { type: string; fileName: string; source: string }) {
        emitted.push(file);
      },
    };

    await (plugin.generateBundle as () => Promise<void>).call(ctx);

    const text = emitted[0].source;
    expect(text).toContain("Visible");
    expect(text).not.toContain("Hidden");
  });
});
