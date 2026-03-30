import { createHash } from "node:crypto";

export interface PreviewBlockEntry {
  code: string;
  sourceFile: string;
  wrap?: string;
}

export const blockRegistry = new Map<string, PreviewBlockEntry>();

export function simpleHash(str: string): string {
  return createHash("md5").update(str).digest("hex").slice(0, 8);
}
