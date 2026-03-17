# KUSHMAP 🌿

**タイのカンナビス（大麻）ショップを探すためのディレクトリサービス。**
**A Tabelog-style directory for finding cannabis dispensaries across Thailand.**

---

## 概要 / Overview

KUSHMAPは、タイ全土のカンナビスショップを検索・レビューできるウェブサービスです。
KUSHMAP is a web app for discovering, browsing, and reviewing cannabis shops in Thailand.

### 主な機能 / Features

- 地図 + リスト形式のショップ検索 / Map + list view with nearby shop search
- エリア絞り込み（バンコク各地区、チェンマイ、プーケット等）/ Area filtering
- ショップ詳細ページ（営業時間、メニュー、レビュー）/ Shop detail with hours, menu, reviews
- ユーザーレビュー投稿（メール認証 / Google OAuth）/ User reviews via email or Google OAuth
- Google Places APIによる1,000+店舗データ / 1,000+ shops imported via Google Places API

---

## 技術スタック / Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL + PostGIS) |
| Auth | Supabase Auth (Email + Google OAuth) |
| Maps | Google Maps JavaScript API + Places API |
| Deployment | Vercel |

---

## ローカルでの動かし方 / Running Locally

### 必要なもの / Prerequisites

- Node.js 18+
- npm

### 手順 / Steps

```bash
# Clone
git clone https://github.com/fedlic/kushmap.git
cd kushmap

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your keys

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 環境変数 / Environment Variables

Create `.env.local` with the following:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Google Cloud Console で必要な API / Required Google APIs

Enable these in [Google Cloud Console](https://console.cloud.google.com/):

- Maps JavaScript API
- Places API (New)

### Supabase セットアップ / Supabase Setup

1. Create a new Supabase project
2. Enable PostGIS extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
3. Run `supabase/migrations/001_initial_schema.sql` in the SQL Editor
4. (Optional) Enable Google OAuth in Supabase Auth > Providers

---

## データ収集スクリプト / Data Scripts

```bash
# Import shops from Google Places API
node scripts/scrape-shops.mjs

# Fetch and store shop photos
node scripts/fetch-photos.mjs
```

---

## プロジェクト構成 / Project Structure

```
kushmap/
├── app/
│   ├── page.tsx              # Home (discovery page)
│   ├── shops/[id]/page.tsx   # Shop detail
│   └── auth/callback/        # OAuth callback
├── components/
│   ├── discovery/            # Main discovery UI
│   ├── shop/                 # Shop detail UI
│   └── auth/                 # Auth modal
├── lib/supabase/             # Supabase client + queries
├── scripts/                  # Data import scripts
├── supabase/migrations/      # DB schema
└── types/index.ts            # TypeScript types
```

---

## ライセンス / License

Private project — all rights reserved.
