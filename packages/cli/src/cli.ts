#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import { loadConfig } from "c12";
import fg from "fast-glob";
import type { PreviewerConfig } from "@markstage/core";
import { startDev, runBuild, runPreview } from "@markstage/core";

async function loadPreviewerConfig(cwd: string): Promise<PreviewerConfig> {
  const { config } = await loadConfig<PreviewerConfig>({
    name: "previewer",
    cwd,
  });
  return config ?? {};
}

function createFileResolver(cwd: string, glob: string): () => Promise<string[]> {
  return () => fg(glob, { cwd, absolute: true });
}

const dev = defineCommand({
  meta: { name: "dev", description: "Start the previewer dev server" },
  async run() {
    const cwd = process.cwd();
    const config = await loadPreviewerConfig(cwd);
    const resolveFiles = createFileResolver(cwd, config.glob ?? "src/**/*.preview.mdx");
    await startDev({ cwd, config, resolveFiles });
  },
});

const buildCmd = defineCommand({
  meta: { name: "build", description: "Build the previewer for production" },
  async run() {
    const cwd = process.cwd();
    const config = await loadPreviewerConfig(cwd);
    const resolveFiles = createFileResolver(cwd, config.glob ?? "src/**/*.preview.mdx");
    await runBuild({ cwd, config, resolveFiles });
  },
});

const previewCmd = defineCommand({
  meta: {
    name: "preview",
    description: "Preview the production build locally",
  },
  async run() {
    const cwd = process.cwd();
    const config = await loadPreviewerConfig(cwd);
    const resolveFiles = createFileResolver(cwd, config.glob ?? "src/**/*.preview.mdx");
    await runPreview({ cwd, config, resolveFiles });
  },
});

const main = defineCommand({
  meta: { name: "previewer", description: "Component previewer" },
  subCommands: { dev, build: buildCmd, preview: previewCmd },
});

runMain(main);
