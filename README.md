# KUSHMAP 🌿

[![GitHub stars](https://img.shields.io/github/stars/fedlic/kushmap?style=social)](https://github.com/fedlic/kushmap)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

タイ全土のカンナビスショップを探せるディレクトリサービス。
A Tabelog-style cannabis dispensary directory for Thailand.

[Live Demo](https://kushmap.vercel.app) | [GitHub](https://github.com/fedlic/kushmap) | [Contributing](CONTRIBUTING.md)

This project is open source under the [MIT License](LICENSE).

---

## 機能 / Features

| 機能 | 説明 |
|---|---|
| 地図 + リスト表示 | 写真付きマーカー・距離順ショップ一覧 |
| エリア絞り込み | Sukhumvit, Silom, Khao San, Chiang Mai, Phuket |
| ショップ詳細 | 写真カルーセル・営業時間・メニュー・レビュー |
| ユーザー認証 | メール/Googleログイン (Supabase Auth) |
| レビュー投稿 | 星評価 + コメント |
| オーナーダッシュボード | 店舗情報編集・受信レビュー確認 |
| 1,165店舗 | Google Places APIで収集済み（タイ全土15都市） |

---

## 技術スタック / Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL + PostGIS) |
| Auth | Supabase Auth |
| Maps | Google Maps JavaScript API + Places API (New) |
| Deployment | Vercel |

---

## ローカル開発 / Local Development

### 1. リポジトリをクローン

```bash
git clone https://github.com/fedlic/kushmap.git
cd kushmap
npm install
```

### 2. 環境変数を設定

`.env.local` を作成して以下を記入：

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. 開発サーバー起動

```bash
npm run dev
# → http://localhost:3000
```

---

## Supabase セットアップ / Database Setup

### Step 1: プロジェクト作成

1. [supabase.com](https://supabase.com) でアカウント作成
2. 「New Project」でプロジェクトを作成
3. Settings → API からURLとキーをコピー

### Step 2: スキーマ作成

Supabase ダッシュボード → **SQL Editor** で `supabase/migrations/001_initial_schema.sql` の内容を実行。

主なテーブル構成：

```
shops          - ショップ情報 (name, address, lat, lng, ...)
shop_images    - 写真URL
products       - メニュー (name, strain_type, thc_percent, price_thb)
reviews        - レビュー (rating 1-5, body)
bookmarks      - お気に入り
shop_owners    - オーナー紐付け
```

### Step 3: RLSポリシーを追加

SQL Editorで実行：

```sql
-- shop_images を公開読み取り可能にする
ALTER TABLE shop_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read shop_images" ON shop_images FOR SELECT USING (true);
GRANT SELECT ON shop_images TO anon, authenticated;

-- オーナーが自分のショップを編集できるようにする
CREATE POLICY "owners update shops" ON shops FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM shop_owners WHERE shop_id = shops.id AND user_id = auth.uid()
  ));

CREATE POLICY "owners manage shop_owners" ON shop_owners
  FOR ALL USING (auth.uid() = user_id);

GRANT SELECT, INSERT ON shop_owners TO anon, authenticated;
GRANT UPDATE ON shops TO authenticated;
```

### Step 4: Google OAuth (任意)

Supabase → Authentication → Providers → Google を有効化し、
Google Cloud Console の OAuth クライアントID/シークレットを入力。

---

## Google Cloud Console セットアップ

1. [console.cloud.google.com](https://console.cloud.google.com) でプロジェクトを作成
2. **APIs & Services → Enable APIs** で以下を有効化：
   - Maps JavaScript API
   - Places API (New)
3. **Credentials → Create API Key** でキーを作成
4. キーの制限（HTTP referrers）にデプロイ先ドメインを追加：
   ```
   localhost:3000/*
   *.vercel.app/*
   yourdomain.com/*
   ```

---

## データインポート / Data Import

### ショップデータを収集

```bash
node scripts/scrape-shops.mjs
# タイ15都市 × 5クエリ でGoogle Places APIを検索
# 結果をSupabaseのshopsテーブルに保存
```

### ショップ写真を取得

```bash
node scripts/fetch-photos.mjs
# 全ショップの写真をPlaces APIから取得
# shop_imagesテーブルに保存（各ショップ最大3枚）
```

> **注意:** 実行前に `.env.local` に `SUPABASE_SERVICE_ROLE_KEY` と `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` が必要です。

---

## Vercel デプロイ / Deploy to Vercel

### 方法1: GitHub連携（推奨）

1. [vercel.com](https://vercel.com) にログイン
2. 「Add New → Project」→ GitHubリポジトリを選択
3. Environment Variables に `.env.local` の4つの変数を追加
4. 「Deploy」をクリック

以降は `git push` で自動デプロイされます。

### 方法2: CLIでデプロイ

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## プロジェクト構成 / Project Structure

```
kushmap/
├── app/
│   ├── page.tsx                 # トップページ（Discovery）
│   ├── shops/[id]/page.tsx      # ショップ詳細
│   ├── owner/
│   │   ├── register/page.tsx    # オーナー登録
│   │   └── dashboard/page.tsx  # オーナーダッシュボード
│   ├── api/
│   │   └── photo/route.ts      # 写真プロキシAPI
│   └── auth/callback/route.ts  # OAuth コールバック
├── components/
│   ├── discovery/              # メイン検索UI
│   │   ├── DiscoveryPage.tsx
│   │   ├── ShopListCard.tsx
│   │   ├── MapPanel.tsx        # Google Maps (写真マーカー)
│   │   └── AreaFilter.tsx
│   ├── shop/
│   │   └── ShopDetailPage.tsx  # ショップ詳細
│   ├── owner/
│   │   ├── OwnerDashboardPage.tsx
│   │   └── OwnerRegisterPage.tsx
│   └── auth/
│       └── AuthModal.tsx       # ログイン/登録モーダル
├── lib/supabase/
│   ├── client.ts               # ブラウザクライアント
│   ├── server.ts               # サーバークライアント
│   ├── queries.ts              # ショップ/レビュークエリ
│   └── owner-queries.ts        # オーナー操作クエリ
├── scripts/
│   ├── scrape-shops.mjs        # ショップデータ収集
│   └── fetch-photos.mjs        # 写真取得
├── supabase/migrations/
│   └── 001_initial_schema.sql  # DBスキーマ
└── types/index.ts              # TypeScript型定義
```

---

## ページ一覧 / Pages

| URL | 説明 |
|---|---|
| `/` | ショップ検索（地図+リスト） |
| `/shops/[id]` | ショップ詳細・レビュー |
| `/owner/register` | オーナー登録（ショップをクレーム） |
| `/owner/dashboard` | オーナーダッシュボード |

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for how to:

- Add new shops
- Help with translations (Thai, Chinese, etc.)
- Fix bugs and submit PRs
- Set up local development

## ライセンス / License

MIT License - see [LICENSE](LICENSE) for details.

Copyright (c) 2025 FEDLIC TOKYO
