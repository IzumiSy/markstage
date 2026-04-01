import { parseMeta } from "@izumisy/vite-plugin-react-preview";

const PREVIEW_FENCE_RE = /```tsx preview(.*?)\n([\s\S]*?)```/g;

export type PreviewBlock = {
  /** The raw code inside the fenced block (trimmed trailing newline) */
  code: string;
  /** Start index of the full match in the source string */
  start: number;
  /** End index of the full match in the source string */
  end: number;
  /** Meta attributes parsed from the code fence info string */
  meta: Record<string, string>;
};

/**
 * Extract all ` ```tsx preview ` fenced code blocks from a markdown/mdx string.
 * Returns an array of blocks with their code and positions.
 */
export function extractPreviewBlocks(source: string): PreviewBlock[] {
  const blocks: PreviewBlock[] = [];
  const re = new RegExp(PREVIEW_FENCE_RE.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    blocks.push({
      code: match[2].replace(/\n$/, ""),
      start: match.index,
      end: match.index + match[0].length,
      meta: parseMeta(match[1]),
    });
  }
  return blocks;
}

export function escapeJsString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

/**
 * Check whether a source string contains ` ```tsx preview ` blocks.
 */
export function hasPreviewBlocks(source: string): boolean {
  return source.includes("tsx preview");
}
