---
title: Table
description: AppShell Table component
---

# Table

AppShell の Table コンポーネントのプレビュー例です。

## Basic Usage

```tsx preview height="500"
import { Table } from "@tailor-platform/app-shell"

export default (
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head>Name</Table.Head>
        <Table.Head>Status</Table.Head>
        <Table.Head>Role</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      <Table.Row>
        <Table.Cell>Alice</Table.Cell>
        <Table.Cell>Active</Table.Cell>
        <Table.Cell>Admin</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell>Bob</Table.Cell>
        <Table.Cell>Inactive</Table.Cell>
        <Table.Cell>User</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell>Charlie</Table.Cell>
        <Table.Cell>Active</Table.Cell>
        <Table.Cell>Editor</Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table.Root>
)
```

## With Caption and Footer

```tsx preview height="500"
import { Table } from "@tailor-platform/app-shell"

export default (
  <Table.Root>
    <Table.Caption>Monthly expenses</Table.Caption>
    <Table.Header>
      <Table.Row>
        <Table.Head>Category</Table.Head>
        <Table.Head>Amount</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      <Table.Row>
        <Table.Cell>Rent</Table.Cell>
        <Table.Cell>$1,200</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell>Utilities</Table.Cell>
        <Table.Cell>$300</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.Cell>Groceries</Table.Cell>
        <Table.Cell>$500</Table.Cell>
      </Table.Row>
    </Table.Body>
    <Table.Footer>
      <Table.Row>
        <Table.Cell>Total</Table.Cell>
        <Table.Cell>$2,000</Table.Cell>
      </Table.Row>
    </Table.Footer>
  </Table.Root>
)
```
