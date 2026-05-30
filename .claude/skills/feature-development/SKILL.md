---
name: feature-development
description: |
  機能開発全般（UI実装＋Firebaseデータ連携）で使用するスキル。
  「機能を追加」「開発」「画面を作成」「実装」で発動。
  Next.js (App Router) + React + Material UI v6 + Firebase (Firestore / Auth) を前提とした、画面からデータ層までの実装ルールとチェックリスト。
allowed-tools: Read, Grep, Glob, Bash
version: 1.0.0
updated: 2026-05-30
---

# 機能開発スキル

Next.js 15 (App Router) + React 19 + Material UI v6 + Firebase (Firestore / Auth) を使用した
機能開発のルールとチェックリスト。**UI 実装だけでなく、Firestore とのデータ連携・認証まで含む**。
実装前・実装中に本スキルを参照すること。

ベースとなるルールは [CLAUDE.md](../../../CLAUDE.md) を参照（技術制約・データ層の作法はそちらが SSOT）。

## 使用タイミング

- 機能追加・コンポーネント実装時
- UI/UX 実装時
- Firestore へのデータ保存・取得（CRUD）/ リアルタイム購読の実装時
- 認証（ログイン・保護ページ）の実装時
- 既存画面・データ構造の改修時

---

## 1. コンポーネント構造

### ファイル構成

```
src/
├── app/          # App Router ページ（各 page は "use client"）
│   └── context/  # React Context（認証など）
├── components/   # 再利用可能な共通 UI コンポーネント
├── library/      # テーマ・固定データ
├── utils/        # ユーティリティ関数
└── firebase.ts   # Firebase 初期化（db / auth / provider）
```

### 命名規則

| 対象           | 形式            | 例                 |
| -------------- | --------------- | ------------------ |
| コンポーネント | PascalCase      | `RosterPrint`      |
| カスタムフック | camelCase + use | `useAuth`          |
| 関数           | camelCase       | `handlePrint`      |
| 定数           | UPPER_SNAKE     | `ROSTER_PRINT_CSS` |
| 型             | PascalCase      | `Student`          |

---

## 2. 共通 UI コンポーネント（必須）

**UI 実装時は `src/components/` 配下の共通コンポーネントを優先使用すること。**
ボタン・入力・テーブルセルなどを新規実装する前に、既存の共通コンポーネントを必ず確認する。

詳細・選択ガイド → [agents/ui-components.md](./agents/ui-components.md)

### 基本パターン

```tsx
// レイアウト系（Box, Typography）は MUI 直接使用 OK
// ボタン・入力は src/components/ の共通コンポーネントを優先
import { Box } from "@mui/material";
import { MainBtn } from "@/components/button";

export function MyComponent() {
  return (
    <Box sx={{ p: 2 }}>
      <MainBtn label="保存" onClick={() => {}} />
    </Box>
  );
}
```

### sx プロパティ（必須）

```tsx
<Box sx={{ mt: 2, mb: 1 }} />        // ✅ sx を使う
<Box style={{ marginTop: 16 }} />    // ❌ インラインスタイルは避ける
```

色・タイポは `@/library/theme` を参照し、カラーコードのハードコードを避ける。

---

## 3. データ層（Firebase）

UI と同じく、Firestore とのデータ連携・認証も本スキルの対象。読み取り・書き込みの両方を以下のルールに従って実装する。

### 初期化・認証

- **初期化**: `@/firebase` から `db` / `auth` / `provider` を import する
- **認証**: `@/app/context/auth-context` の `useAuth()` から `user` / `loading` を取得する。未ログイン時は `/login` へリダイレクト
- **データのスコープ**: ユーザー固有データは `users/{user.uid}/...` 配下に置く。**コレクションパスに必ず `user.uid` を含め**、他ユーザーのデータに触れない構造にする

### 読み取り（リアルタイム購読）

- `onSnapshot` は `useEffect` 内で購読し、**クリーンアップで必ず unsubscribe する**

```tsx
useEffect(() => {
  if (!user) return;
  const unsubscribe = onSnapshot(
    collection(db, "users", user.uid, "students"),
    (snap) => {
      /* ... */
    }
  );
  return () => unsubscribe();
}, [user]);
```

- 一度だけ取得する場合は `getDoc` / `getDocs` を使う（購読が不要なら onSnapshot を使わない）
- **データ整形**: ドキュメント取得時は各フィールドに既定値を与え（`data.x ?? []` 等）、欠損データでも壊れないようにする

### 書き込み（CRUD）

- 追加: `addDoc`（自動 ID）/ `setDoc`（ID 指定）、更新: `updateDoc`、削除: `deleteDoc`
- 書き込みは `try/catch` で囲み、結果を `<Notice>` でユーザーに通知する（成功・失敗とも）
- 物理削除より論理削除が望ましいケース（例: 退会 = `isWithdrawn` フラグ）を検討する
- 同一ドキュメントへの複数更新や関連ドキュメントの整合が必要なときは `writeBatch` / `runTransaction` を使う

```tsx
try {
  await updateDoc(doc(db, "users", user.uid, "students", docId), {
    isWithdrawn: true,
  });
  setNotice({ open: true, message: "保存しました", severity: "success" });
} catch {
  setNotice({ open: true, message: "保存に失敗しました", severity: "error" });
}
```

### セキュリティ

- 権限チェックは Firestore セキュリティルールで担保する。クライアントの値を信用しない
- API キー等の秘匿は前提にしない（Firebase の web config は公開前提のため、ルールで守る）
- ルールでも「`request.auth.uid` と一致する `users/{uid}` 配下のみ読み書き可」を基本とする

---

## 4. ローディング・空状態

- **ローディング**: `useAuth()` の `loading` 中は `@/components/loading` の `LoadingScreen` を表示する
- **空状態**: 一覧が 0 件のときは専用メッセージを表示する（「登録されていません」「該当なし」を区別する）

---

## 5. ユーザー通知・エラー表示

- 成功・エラーのフィードバックは `@/components/notice` の `<Notice>`（MUI Snackbar + Alert）を使う
- `severity` は `success` / `error` / `warning` / `info` を用途に応じて指定
- デバッグ用の `console.log` は残さない（[CLAUDE.md](../../../CLAUDE.md) の技術制約）

```tsx
const [notice, setNotice] = useState({
  open: false,
  message: "",
  severity: "success" as AlertColor,
});
// ...
<Notice
  {...notice}
  onClose={() => setNotice((p) => ({ ...p, open: false }))}
/>;
```

---

## 6. パフォーマンス

```tsx
const sorted = useMemo(() => compute(data), [data]); // 重い計算はメモ化
const handleClick = useCallback(() => {
  /* ... */
}, []); // コールバックはメモ化
```

- `useEffect` の依存配列（exhaustive-deps）を正しく設定する
- `onSnapshot` 購読の張りっぱなし・状態更新ループに注意する

---

## 7. UI テキスト命名規則

| タイプ           | 形式              | 例                         |
| ---------------- | ----------------- | -------------------------- |
| プレースホルダー | 体言止め          | `名前で検索`               |
| ボタン名         | 体言止め/動詞原形 | `保存`、`新規生徒登録`     |
| ラベル           | 体言止め          | `年齢`、`登録レッスン回数` |
| 説明文           | 丁寧語            | `〜してください`           |
| 成功/エラー      | 丁寧語            | `保存しました`             |

---

## 8. 実装チェックリスト

| #   | 観点         | 確認内容                                                                                        | 重要度 |
| --- | ------------ | ----------------------------------------------------------------------------------------------- | ------ |
| 1   | TypeScript   | `any` 型を使用していないか                                                                      | 高     |
| 2   | console.log  | デバッグログが残っていないか                                                                    | 高     |
| 3   | 共通 UI      | `src/components/` の共通コンポーネントを使っているか                                            | 高     |
| 4   | unsubscribe  | `onSnapshot` をクリーンアップで解除しているか                                                   | 高     |
| 5   | データ連携   | 書き込みを `try/catch` し、結果を `<Notice>` で通知しているか。パスに `user.uid` を含めているか | 高     |
| 6   | ローディング | `loading` 中に `LoadingScreen` を表示しているか                                                 | 高     |
| 7   | 空状態       | データ 0 件時の表示が適切か                                                                     | 中     |
| 8   | sx           | `style` 属性ではなく `sx` を使っているか                                                        | 中     |
| 9   | テーマ       | 色・タイポを `@/library/theme` から取得しているか                                               | 中     |

---

## 9. 検証コマンド（実装後・コミット前）

```bash
npm run lint
npm run build

# console.log 残存チェック
grep -rn "console.log" --include="*.ts" --include="*.tsx" src/

# any 型チェック
grep -rn ": any" --include="*.ts" --include="*.tsx" src/
```
