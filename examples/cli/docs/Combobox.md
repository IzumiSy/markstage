---
title: Combobox
description: AppShell Combobox component
---

# Combobox

AppShell の Combobox コンポーネントのプレビュー例です。

## Basic Usage

```tsx preview height="300" align="start"
import { Combobox } from "@tailor-platform/app-shell"

export default (
  <div style={{ width: "500px" }}>
    <Combobox
      items={["Apple", "Banana", "Cherry", "Grape", "Orange"]}
      placeholder="Select a fruit..."
    />
  </div>
)
```

## Multiple Selection

```tsx preview height="300" align="start"
import { Combobox } from "@tailor-platform/app-shell"

export default (
  <div style={{ width: "500px" }}>
    <Combobox
      items={["React", "Vue", "Angular", "Svelte", "Solid"]}
      multiple
      placeholder="Select frameworks..."
    />
  </div>
)
```
