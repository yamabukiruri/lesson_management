---
name: ui-components
description: |
  共通UIコンポーネント使用ルール。
  機能開発・UI実装時に src/components/ 配下の共通コンポーネントを優先使用する。
tools: Read, Grep, Glob
version: 1.0.0
updated: 2026-05-30
---

# 共通 UI コンポーネント使用ルール

## 原則

**UI 実装時は `src/components/` 配下の共通コンポーネントを優先使用すること。**
独自のボタン・入力・通知を新規作成する前に、既存の共通コンポーネントを必ず確認する。

## 実装時の手順

1. `src/components/` を Grep/Glob で確認する
2. 用途に合う共通コンポーネントがあればそれを使う
3. なければ MUI を直接使用してよいが、汎用性があるなら共通化を検討する
4. 共通コンポーネントへ置き換える際は、デフォルトのサイズ・余白が崩れないか確認し `sx` で調整する

## 共通コンポーネント索引

| ファイル                   | エクスポート                              | 用途                                   |
| -------------------------- | ----------------------------------------- | -------------------------------------- |
| `@/components/button`      | `MainBtn`, `SubBtn`                        | 主要アクション / サブアクション        |
| `@/components/input`       | `CustomTextField`, `CustomPulldown`, `CustomCheckbox` | テキスト入力 / プルダウン / チェックボックス |
| `@/components/table-cell`  | `CustomTableCell` (default)               | テーブルセル                           |
| `@/components/panel`       | `Panel` (default)                         | パネルレイアウト                       |
| `@/components/title`       | `CardTitle`, `SectionTitle`               | カード見出し / セクション見出し        |
| `@/components/loading`     | `LoadingScreen` (default)                 | ローディング画面                       |
| `@/components/notice`      | `Notice`                                  | 成功・エラー通知（Snackbar + Alert）   |
| `@/components/menu`        | `MenuBar` (default)                       | ナビゲーション（AppBar + Drawer）      |

## 主要コンポーネント props（要点）

props の詳細は実ファイルを Read すること。以下は頻出のみ。

### MainBtn / SubBtn — `@/components/button`

| prop       | 型                       | 必須 | 説明                 |
| ---------- | ------------------------ | ---- | -------------------- |
| `label`    | `string`                 | ○    | ボタン表示文言       |
| `onClick`  | `() => void`             | ○    | クリックハンドラ     |
| `disabled` | `boolean`                |      | 操作不可             |
| `sx`       | `SxProps`                |      | スタイル上書き（幅等）|

```tsx
import { MainBtn, SubBtn } from "@/components/button";
<MainBtn label="保存" sx={{ width: 160 }} onClick={handleSave} />
<SubBtn label="キャンセル" onClick={handleCancel} />
```

### CustomTextField — `@/components/input`

`label` / `name` / `value` / `onChange` を基本に使う。詳細プロパティは実ファイルを参照。

### Notice — `@/components/notice`

`open` / `message` / `severity` / `onClose` を渡す。成功・エラーのユーザー通知に使う。

## MUI 直接使用の判断

| MUI コンポーネント                                       | 判断                          |
| -------------------------------------------------------- | ----------------------------- |
| Button, TextField, Select, Checkbox                      | **共通コンポーネントを使う**  |
| 通知 Snackbar/Alert                                      | **`<Notice>` を使う**         |
| Box, Typography, Table, Stack, IconButton, CircularProgress | MUI 直接使用 OK            |
