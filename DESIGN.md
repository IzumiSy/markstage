# Design

markstage の設計方針をまとめたドキュメント。

## Background

我々はReactアプリケーション向けのコンポーネントライブラリを開発している。コンポーネントには以下の種類がある:

- **Primitive**: Button, Badge, Input など
- **Portal/Overlay**: Dropdown, Sheet, Dialog など (portalを利用)
- **Layout**: Dashboard, Sidebar+Content など (画面全体の構造を決定)
- **Data display**: Table, DataGrid など

別repoにVitePress製のplatform documentサイトがあり、その中にinlineでコンポーネントをカタログするセクションがある。この体験は一気通貫にしたく、別サイトに分けたくない。

### 制約・要件

1. VitePressのスタイルによるコンポーネントライブラリのスタイル汚染を防ぎたい
2. VitePressがサポートするダークモードには連動させたい
3. VitePress製docサイトへの変更反映は、コンポーネントライブラリが持つdocソース (`.md`) をファイルsyncすることで行う
4. コンポーネントライブラリ開発者はローカルおよびNetlify/VercelなどのSaaSでdocsのプレビューを行いたい

## プレビューモードの分離

全コンポーネントを「inline preview」に押し込むのではなく、コンポーネントの性質に応じたプレビューモードを用意する。

| カテゴリ | 例 | プレビューモード |
|---|---|---|
| Primitive | Button, Badge, Input | **inline** (Shadow DOM) |
| Portal/Overlay | Dropdown, Sheet, Dialog | **standalone** (別ページ) |
| Layout | Dashboard, Sidebar+Content | **standalone** (別ページ) |

````markdown
## Button (inline)
```tsx preview
<Button>Click me</Button>
```

## Sheet (standalone)
```tsx preview standalone
<Sheet.Root>...</Sheet.Root>
```

## Dashboard Layout (standalone)
```tsx preview standalone
<DashboardLayout>...</DashboardLayout>
```
````

### inline モード (デフォルト)

- VitePress上: Shadow DOM内でライブレンダリング
- スタイル分離あり、ダークモード連動あり

### standalone モード

- VitePress上: コードブロック + 「Open full preview」リンク
- リンク先は `/__preview/{blockId}` でfull viewportレンダリング
- VitePressのスタイル汚染ゼロ (完全に別ページ)
- viewport全体を使うコンポーネントを正確に表示

## docソースフォーマット: `.md` に統一

`.preview.mdx` を廃止し、`.md` に統一する。

- VitePressが直接消費できる形式をcanonicalとする
- markstage CLIも `.md` を読み込んでプレビューする
- ファイルsyncは「そのままコピー」で済む (変換レイヤー不要)
- frontmatterはVitePress互換のものを使う

## markstage CLI: 独自UIを大幅簡素化

VitePressのwrapperにはせず、独自UIを極限まで簡素化する。ローカルで実際のコンポーネントUIとmarkdownのコードが確認できれば十分。

```
markstage dev
  → .md ファイルを発見
  → 最小限のHTMLシェル (ファイルリストのみ)
  → markdown rendering + preview block のライブレンダリング
```

- VitePress非依存、軽量で高速
- 本番 (VitePress) との見た目の差異はあるが、コンポーネントのレンダリングは同一なので動作確認としては十分

## ダークモード連動

- VitePress inline: `syncThemeToHost()` でVitePressのテーマ切替に追従
- standaloneプレビューページ: `?theme=dark` URLパラメータで初期テーマを指定
  - VitePressからstandaloneリンクを開く際に、現在のテーマ状態をパラメータとして渡す
  - リンク共有時にもテーマ指定が可能

## CSS変数の管理

- CLIシェル (ファイルリスト、markdownレンダリング等) は自前のハードコードされたCSSで完結する。ホストプロジェクトのCSS変数に依存しない
- ホストCSS (`config.css`) はShadow DOM内のプレビューブロックのみに注入する
- これによりzero-configでCLIが動作し、シェルのスタイルが壊れることがない

## 実装方針

### `parseMeta()` の拡張

`parseMeta()` を拡張し、`key="value"` ペアに加えて value 無しの boolean flag を認識する。
`standalone` のようなflagは `{ standalone: "true" }` として返す。

```
入力: ' standalone wrap="row" height="300"'
出力: { standalone: "true", wrap: "row", height: "300" }
```

### glob のデフォルト値

`docs/**/*.md` をデフォルトとする。ディレクトリ規約でREADME等の混入を防ぐ。

関連する変更箇所:
- `config.ts` → glob default を `"docs/**/*.md"` に変更
- `cli.ts` → 同上
- `vite-plugins/preview.ts` → `.preview.mdx` の拡張子判定を `.md` に変更
- `vite-plugins/entries.ts` → ファイル名抽出ロジックの変更
- `vite-config.ts` → MDX の include 条件を `.md` に拡張
