import type { PluginOption } from "vite";
import type { PluggableList } from "unified";

export type PreviewerConfig = {
  title: string;
  /** Glob pattern for preview markdown files (default: "docs/**\/*.md") */
  glob?: string;
  /** CSS file to import in the previewer app (e.g. "./src/globals.css") */
  previewCss?: string;
  /** Vite configuration overrides */
  vite?: {
    /** Additional Vite plugins (e.g. @tailwindcss/vite for Tailwind support) */
    plugins?: PluginOption[];
  };
  /** MDX processing options */
  mdx?: {
    /** Additional remark plugins (appended after built-in plugins) */
    remarkPlugins?: PluggableList;
    /** Additional rehype plugins */
    rehypePlugins?: PluggableList;
  };
};

export const DEFAULT_GLOB = "docs/**/*.md";

export function defineConfig(config: PreviewerConfig): PreviewerConfig {
  return config;
}
