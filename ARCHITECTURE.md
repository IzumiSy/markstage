# Architecture

This document describes the internal design and development workflow of Markstage.

## Repository Layout

```
markstage/
├── packages/
│   └── cli/                  # @izumisy/markstage — the published package
│       ├── src/              # Node-side code (CLI, Vite config, plugins)
│       │   ├── cli.ts        # Entry point — `dev` and `build` commands
│       │   ├── config.ts     # PreviewerConfig type + defineConfig helper
│       │   ├── index.ts      # Public API re-exports
│       │   ├── load-config.ts               # Loads previewer.config.* via c12
│       │   ├── vite-config.ts               # Assembles the full Vite InlineConfig
│       │   ├── vite-plugin-preview-code.ts  # Transforms ```tsx preview blocks
│       └── app/                         # Browser-side React app (served by Vite)
│           ├── index.html
│           └── src/
│               ├── main.tsx             # React entry
│               ├── app.tsx              # Shell: sidebar + content area
│               ├── overview.tsx         # Overview grid page
│               ├── preview-block.tsx    # Live preview + collapsible code
│               ├── code-block.tsx       # Shiki syntax highlighting
│               ├── mdx-components.tsx   # MDX component overrides
│               ├── theme.tsx            #  Dark/light theme provider
│               └── virtual-modules.d.ts # Type declarations for virtual modules
├── turbo.json                # Turborepo task definitions
├── pnpm-workspace.yaml       # pnpm workspace config
└── .github/workflows/ci.yml  # CI: format check + lint
```

## Key Design Decisions

### Vite as the Runtime

Markstage does **not** ship a bundled app. Instead it constructs a Vite
`InlineConfig` at runtime and calls `createServer()` (dev) or `build()`.
The `app/` directory is used as Vite's `root`, so `app/index.html` is served
directly without middleware.

### Virtual Modules

Three Vite virtual modules inject dynamic data into the browser app:

| Module | Purpose |
|--------|---------|
| `virtual:previewer-entries` | Imports every discovered `*.preview.mdx` and exports an `entries` array with name, Component, frontmatter, and filePath. |
| `virtual:previewer-config` | Exports `title` and `repo` so the app can render headers and source links. |
| `virtual:previewer-css` | Emits an `@import` for the host project's CSS file (or nothing). |

### Plugin Pipeline

Files go through several transformations before reaching the browser:

1. **`vite-plugin-preview-code`** (enforce: `pre`) — rewrites `` ```tsx preview ``
   fenced blocks into `<PreviewBlock code="...">…</PreviewBlock>` JSX so the MDX
   compiler sees standard markup.
2. **`@mdx-js/rollup`** (enforce: `pre`) — compiles MDX to JSX with remark
   plugins:
   - `remark-gfm` — GitHub-flavoured markdown.
   - `remark-frontmatter` + `remark-mdx-frontmatter` — parse and export YAML
     frontmatter.
3. **`@vitejs/plugin-react`** — handles JSX/TSX compilation.

### Framework Isolation

Markstage bundles its own `@mdx-js/react` and resolves it via a Vite alias so
the host project does not need to install it.

## Build

The CLI package is compiled with **tsdown** (a fast TypeScript bundler built on
esbuild / Rollup):

```bash
pnpm build        # turbo run build
```

Entry points defined in `tsdown.config.ts`:

- `src/cli.ts`  → `dist/cli.mjs`  (the bin executable)
- `src/index.ts` → `dist/index.mjs` + `dist/index.d.mts` (library exports)

The `app/` directory is **not** compiled — it is shipped as-is and processed by
Vite at runtime in the host project.

## Development

```bash
pnpm install          # install all workspace dependencies
pnpm dev              # tsdown --watch (rebuild on change)
pnpm type-check       # tsc --incremental
pnpm lint             # oxlint
pnpm fmt              # oxfmt --write
pnpm fmt:check        # oxfmt --check (CI)
```

All commands are orchestrated by Turborepo. Run them from the repo root and
Turbo will execute the correct scripts in each workspace package.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on pushes to `main` and on
pull requests:

1. `pnpm fmt:check` — verify formatting with oxfmt.
2. `pnpm lint` — run oxlint.

## Adding a New Package

1. Create a directory under `packages/`.
2. Add a `package.json` with the desired name and scripts.
3. If the new package has `build`, `lint`, `fmt`, `fmt:check`, or `type-check`
   scripts, Turbo will pick them up automatically via the task definitions in
   `turbo.json`.
