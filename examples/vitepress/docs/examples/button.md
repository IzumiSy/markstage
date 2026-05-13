# Button

AppShell の Button コンポーネントのプレビュー例です。

## Basic Usage

```tsx preview
import { Button } from "@tailor-platform/app-shell"

export default (
  <Button>Click me</Button>
)
```

## Variants

```tsx preview wrap="row"
import { Button } from "@tailor-platform/app-shell"

export default (
  <>
    <Button variant="default">Default</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="destructive">Destructive</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="link">Link</Button>
  </>
)
```
