import { createHash } from "node:crypto";

export interface PreviewBlockEntry {
  code: string;
  sourceFile: string;
  wrap?: string;
  height?: string;
}

export function simpleHash(str: string): string {
  return createHash("md5").update(str).digest("hex").slice(0, 8);
}

/**
 * Parse key="value" pairs from a meta string.
 */
export function parseMeta(meta: string): Record<string, string> {
  const result: Record<string, string> = {};
  const re = /(\w+)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(meta)) !== null) {
    result[m[1]] = m[2];
  }
  return result;
}
