import { resolve } from "node:path";
import { createServer, build, preview } from "vite";
import { createPreviewerViteConfig } from "./vite-config";

export { defineConfig, type PreviewerConfig, type PreviewerRepo } from "./config";
export { createPreviewerViteConfig } from "./vite-config";
export { extractProps, extractTypeDescription, type PropInfo } from "./extract-props";
export {
  extractPreviewBlocks,
  escapeJsString,
  hasPreviewBlocks,
  parseMeta,
  type PreviewBlock,
} from "./preview-transform";
export { simpleHash, type PreviewBlockEntry } from "./plugins/preview-registry";

export interface PreviewerRunOptions {
  cwd: string;
  config: import("./config").PreviewerConfig;
  /** Resolves absolute paths to preview MDX files. */
  resolveFiles: () => Promise<string[]>;
}

/**
 * Start the previewer dev server programmatically.
 */
export async function startDev({ cwd, config, resolveFiles }: PreviewerRunOptions) {
  const viteConfig = createPreviewerViteConfig({
    root: cwd,
    title: config.title,
    resolveFiles,
    css: config.css,
    repo: config.repo,
    vite: config.vite,
  });
  const server = await createServer(viteConfig);
  await server.listen();
  server.printUrls();
  return server;
}

/**
 * Build the previewer for production programmatically.
 */
export async function runBuild({ cwd, config, resolveFiles }: PreviewerRunOptions) {
  const viteConfig = createPreviewerViteConfig({
    root: cwd,
    title: config.title,
    resolveFiles,
    css: config.css,
    repo: config.repo,
    vite: config.vite,
  });
  await build({
    ...viteConfig,
    build: {
      ...viteConfig.build,
      outDir: resolve(cwd, "dist-preview"),
    },
  });
}

/**
 * Start a static preview server for the built output.
 */
export async function runPreview({ cwd, config, resolveFiles }: PreviewerRunOptions) {
  const viteConfig = createPreviewerViteConfig({
    root: cwd,
    title: config.title,
    resolveFiles,
    css: config.css,
    repo: config.repo,
    vite: config.vite,
  });
  const server = await preview({
    ...viteConfig,
    build: {
      ...viteConfig.build,
      outDir: resolve(cwd, "dist-preview"),
    },
  });
  server.printUrls();
  return server;
}
