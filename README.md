# Markstage

A component previewer and documentation generator for React / TypeScript projects.

Drop Markdown files into `docs/` and Markstage gives you a dev server with live previews and syntax-highlighted code blocks — all powered by Vite.

## Features

### 🔴 Live Component Preview

Write `` ```tsx preview `` fenced blocks in Markdown and see rendered output alongside collapsible, syntax-highlighted source code. Each preview is rendered in an isolated iframe so host styles never leak into your components.

### ⚡ Zero Config

Sensible defaults out of the box. Just place a Markdown file under `docs/` and run `npx markstage dev`. Customise later with a `previewer.config.ts` when needed.

## Motivation

Full-featured tools like [Storybook](https://storybook.js.org/) and [Astro Starlight](https://starlight.astro.build/) are excellent — they cover a wide range of use cases from interactive component workshops to rich documentation sites. When your project reaches a scale that demands those capabilities, they are the right choice.

But in many cases, especially in the early stages of a project, what you really need is much simpler: **drop a Markdown file next to your component and instantly get a live preview.**

That is what Markstage does. With zero configuration, a single Markdown file gives you:

- A live component preview with syntax-highlighted source code
- A fast Vite-powered dev server that starts in seconds

Markstage intentionally keeps its API surface small. There is no story format to learn, no plugin ecosystem to navigate, and no separate build pipeline to maintain. This means that when your documentation needs outgrow Markstage, migrating to Storybook or Starlight is straightforward — your MDX content and component code stay the same, and there is no proprietary abstraction to unwind.

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
  previewCss: "./src/globals.css",       // optional
  vite: {
    plugins: [],                         // extra Vite plugins
  },
});
```

| Option | Description |
|--------|-------------|
| `title` | Sidebar header and HTML `<title>` |
| `glob` | Glob pattern for preview MDX files (default `src/**/*.preview.mdx`) |
| `previewCss` | CSS file to import in the previewer app |
| `vite.plugins` | Additional Vite plugins (e.g. `@tailwindcss/vite`) |

## Writing Previews

Create a Markdown file under `docs/` (or the directory matching your `glob` pattern):

````mdx
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

### Frontmatter

| Field | Description |
|-------|-------------|
| `title` | Display name in the sidebar and header |
| `description` | Short description shown below the title |

## License

MIT
