import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import type { InlineConfig, Plugin, PluginOption } from "vite";
import type { PreviewerRepo } from "./config";
import { previewCodePlugin } from "./plugins/previewer-code";
import { previewerEntriesPlugin } from "./plugins/previewer-entries";
import { previewerCssPlugin } from "./plugins/previewer-css";
import { previewerConfigPlugin } from "./plugins/previewer-config";
import { previewerHtmlTitlePlugin } from "./plugins/previewer-html-title";
import { previewerLlmsTxtPlugin } from "./plugins/previewer-llms-txt";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(__dirname, "..", "app");

// Resolve @mdx-js/react from previewer's own node_modules so the host project
// doesn't need to install it.
const require = createRequire(import.meta.url);
const mdxReactEntry = require.resolve("@mdx-js/react");

export function createPreviewerViteConfig(options: {
  /** Host project root directory for discovering preview files and CSS. */
  root: string;
  glob: string;
  css?: string;
  /** Title used in the sidebar header, HTML page title, and llms.txt heading */
  title: string;
  /** GitHub repository configuration */
  repo?: PreviewerRepo;
  /** Vite configuration overrides */
  vite?: {
    plugins?: PluginOption[];
  };
}): InlineConfig {
  return {
    configFile: false,
    // Use the previewer's own app/ directory as Vite root so that
    // app/index.html is served directly — no HTML injection middleware needed.
    root: APP_DIR,
    publicDir: false,
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
      previewCodePlugin(),
      {
        enforce: "pre",
        ...mdx({
          remarkPlugins: [
            remarkGfm,
            remarkFrontmatter,
            [remarkMdxFrontmatter, { name: "frontmatter" }],
          ],
          providerImportSource: "@mdx-js/react",
        }),
      } as Plugin,
      react({ include: /\.(jsx|tsx)$/ }),
      ...(options.vite?.plugins ?? []),
      previewerEntriesPlugin(options.root, options.glob),
      previewerCssPlugin(options.root, options.css),
      previewerConfigPlugin(options.title, options.repo),
      previewerHtmlTitlePlugin(options.title),
      ...(options.repo?.url
        ? [previewerLlmsTxtPlugin(options.title, options.root, options.glob, options.repo)]
        : []),
    ],
  };
}
