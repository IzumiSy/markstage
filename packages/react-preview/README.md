# @izumisy/react-preview

Low-level Vite plugin and utilities for rendering React component previews. This package is the shared engine used by both `@izumisy/markstage` (CLI) and `@izumisy/vitepress-plugin-react-preview` (VitePress integration).

## Features

- **Preview block parsing** — `parseMeta()` extracts options (`wrap`, `height`, `standalone`, …) from fenced code block meta strings
- **Virtual module generation** — each preview block becomes a virtual Vite module (`virtual:markstage-preview-{blockId}`) containing the component code, CSS import, and a default export
- **Standalone preview pages** — generates full-viewport HTML pages served at `/__preview/{blockId}` with theme support (`?theme=dark|light`)
- **Block registry** — a shared `Map<string, PreviewBlockEntry>` that tracks discovered blocks and coordinates between the markdown parser and Vite plugin
- **Browser-safe sub-path** — `@izumisy/react-preview/dom` exports constants without pulling in Node.js dependencies, safe for browser/Vue SFC imports

## Exports

### `@izumisy/react-preview` (main)

| Export | Description |
|--------|-------------|
| `createBasePreviewPlugin(name, options)` | Creates the core Vite plugin array (resolve/load/transform + dev server middleware) |
| `createPreviewBuildPlugin(options)` | Vite plugin for production builds — emits standalone HTML pages for each block |
| `createPreviewHooks(options)` | Lower-level hooks (`resolveId`, `load`, `transform`) for custom plugin composition |
| `generatePreviewModuleCode(blockId, entry, css?)` | Generates the virtual module source for a single preview block |
| `generateStandaloneHtml(scriptSrc)` | Generates the HTML shell for standalone preview pages |
| `parseMeta(meta)` | Parses `key="value"` pairs and boolean flags from fence meta strings |
| `simpleHash(str)` | MD5-based short hash for generating block IDs |
| `resolveCssImportPath(css, hostRoot?)` | Resolves CSS import paths (package specifiers vs relative paths) |

### `@izumisy/react-preview/dom` (browser-safe)

| Export | Description |
|--------|-------------|
| `WRAP_STYLES` | Layout style map (`row`, `column`) |
| `ALIGN_STYLES` | Alignment style map (`center`, `start`, `end`) |

## Usage

This package is not typically used directly. It is consumed by:

- **`@izumisy/markstage`** — uses `createBasePreviewPlugin` and `createPreviewBuildPlugin` to power the CLI preview server
- **`@izumisy/vitepress-plugin-react-preview`** — uses the same plugins to integrate previews into VitePress

If you are building a custom integration, use `createBasePreviewPlugin()` with a block registry:

```ts
import { createBasePreviewPlugin, type PreviewBlockEntry } from "@izumisy/react-preview";

const blockRegistry = new Map<string, PreviewBlockEntry>();

const plugins = createBasePreviewPlugin("my-preview-plugin", {
  blockRegistry,
  cssImport: "@my-lib/styles",
});
```

## License

MIT
