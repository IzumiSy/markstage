#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import { loadConfig } from "c12";
import fg from "fast-glob";
import { DEFAULT_GLOB, type PreviewerConfig } from "./config";
import type { PreviewerRunOptions } from "./server";
import { startDev, runBuild, runPreview } from "./server";

async function resolveRunOptions(cwd: string): Promise<PreviewerRunOptions> {
  const { config } = await loadConfig<PreviewerConfig>({
    name: "previewer",
    cwd,
  });
  const cfg = config ?? {};
  const resolveFiles = () =>
    fg(cfg.glob ?? DEFAULT_GLOB, { cwd, absolute: true });
  return { cwd, config: cfg, resolveFiles };
}

const dev = defineCommand({
  meta: { name: "dev", description: "Start the previewer dev server" },
  async run() {
    await startDev(await resolveRunOptions(process.cwd()));
  },
});

const buildCmd = defineCommand({
  meta: { name: "build", description: "Build the previewer for production" },
  async run() {
    await runBuild(await resolveRunOptions(process.cwd()));
  },
});

const previewCmd = defineCommand({
  meta: {
    name: "preview",
    description: "Preview the production build locally",
  },
  async run() {
    await runPreview(await resolveRunOptions(process.cwd()));
  },
});

const main = defineCommand({
  meta: { name: "previewer", description: "Component previewer" },
  subCommands: { dev, build: buildCmd, preview: previewCmd },
});

runMain(main);
