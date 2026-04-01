import { createHash } from "node:crypto";
import { resolve } from "node:path";

export interface PreviewBlockEntry {
  code: string;
  sourceFile: string;
  wrap?: string;
  height?: string;
  standalone?: boolean;
}

export function simpleHash(str: string): string {
  return createHash("md5").update(str).digest("hex").slice(0, 8);
}

/**
 * Parse key="value" pairs and boolean flags from a meta string.
 */
export function parseMeta(meta: string): Record<string, string> {
  const result: Record<string, string> = {};
  const kvRe = /(\w+)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = kvRe.exec(meta)) !== null) {
    result[m[1]] = m[2];
  }
  // Strip key="value" pairs, then match remaining standalone words as flags
  const remaining = meta.replace(kvRe, "");
  const flagRe = /\b(\w+)\b/g;
  while ((m = flagRe.exec(remaining)) !== null) {
    if (!(m[1] in result)) {
      result[m[1]] = "true";
    }
  }
  return result;
}

/**
 * Resolve a CSS path for Vite consumption.
 *
 * - Bare package specifiers (e.g. "@foo/bar/styles", "some-pkg/styles.css")
 *   are returned as-is so Vite resolves them from node_modules.
 * - Relative or absolute paths are resolved against `hostRoot`.
 */
export function resolveCssImportPath(css: string, hostRoot?: string): string {
  const isPackageSpecifier =
    css.startsWith("@") || (!css.startsWith(".") && !css.startsWith("/"));
  if (isPackageSpecifier) return css;
  if (hostRoot) return resolve(hostRoot, css);
  return css;
}
