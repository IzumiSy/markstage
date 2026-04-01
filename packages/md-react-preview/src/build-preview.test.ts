import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import fg from "fast-glob";
import { runBuild, runPreview } from "./server";
import { extractPreviewBlocks } from "./preview-transform";
import { simpleHash } from "@izumisy/vite-plugin-react-preview";
import { readFile } from "node:fs/promises";
import type { PreviewServer } from "vite";

const FIXTURE_DIR = resolve(import.meta.dirname, "__fixtures__");
const DIST_DIR = resolve(FIXTURE_DIR, "dist");

describe("build + preview integration", () => {
  let server: PreviewServer;
  let baseUrl: string;
  let expectedBlockIds: string[];

  beforeAll(async () => {
    // Clean previous build
    await rm(DIST_DIR, { recursive: true, force: true });

    const resolveFiles = () => fg("docs/**/*.md", { cwd: FIXTURE_DIR, absolute: true });

    const opts = {
      cwd: FIXTURE_DIR,
      config: { title: "Test" },
      resolveFiles,
    };

    // Build
    await runBuild(opts);

    // Compute expected blockIds from fixture files
    expectedBlockIds = [];
    const files = await resolveFiles();
    for (const file of files) {
      const content = await readFile(file, "utf-8");
      const blocks = extractPreviewBlocks(content);
      for (let i = 0; i < blocks.length; i++) {
        expectedBlockIds.push(simpleHash(`${file}:${i}`));
      }
    }

    // Start preview server
    server = await runPreview(opts);
    const addr = server.httpServer.address();
    if (typeof addr === "string" || !addr) {
      throw new Error("Failed to get preview server address");
    }
    baseUrl = `http://localhost:${addr.port}`;
  }, 30_000);

  afterAll(async () => {
    server?.httpServer.close();
    await rm(DIST_DIR, { recursive: true, force: true });
  });

  it("should have at least one preview block", () => {
    expect(expectedBlockIds.length).toBeGreaterThan(0);
  });

  it("every __preview/{blockId} page returns 200", async () => {
    for (const blockId of expectedBlockIds) {
      const res = await fetch(`${baseUrl}/__preview/${blockId}`);
      expect(res.status, `__preview/${blockId} returned ${res.status}`).toBe(200);
    }
  });

  it("every __preview page references a JS file that exists", async () => {
    for (const blockId of expectedBlockIds) {
      const res = await fetch(`${baseUrl}/__preview/${blockId}`);
      const html = await res.text();

      // Extract the script src from the HTML
      const match = html.match(/src="([^"]+\.js)"/);
      expect(match, `__preview/${blockId} should have a script src`).toBeTruthy();

      const scriptUrl = new URL(match![1], baseUrl).href;
      const scriptRes = await fetch(scriptUrl);
      expect(
        scriptRes.status,
        `Script ${match![1]} for ${blockId} returned ${scriptRes.status}`,
      ).toBe(200);
    }
  });

  it("standalone JS contains all blockIds in its registry", async () => {
    // Fetch any preview page to find the standalone script path
    const res = await fetch(`${baseUrl}/__preview/${expectedBlockIds[0]}`);
    const html = await res.text();
    const match = html.match(/src="([^"]+\.js)"/);
    const scriptRes = await fetch(new URL(match![1], baseUrl).href);
    const js = await scriptRes.text();

    for (const blockId of expectedBlockIds) {
      expect(js, `Standalone JS should contain registry entry for ${blockId}`).toContain(blockId);
    }
  });
});
