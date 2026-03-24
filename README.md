# Markstage

A component previewer and documentation generator for React / TypeScript projects.

Drop `*.preview.mdx` files next to your components and Markstage gives you a dev
server with live previews, syntax-highlighted code blocks, and an LLM-friendly
`llms.txt` endpoint — all powered by Vite.

## Features

- **Live component preview** — write `tsx preview` fenced blocks in MDX and see
  rendered output alongside collapsible source code.
- **LLMs.txt generation** — serve a machine-readable summary of every documented
  component at `/llms.txt`.
- **GitHub source links** — link each preview page back to its source file on
  GitHub.
- **Dark / light theme** — built-in toggle with system-preference detection.
- **Zero config to start** — sensible defaults; customise with a
  `previewer.config.ts` when needed.

## Quick Start

```bash
# Install
pnpm add -D @izumisy/markstage

# Start the dev server (port 3040)
npx markstage dev

# Build static output
npx markstage build
```

## Configuration

Create a `previewer.config.ts` at your project root:

```ts
import { defineConfig } from "@izumisy/markstage";

export default defineConfig({
  title: "My Component Library",
  glob: "src/**/*.preview.mdx",          // default
  css: "./src/globals.css",              // optional
  repo: {
    url: "https://github.com/user/repo",
    ref: "main",                         // branch, tag, or SHA
  },
  vite: {
    plugins: [],                         // extra Vite plugins
  },
});
```

| Option | Description |
|--------|-------------|
| `title` | Sidebar header, HTML `<title>`, and llms.txt heading |
| `glob` | Glob pattern for preview MDX files (default `src/**/*.preview.mdx`) |
| `css` | CSS file to import in the previewer app |
| `repo` | GitHub repository for "View source" links |
| `vite.plugins` | Additional Vite plugins (e.g. `@tailwindcss/vite`) |

## Writing Previews

Create a `*.preview.mdx` file next to any component:

````mdx
---
title: Button
description: A versatile button component.
status: stable
sidebar:
  group: Inputs
  order: 1
---

## Default

```tsx preview
<Button variant="default">Click me</Button>
```

````

### Frontmatter

| Field | Description |
|-------|-------------|
| `title` | Display name in the sidebar and header |
| `description` | Short description shown below the title |
| `status` | Badge: `stable`, `beta`, `experimental`, or `deprecated` |
| `sidebar.group` | Group name in the sidebar |
| `sidebar.order` | Sort order within the group |
| `hidden` | Set to `true` to hide from the sidebar |

## License

MIT
