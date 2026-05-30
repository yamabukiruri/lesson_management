# Lesson Management 開発ガイド

<language>Japanese</language>
<character_code>UTF-8</character_code>

---

## 開発原則

1. 作業前にこのガイドを確認し、全ルールを遵守する
2. 後方互換性を確認し、破壊的変更を行う場合は影響範囲を明示する
3. プロジェクト固有の命名規則・技術制約・構造を尊重する
4. 必要情報が不足する場合は、合理的な仮定を最大 3 つ置いて実行し、仮定は出力前に必ず明示する
5. 新規実装・改善計画は実装前に計画を立てる
6. 余計な抽象化・将来用の作り込み・不要なエラーハンドリングを追加しない（必要最小限で実装する）

---

## 技術スタック

| 区分           | 採用技術                                              |
| -------------- | ----------------------------------------------------- |
| フレームワーク | Next.js 15 (App Router) + React 19                    |
| 言語           | TypeScript (strict)                                   |
| UI             | Material UI v6 + Emotion                              |
| バックエンド   | Firebase (Firestore / Auth)                           |
| データ取得     | firebase SDK (`onSnapshot` 等) / react-firebase-hooks |
| 日付           | dayjs / @mui/x-date-pickers / @holiday-jp/holiday_jp  |

---

## プロジェクト構造

```
src/
├── app/          # ページルーティング（App Router）。各 page は "use client"
│   └── context/  # React Context（認証など）
├── components/   # 再利用可能な UI コンポーネント
├── library/      # テーマ・固定データ
├── utils/        # ユーティリティ関数
└── firebase.ts   # Firebase 初期化（db / auth / provider をエクスポート）
```

- パスエイリアス: `@/*` → `./src/*`

---

## 技術制約（必須遵守）

| 制約       | 内容                                         |
| ---------- | -------------------------------------------- |
| TypeScript | strict モード、`any` 型禁止                  |
| ESLint     | エラー 0 件必須（`next/core-web-vitals`）    |
| console    | `console.log` 禁止（デバッグログを残さない） |
| UI         | Material UI v6 を使用                        |

---

## 品質チェック（コミット前必須）

```bash
npm run lint
npm run build

# console.log 残存チェック
grep -rn "console.log" --include="*.ts" --include="*.tsx" src/

# any 型チェック
grep -rn ": any" --include="*.ts" --include="*.tsx" src/
```

---

## UI 実装

- **Material UI v6**: `Box` / `Typography` / `Button` など MUI コンポーネントを使用
- **スタイル**: インラインスタイルではなく `sx` プロパティを使用
- **テーマ**: 色・タイポは `@/library/theme` を参照し、ハードコードを避ける
- **ローディング/空状態**: 専用コンポーネント（`@/components/loading` 等）で明示的に扱う

---

## データ層（Firebase）

- **初期化**: `@/firebase` から `db` / `auth` / `provider` を import する
- **認証**: 認証状態は `@/app/context/auth-context` (`useAuth`) を経由して取得する
- **リアルタイム取得**: `onSnapshot` を使う場合は `useEffect` のクリーンアップで必ず unsubscribe する
- **Firestore データ整形**: ドキュメント取得時は各フィールドに既定値を与え、欠損データでも壊れないようにする
- **セキュリティ**: 機密ロジック・権限チェックは Firestore セキュリティルール側で担保し、クライアントの値を信用しない

---

## パッケージ管理

| ルール                        | 説明                                                           |
| ----------------------------- | -------------------------------------------------------------- |
| **npm コマンド優先**          | 依存の追加・削除・更新は `npm install/uninstall/update` を使用 |
| **package.json 直接編集禁止** | バージョン変更も npm コマンドで対応（設定セクションは例外）    |

```bash
npm install <package>
npm install -D <package>   # devDependencies
npm uninstall <package>
npm install <package>@<version>
```

---

## テスト方針

- ユニットテストは**ブラックボックステスト**として実施する
  - 公開インターフェース（export された関数・コンポーネント）の入出力をテストする
  - 内部 state・private 関数など実装詳細はテスト対象にしない
  - コンポーネントは「ユーザーが見る・操作する」観点でテストする

---

## 起動時の推奨アクション

```bash
# リモートの変更を取得してからコンフリクトを防ぐ
git pull
```
