import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolve } from "node:path";
import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { previewerEntriesPlugin } from "./previewer-entries";

describe("previewerEntriesPlugin", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(resolve(tmpdir(), "markstage-test-"));
  });

  // oxlint-disable-next-line -- cleanup
  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("resolves virtual:previewer-entries to internal id", () => {
    const plugin = previewerEntriesPlugin(tmpDir, "src/**/*.preview.mdx");
    const resolved = (plugin.resolveId as (id: string) => string | undefined)(
      "virtual:previewer-entries",
    );
    expect(resolved).toBe("\0virtual:previewer-entries");
  });

  it("returns undefined for non-matching resolve id", () => {
    const plugin = previewerEntriesPlugin(tmpDir, "src/**/*.preview.mdx");
    const resolved = (plugin.resolveId as (id: string) => string | undefined)("other-module");
    expect(resolved).toBeUndefined();
  });

  it("generates import statements and entries array for discovered files", async () => {
    await mkdir(resolve(tmpDir, "src"), { recursive: true });
    await writeFile(resolve(tmpDir, "src/Button.preview.mdx"), "---\ntitle: Button\n---\n# Button");
    await writeFile(resolve(tmpDir, "src/Input.preview.mdx"), "---\ntitle: Input\n---\n# Input");

    const plugin = previewerEntriesPlugin(tmpDir, "src/**/*.preview.mdx");
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
    const plugin = previewerEntriesPlugin(tmpDir, "src/**/*.preview.mdx");
    const code = await (plugin.load as (id: string) => Promise<string | undefined>)(
      "some-other-id",
    );
    expect(code).toBeUndefined();
  });
});
