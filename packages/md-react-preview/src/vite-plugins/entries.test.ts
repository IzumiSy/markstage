import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolve } from "node:path";
import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { previewerEntriesPlugin } from "./entries";
import fg from "fast-glob";

function createResolver(cwd: string, pattern: string): () => Promise<string[]> {
  return () => fg(pattern, { cwd, absolute: true });
}

describe("previewerEntriesPlugin", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(resolve(tmpdir(), "mrp-test-"));
  });

  // oxlint-disable-next-line -- cleanup
  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("resolves virtual:previewer-entries to internal id", () => {
    const plugin = previewerEntriesPlugin(tmpDir, createResolver(tmpDir, "src/**/*.preview.mdx"));
    const resolved = (plugin.resolveId as (id: string) => string | undefined)(
      "virtual:previewer-entries",
    );
    expect(resolved).toBe("\0virtual:previewer-entries");
  });

  it("returns undefined for non-matching resolve id", () => {
    const plugin = previewerEntriesPlugin(tmpDir, createResolver(tmpDir, "src/**/*.preview.mdx"));
    const resolved = (plugin.resolveId as (id: string) => string | undefined)("other-module");
    expect(resolved).toBeUndefined();
  });

  it("generates import statements and entries array for discovered files", async () => {
    await mkdir(resolve(tmpDir, "docs"), { recursive: true });
    await writeFile(resolve(tmpDir, "docs/Button.md"), "---\ntitle: Button\n---\n# Button");
    await writeFile(resolve(tmpDir, "docs/Input.md"), "---\ntitle: Input\n---\n# Input");

    const plugin = previewerEntriesPlugin(tmpDir, createResolver(tmpDir, "docs/**/*.md"));
    const code = await (plugin.load as (id: string) => Promise<string | undefined>)(
      "\0virtual:previewer-entries",
    );
    expect(code).toBeDefined();
    expect(code).toContain("import Mod0");
    expect(code).toContain("import Mod1");
    expect(code).toContain("export const entries = [");
    expect(code).toMatch(/"Button"|"Input"/);
  });

  it("returns undefined for non-matching load id", async () => {
    const plugin = previewerEntriesPlugin(tmpDir, createResolver(tmpDir, "src/**/*.preview.mdx"));
    const code = await (plugin.load as (id: string) => Promise<string | undefined>)(
      "some-other-id",
    );
    expect(code).toBeUndefined();
  });
});
