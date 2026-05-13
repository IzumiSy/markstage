---
title: Sheet
description: AppShell Sheet component
---

# Sheet

AppShell の Sheet コンポーネントのプレビュー例です。

## Basic Usage

```tsx preview height="500"
import { Sheet, Button } from "@tailor-platform/app-shell"

export default (
  <Sheet.Root>
    <Sheet.Trigger render={<Button />}>Open Sheet</Sheet.Trigger>
    <Sheet.Content>
      <Sheet.Header>
        <Sheet.Title>Sheet Title</Sheet.Title>
        <Sheet.Description>This is a basic sheet example.</Sheet.Description>
      </Sheet.Header>
      <div style={{ padding: "16px" }}>
        <p>Sheet content goes here.</p>
      </div>
      <Sheet.Footer>
        <Sheet.Close render={<Button variant="outline" />}>Close</Sheet.Close>
      </Sheet.Footer>
    </Sheet.Content>
  </Sheet.Root>
)
```

## Side Variants

```tsx preview wrap="row" height="500"
import { Sheet, Button } from "@tailor-platform/app-shell"

export default (
  <>
    <Sheet.Root side="right">
      <Sheet.Trigger render={<Button variant="outline" />}>Right</Sheet.Trigger>
      <Sheet.Content>
        <Sheet.Header>
          <Sheet.Title>Right Sheet</Sheet.Title>
          <Sheet.Description>Opens from the right side.</Sheet.Description>
        </Sheet.Header>
      </Sheet.Content>
    </Sheet.Root>

    <Sheet.Root side="left">
      <Sheet.Trigger render={<Button variant="outline" />}>Left</Sheet.Trigger>
      <Sheet.Content>
        <Sheet.Header>
          <Sheet.Title>Left Sheet</Sheet.Title>
          <Sheet.Description>Opens from the left side.</Sheet.Description>
        </Sheet.Header>
      </Sheet.Content>
    </Sheet.Root>

    <Sheet.Root side="bottom">
      <Sheet.Trigger render={<Button variant="outline" />}>Bottom</Sheet.Trigger>
      <Sheet.Content>
        <Sheet.Header>
          <Sheet.Title>Bottom Sheet</Sheet.Title>
          <Sheet.Description>Opens from the bottom.</Sheet.Description>
        </Sheet.Header>
      </Sheet.Content>
    </Sheet.Root>
  </>
)
```
