# Markstage

A component previewer and documentation generator for React / TypeScript projects.

Drop `*.preview.mdx` files next to your components and Markstage gives you a dev server with live previews, syntax-highlighted code blocks, and an LLM-friendly `llms.txt` endpoint — all powered by Vite.

## Features

### 🔴 Live Component Preview

Write `` ```tsx preview `` fenced blocks in MDX and see rendered output alongside collapsible, syntax-highlighted source code. Components are resolved directly from your project — no separate sandbox or iframe needed.

### 🤖 LLMs.txt Generation

Automatically serve a machine-readable summary of every documented component at `/llms.txt`. AI coding assistants can consume this endpoint to understand your component library without parsing HTML.


### ⚡ Zero Config

Sensible defaults out of the box. Just place a `*.preview.mdx` file and run `npx markstage dev`. Customise later with a `previewer.config.ts` when needed.

## Motivation

Full-featured tools like [Storybook](https://storybook.js.org/) and [Astro Starlight](https://starlight.astro.build/) are excellent — they cover a wide range of use cases from interactive component workshops to rich documentation sites. When your project reaches a scale that demands those capabilities, they are the right choice.

But in many cases, especially in the early stages of a project, what you really need is much simpler: **drop an MDX file next to your component and instantly get a live preview with an AI-readable catalogue.**

That is what Markstage does. With zero configuration, a single `*.preview.mdx` file gives you:

- A live component preview with syntax-highlighted source code
- A built-in `/llms.txt` endpoint so AI tools can understand your components
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
sidebar:
  group: Inputs
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
