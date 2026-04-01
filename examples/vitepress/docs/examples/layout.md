---
title: Layout
description: AppShell Layout component
---

# Layout

AppShell の Layout コンポーネントのプレビュー例です。全画面レイアウトのため、standalone プレビューで確認してください。

## 2 Columns

```tsx preview standalone align="start"
import { Layout, Button } from "@tailor-platform/app-shell"

<Layout>
  <Layout.Header
    title="Order #12345"
    actions={[
      <Button key="edit" variant="outline">Edit</Button>,
      <Button key="delete" variant="destructive">Delete</Button>,
    ]}
  />
  <Layout.Column>
    <div style={{ padding: "16px", background: "#f9fafb", borderRadius: 8 }}>
      <h3 style={{ margin: "0 0 8px" }}>Main Content</h3>
      <p style={{ margin: 0, color: "#666" }}>Primary content area with flexible width.</p>
    </div>
  </Layout.Column>
  <Layout.Column>
    <div style={{ padding: "16px", background: "#f9fafb", borderRadius: 8 }}>
      <h3 style={{ margin: "0 0 8px" }}>Sidebar</h3>
      <p style={{ margin: 0, color: "#666" }}>Fixed 280px sidebar on desktop.</p>
    </div>
  </Layout.Column>
</Layout>
```

## 3 Columns

```tsx preview standalone align="start"
import { Layout } from "@tailor-platform/app-shell"

<Layout>
  <Layout.Header title="Dashboard" />
  <Layout.Column>
    <div style={{ padding: "16px", background: "#f9fafb", borderRadius: 8 }}>
      <h3 style={{ margin: "0 0 8px" }}>Navigation</h3>
      <p style={{ margin: 0, color: "#666" }}>Left sidebar — fixed 320px.</p>
    </div>
  </Layout.Column>
  <Layout.Column>
    <div style={{ padding: "16px", background: "#f9fafb", borderRadius: 8 }}>
      <h3 style={{ margin: "0 0 8px" }}>Main Content</h3>
      <p style={{ margin: 0, color: "#666" }}>Flexible center column.</p>
    </div>
  </Layout.Column>
  <Layout.Column>
    <div style={{ padding: "16px", background: "#f9fafb", borderRadius: 8 }}>
      <h3 style={{ margin: "0 0 8px" }}>Activity</h3>
      <p style={{ margin: 0, color: "#666" }}>Right sidebar — fixed 280px.</p>
    </div>
  </Layout.Column>
</Layout>
```

## Single Column with Header

```tsx preview standalone
import { Layout, Button } from "@tailor-platform/app-shell"

<Layout>
  <Layout.Header
    title="Settings"
    actions={[<Button key="save">Save Changes</Button>]}
  />
  <Layout.Column>
    <div style={{ padding: "16px", background: "#f9fafb", borderRadius: 8 }}>
      <h3 style={{ margin: "0 0 8px" }}>Account Settings</h3>
      <p style={{ margin: 0, color: "#666" }}>Full-width single column layout.</p>
    </div>
  </Layout.Column>
</Layout>
```
