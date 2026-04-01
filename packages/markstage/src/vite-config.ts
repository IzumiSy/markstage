import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import type { InlineConfig, Plugin, PluginOption } from "vite";
import { previewPlugin } from "./vite-plugins/preview";
import { previewerEntriesPlugin } from "./vite-plugins/entries";
import { previewerCssPlugin } from "./vite-plugins/css";
import { standalonePreviewPlugin } from "./vite-plugins/standalone-preview";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(__dirname, "..", "app");

// Resolve @mdx-js/react from previewer's own node_modules so the host project
// doesn't need to install it.
const require = createRequire(import.meta.url);
const mdxReactEntry = require.resolve("@mdx-js/react");

export function createPreviewerViteConfig(options: {
  /** Host project root directory for discovering preview files and CSS. */
  root: string;
  /** Resolves absolute paths to preview MDX files. */
  resolveFiles: () => Promise<string[]>;
  css?: string;
  title: string;
  repo?: import("./config").PreviewerRepo;
  /** Vite configuration overrides */
  vite?: {
    plugins?: PluginOption[];
  };
}): InlineConfig {
  const preview = previewPlugin(options.resolveFiles, {
    css: options.css,
    hostRoot: options.root,
  });

  return {
    configFile: false,
    // Use the previewer's own app/ directory as Vite root so that
    // app/index.html is served directly — no HTML injection middleware needed.
    root: APP_DIR,
    publicDir: false,
    define: {
      __PREVIEWER_TITLE__: JSON.stringify(options.title),
      __PREVIEWER_REPO__: JSON.stringify(
        options.repo
          ? {
              url: options.repo.url.replace(/\/+$/, ""),
              ref: options.repo.ref ?? "main",
            }
          : null,
      ),
    },
    resolve: {
      alias: {
        "@mdx-js/react": mdxReactEntry,
      },
    },
    server: {
      port: 3040,
      fs: {
        allow: [options.root, APP_DIR],
      },
    },
    plugins: [
      preview,
      {
        enforce: "pre",
        ...mdx({
          remarkPlugins: [
            remarkGfm,
            remarkFrontmatter,
            [remarkMdxFrontmatter, { name: "frontmatter" }],
          ],
          providerImportSource: "@mdx-js/react",
          format: "mdx",
          mdxExtensions: [".mdx", ".md"],
          include: /\.(md|mdx)$/,
        }),
      } as Plugin,
      react({ include: /\.(jsx|tsx)$/ }),
      ...(options.vite?.plugins ?? []),
      previewerEntriesPlugin(options.root, options.resolveFiles),
      previewerCssPlugin(options.root, options.css),
      standalonePreviewPlugin(() => preview),
    ],
  };
}
