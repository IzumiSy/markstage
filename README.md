# Markstage

A lightweight toolkit for live-previewing React components directly from Markdown. Write `` ```tsx preview `` fenced blocks and get instant rendered output — powered by Vite.

## Packages

| Package | Description |
|---------|-------------|
| [`@izumisy/markstage`](packages/markstage/) | CLI & programmatic API — run a standalone preview server with `markstage dev` / `markstage build` |
| [`@izumisy/react-preview`](packages/react-preview/) | Vite plugin & utilities — preview block parsing, Shadow DOM rendering, standalone preview page generation |
| [`@izumisy/vitepress-plugin-react-preview`](packages/vitepress-plugin-react-preview/) | VitePress plugin — live React component previews inside a VitePress site |

## Examples

| Example | Description |
|---------|-------------|
| [`example-cli`](examples/cli/) | Standalone preview server using the `@izumisy/markstage` CLI |
| [`example-vitepress`](examples/vitepress/) | VitePress integration with `@izumisy/vitepress-plugin-react-preview` |

## Quick Start

```bash
pnpm add -D @izumisy/markstage

npx markstage dev      # dev server (port 3040)
npx markstage build    # static build
```

See the [`@izumisy/markstage` README](packages/markstage/) for configuration and usage details.

## License

MIT
