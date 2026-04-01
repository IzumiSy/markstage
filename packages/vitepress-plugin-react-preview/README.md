# @izumisy/vitepress-plugin-react-preview

VitePress plugin for rendering live React component previews inside your VitePress documentation site.

Transforms `` ```tsx preview `` fenced blocks in Markdown into interactive previews rendered via iframes, with full style isolation and dark mode support.

## Features

- **markdown-it plugin** — rewrites `` ```tsx preview `` blocks into `<PreviewBlock>` Vue components at the Markdown parsing stage
- **Vite plugin** — serves preview modules and standalone preview pages using `@izumisy/vite-plugin-react-preview` under the hood
- **Style isolation** — inline previews render inside iframes; standalone previews run in a separate page
- **Dark mode** — syncs with VitePress theme toggle via `postMessage`
- **Build support** — emits standalone HTML pages (`/__preview/{blockId}.html`) during `vitepress build`

## Install

```bash
pnpm add -D @izumisy/vitepress-plugin-react-preview
```

## Setup

In your VitePress config (`.vitepress/config.ts`):

```ts
import { defineConfig } from "vitepress";
import { createMrpPlugin } from "@izumisy/vitepress-plugin-react-preview";

const mrp = createMrpPlugin({
  css: "@my-lib/styles", // optional: CSS to inject into previews
});

export default defineConfig({
  markdown: {
    config(md) {
      md.use(mrp.markdownIt);
    },
  },
  vite: {
    plugins: [mrp.vite()],
  },
});
```

Then use `<PreviewBlock>` in your theme if needed:

```vue
<script setup>
import PreviewBlock from "@izumisy/vitepress-plugin-react-preview/PreviewBlock.vue";
</script>
```

## Preview Syntax

Works with the same `` ```tsx preview `` syntax as `@izumisy/md-react-preview`:

````md
```tsx preview
import { Button } from "@my-lib"

<Button>Click me</Button>
```

```tsx preview standalone
import { Sheet } from "@my-lib"

<Sheet.Root>...</Sheet.Root>
```
````

- **inline** (default) — rendered within the page via iframe
- **standalone** — shows a code block with a link to a full-viewport preview page

## License

MIT
