declare module "virtual:previewer-entries" {
  import type { ComponentType } from "react";
  interface PreviewEntryFrontmatter {
    title?: string;
    description?: string;
  }
  interface PreviewEntry {
    name: string;
    Component: ComponentType;
    frontmatter: PreviewEntryFrontmatter;
    /** File path relative to the host project root */
    filePath: string;
  }
  export const entries: PreviewEntry[];
}

declare module "virtual:previewer-css" {}

declare module "virtual:markstage-preview-registry" {
  export const registry: Record<
    string,
    () => Promise<{ default: import("react").FC; css: string }>
  >;
}

declare const __PREVIEWER_TITLE__: string;
declare const __PREVIEWER_REPO__: { url: string; ref: string } | null;
