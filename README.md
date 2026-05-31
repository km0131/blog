# ワンちゃんブログ — 開発ロードマップ

## 概要
家族が気軽に写真や日記を投稿できる、写真中心のシンプルなブログを開発します。
編集は TipTap によるリッチ体験と Markdown の併用を想定しています。

主な技術スタック: Bun / Hono / PostgreSQL + pgvector / TipTap / marked / Tailwind CSS

---

## 1. システム構成（概要）
- 実行環境: Bun
- Web フレームワーク: Hono（API とサーバーサイドレンダリング）
- データベース: PostgreSQL + pgvector
- エディタ: TipTap（ProseMirror ベース、Markdown 拡張あり）
- Markdown→HTML: marked
- スタイリング: Tailwind CSS（想定）

---

## 2. フェーズ別ロードマップ

フェーズ1 — 土台作り
- Bun + Hono のプロジェクト初期化
- PostgreSQL に `posts` テーブルを作成（マイグレーションスクリプト）
- Hono に一覧画面・投稿画面の骨組み（JSX）を作成

フェーズ2 — ハイブリッド・エディタ実装
- TipTap を導入、基本ツールバーとバブルメニューを実装
- TipTap の Markdown 拡張を導入し、Markdown とリッチテキストを両立
- 画像のドラッグ＆ドロップ挿入とアップロード処理
- 保存処理: TipTap から Markdown を抽出して DB に保存

フェーズ3 — 検索・AI（将来的）
- 画像アップロード時の自動タグ付け（AI）
- PostgreSQL/pgvector によるベクトル検索対応を想定
- 将来的な検索強化への拡張準備

---

## 3. データの流れ（簡易ワークフロー）
入力: 家族はGUI操作、開発者はMarkdownで入力 → TipTap が解釈・表示
保存: TipTap を Markdown に変換 → Hono API 経由で保存 → PostgreSQL に格納
表示: DB から Markdown を取得 → `marked` で HTML に変換 → CSS で整形

---

## ファイル構成

プロジェクトの主要ファイルとディレクトリ構成（抜粋）:

- docker-compose.yml
- Dockerfile
- package.json
- README.md
- data/
- public/
  - editor.js
  - uploads/
    - 1777819467924-nscapc-test-image.txt
- src/
  - index.ts
  - frontend/
    - editor.ts
  - lib/
    - db.ts
  - scripts/
    - db_check.ts
    - db_debug.ts
    - db_setup.ts
- views/
  - layout.ts
  - postEditor.ts
  - postsList.ts

注: 実際のワークスペースには上記以外のファイルやディレクトリが含まれる場合があります。


## 4. 初期 DB スキーマ（例）
```sql
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body_markdown TEXT NOT NULL,
  cover_image TEXT,
  tags TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);
```

注: 検索要件が出たら FTS5 テーブルを追加するか、tags を別テーブルで正規化してください。

---

## 5. API（最小設計）
- GET /api/posts — 投稿一覧（ページネーション）
- GET /api/posts/:id — 単一投稿取得
- POST /api/posts — 投稿作成（JSON: title, body_markdown, cover_image, tags）

セキュリティ: 入力検証と Markdown のサニタイズ（XSS 対策）を必ず行うこと。

---

## 6. UI / UX イメージ
- 編集: 余計な枠のない集中モード、左側エディタと右側プレビューの切替
- 画像: ドラッグ＆ドロップで追加、アップロード進捗を表示
- 閲覧: 写真が目立つタイルレイアウト、見出しやリストで読みやすく

---

## 7. ローカル開発の簡易手順
前提: Bun がインストール済み

```bash
mkdir my-dog-blog
cd my-dog-blog
bun init

# 依存インストール（例）
bun add hono marked postgres @tiptap/core @tiptap/starter-kit @tiptap/extension-markdown tailwindcss

# 開発サーバ（package.json に dev スクリプトを設定）
bun run dev

# DB 初期化スクリプト
bun run db:setup
```

---

## 8. 技術的検討メモ
- TipTap の内部状態（ProseMirror JSON）と Markdown をどう同期させるか設計が重要
- 画像保存はローカル or S3互換のどちらにするか検討（バックアップと転送性能）
- 検索はまず FTS5、必要に応じて外部検索サービスやベクトルDBを検討

---

## 9. 次のアクション（短期）
1. `Initialize Bun + Hono project` を開始
2. `posts` テーブル作成用のマイグレーション作成
3. Hono に簡易 API とページルートを実装

---

参照:
- TipTap: https://tiptap.dev/
- Hono: https://hono.dev/
- marked: https://github.com/markedjs/marked

README を上書きしました。次は `Initialize Bun + Hono project` を進めますか？