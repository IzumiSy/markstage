# Combobox

AppShell の Combobox コンポーネントのプレビュー例です。

## Basic Usage

```tsx preview height="300"
import { Combobox } from "@tailor-platform/app-shell"

<Combobox
  items={["Apple", "Banana", "Cherry", "Grape", "Orange"]}
  placeholder="Select a fruit..."
/>
```

## Multiple Selection

```tsx preview height="300"
import { Combobox } from "@tailor-platform/app-shell"

<Combobox
  items={["React", "Vue", "Angular", "Svelte", "Solid"]}
  multiple
  placeholder="Select frameworks..."
/>
```
