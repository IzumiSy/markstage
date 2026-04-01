# @izumisy/markstage

CLI and programmatic API for Markstage — a zero-config component previewer for React projects.

Drop Markdown files into `docs/` with `` ```tsx preview `` fenced blocks and get a Vite-powered dev server with live component previews and syntax-highlighted source code.

## Install

```bash
pnpm add -D @izumisy/markstage
```

## CLI

```bash
npx markstage dev       # Start dev server (default port 3040)
npx markstage build     # Build static output
npx markstage preview   # Preview the production build locally
```

## Writing Previews

Create a Markdown file under `docs/`:

````md
---
title: Button
description: A versatile button component.
---

## Default

```tsx preview
import { Button } from "./Button"

<Button variant="default">Click me</Button>
```
````

Each `` ```tsx preview `` block is rendered as a live component alongside collapsible, syntax-highlighted source code. Previews run in isolated iframes so host styles never leak.

### Preview Modes

| Mode | Syntax | Behavior |
|------|--------|----------|
| **inline** (default) | `` ```tsx preview `` | Rendered inline within the page |
| **standalone** | `` ```tsx preview standalone `` | Rendered in a dedicated full-viewport page at `/__preview/{blockId}` |

Standalone mode is useful for portal/overlay components (Dropdown, Sheet, Dialog) and full-page layouts that need the entire viewport.

### Block Options

Options can be set as `key="value"` pairs or boolean flags in the fence meta:

````md
```tsx preview wrap="row" height="200"
<Button>A</Button>
<Button>B</Button>
```
````

| Option | Description |
|--------|-------------|
| `wrap` | Layout mode: `"row"` (horizontal with gap) or `"column"` (vertical with gap) |
| `height` | Fixed iframe height (e.g. `"200"`) |
| `standalone` | Boolean flag — render in a separate full-viewport page |

### Frontmatter

| Field | Description |
|-------|-------------|
| `title` | Display name in the sidebar and page header |
| `description` | Short description shown below the title |

## Configuration

Create a `previewer.config.ts` at your project root:

```ts
import { defineConfig } from "@izumisy/markstage";

export default defineConfig({
  title: "My Component Library",
  glob: "docs/**/*.md",              // default
  previewCss: "./src/globals.css",   // optional
  vite: {
    plugins: [],                     // extra Vite plugins
  },
});
```

| Option | Description |
|--------|-------------|
| `title` | Sidebar header and HTML `<title>` |
| `glob` | Glob pattern for Markdown files (default `docs/**/*.md`) |
| `previewCss` | CSS file imported into preview blocks (e.g. your design system's stylesheet) |
| `vite.plugins` | Additional Vite plugins (e.g. `@tailwindcss/vite`) |

## Programmatic API

```ts
import { startDev, runBuild, defineConfig, createPreviewerViteConfig } from "@izumisy/markstage";
```

| Export | Description |
|--------|-------------|
| `defineConfig(config)` | Type helper for `previewer.config.ts` |
| `startDev(options)` | Start the Vite dev server |
| `runBuild(options)` | Run the production build |
| `runPreview(options)` | Preview the production build |
| `createPreviewerViteConfig(options)` | Generate the Vite `InlineConfig` used internally |
| `extractPreviewBlocks(source)` | Parse `` ```tsx preview `` blocks from a Markdown string |

## License

MIT
