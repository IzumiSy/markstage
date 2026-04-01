import { resolve } from "node:path";
import { createServer, build, preview } from "vite";
import { createPreviewerViteConfig } from "./vite-config";

export interface PreviewerRunOptions {
  cwd: string;
  config: import("./config").PreviewerConfig;
  /** Resolves absolute paths to preview MDX files. */
  resolveFiles: () => Promise<string[]>;
}

function buildViteConfig({ cwd, config, resolveFiles }: PreviewerRunOptions) {
  return createPreviewerViteConfig({
    root: cwd,
    title: config.title,
    resolveFiles,
    css: config.css,
    repo: config.repo,
    vite: config.vite,
  });
}

export async function startDev(opts: PreviewerRunOptions) {
  const server = await createServer(buildViteConfig(opts));
  await server.listen();
  server.printUrls();
  return server;
}

export async function runBuild(opts: PreviewerRunOptions) {
  const viteConfig = buildViteConfig(opts);
  await build({
    ...viteConfig,
    build: {
      ...viteConfig.build,
      outDir: resolve(opts.cwd, "dist"),
    },
  });
}

export async function runPreview(opts: PreviewerRunOptions) {
  const viteConfig = buildViteConfig(opts);
  const server = await preview({
    ...viteConfig,
    build: {
      ...viteConfig.build,
      outDir: resolve(opts.cwd, "dist"),
    },
  });
  server.printUrls();
  return server;
}
