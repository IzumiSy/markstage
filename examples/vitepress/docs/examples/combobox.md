# Combobox

AppShell の Combobox コンポーネントのプレビュー例です。

## Basic Usage

```tsx preview height="300" align="start"
import { Combobox } from "@tailor-platform/app-shell"

export default (
  <Combobox
    items={["Apple", "Banana", "Cherry", "Grape", "Orange"]}
    placeholder="Select a fruit..."
  />
)
```

## Multiple Selection

```tsx preview height="300" align="start"
import { Combobox } from "@tailor-platform/app-shell"

export default (
  <Combobox
    items={["React", "Vue", "Angular", "Svelte", "Solid"]}
    multiple
    placeholder="Select frameworks..."
  />
)
```
