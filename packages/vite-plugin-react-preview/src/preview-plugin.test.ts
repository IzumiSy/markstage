import { describe, it, expect, vi } from "vitest";
import { createPreviewHooks } from "./preview-plugin";
import type { PreviewBlockEntry } from "./preview-utils";
import {
  VIRTUAL_PREFIX,
  REGISTRY_MODULE_ID,
  STANDALONE_CLIENT_MODULE_ID,
} from "./preview-module";

function setupHooks(
  entries?: Map<string, PreviewBlockEntry>,
  cssImport?: string,
) {
  const blockRegistry = entries ?? new Map<string, PreviewBlockEntry>();
  return createPreviewHooks({ blockRegistry, cssImport });
}

describe("createPreviewHooks", () => {
  describe("resolveId", () => {
    it("resolves registry module ID", () => {
      const { resolveId } = setupHooks();
      const result = resolveId.call({}, REGISTRY_MODULE_ID);
      expect(result).toBe("\0" + REGISTRY_MODULE_ID);
    });

    it("resolves standalone client module ID", () => {
      const { resolveId } = setupHooks();
      const result = resolveId.call({}, STANDALONE_CLIENT_MODULE_ID);
      expect(result).toBe("\0" + STANDALONE_CLIENT_MODULE_ID);
    });

    it("resolves virtual preview module ID", () => {
      const { resolveId } = setupHooks();
      const result = resolveId.call({}, VIRTUAL_PREFIX + "abc12345");
      expect(result).toBe("\0" + VIRTUAL_PREFIX + "abc12345.tsx");
    });

    it("strips leading / from URL-style requests", () => {
      const { resolveId } = setupHooks();
      const result = resolveId.call({}, "/" + REGISTRY_MODULE_ID);
      expect(result).toBe("\0" + REGISTRY_MODULE_ID);
    });

    it("strips leading / from virtual preview module URLs", () => {
      const { resolveId } = setupHooks();
      const result = resolveId.call({}, "/" + VIRTUAL_PREFIX + "abc12345");
      expect(result).toBe("\0" + VIRTUAL_PREFIX + "abc12345.tsx");
    });

    it("returns null for non-virtual IDs", () => {
      const { resolveId } = setupHooks();
      expect(resolveId.call({}, "react")).toBeNull();
      expect(resolveId.call({}, "./Button")).toBeNull();
      expect(resolveId.call({}, "some-package")).toBeNull();
    });

    it("delegates resolution for imports within preview modules", () => {
      const registry = new Map<string, PreviewBlockEntry>();
      registry.set("abc12345", {
        code: "<Button />",
        sourceFile: "/project/src/Button.md",
      });
      const { resolveId } = setupHooks(registry);

      const mockResolve = vi.fn().mockReturnValue("/resolved/path");
      const ctx = { resolve: mockResolve };

      const importer = "\0" + VIRTUAL_PREFIX + "abc12345.tsx";
      resolveId.call(ctx, "./Button", importer);

      expect(mockResolve).toHaveBeenCalledWith(
        "./Button",
        "/project/src/Button.md",
        {
          skipSelf: true,
        },
      );
    });

    it("does not delegate if importer block has no sourceFile", () => {
      const registry = new Map<string, PreviewBlockEntry>();
      registry.set("abc12345", {
        code: "<Button />",
        sourceFile: "",
      });
      const { resolveId } = setupHooks(registry);

      const mockResolve = vi.fn();
      const ctx = { resolve: mockResolve };

      const importer = "\0" + VIRTUAL_PREFIX + "abc12345.tsx";
      resolveId.call(ctx, "./Button", importer);

      expect(mockResolve).not.toHaveBeenCalled();
    });
  });

  describe("load", () => {
    it("generates registry module with all block entries", () => {
      const registry = new Map<string, PreviewBlockEntry>();
      registry.set("aaa11111", {
        code: "<A />",
        sourceFile: "/a.md",
      });
      registry.set("bbb22222", {
        code: "<B />",
        sourceFile: "/b.md",
      });
      const { load } = setupHooks(registry);

      const code = load("\0" + REGISTRY_MODULE_ID);
      expect(code).toContain("export const registry");
      expect(code).toContain('"aaa11111"');
      expect(code).toContain('"bbb22222"');
      expect(code).toContain(`import("${VIRTUAL_PREFIX}aaa11111")`);
      expect(code).toContain(`import("${VIRTUAL_PREFIX}bbb22222")`);
    });

    it("generates empty registry when no blocks", () => {
      const { load } = setupHooks();
      const code = load("\0" + REGISTRY_MODULE_ID);
      expect(code).toBe("export const registry = {\n\n};\n");
    });

    it("generates standalone client code", () => {
      const { load } = setupHooks();
      const code = load("\0" + STANDALONE_CLIENT_MODULE_ID);
      expect(code).toContain("createRoot");
      expect(code).toContain("registry[blockId]");
      expect(code).toContain("ResizeObserver");
      expect(code).toContain("mrp-resize");
    });

    it("generates preview module code for a known blockId", () => {
      const registry = new Map<string, PreviewBlockEntry>();
      registry.set("abc12345", {
        code: 'import { Button } from "./Button"\nexport default function Preview() { return <Button>Click</Button> }',
        sourceFile: "/src/Button.md",
      });
      const { load } = setupHooks(registry, "@my-lib/styles");

      const code = load("\0" + VIRTUAL_PREFIX + "abc12345.tsx");
      expect(code).toContain("export default function Preview()");
      expect(code).toContain("<Button>Click</Button>");
      expect(code).toContain("@my-lib/styles?inline");
    });

    it("returns undefined for unknown blockId", () => {
      const { load } = setupHooks();
      const code = load("\0" + VIRTUAL_PREFIX + "unknown00.tsx");
      expect(code).toBeUndefined();
    });

    it("returns undefined for non-virtual IDs", () => {
      const { load } = setupHooks();
      expect(load("react")).toBeUndefined();
      expect(load("./Button")).toBeUndefined();
    });
  });
});
