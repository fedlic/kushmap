# kushmap

## 概要

タイの大麻ディスペンサリー検索ディレクトリ（食べログ風）。インタラクティブマップ、ショップ一覧、レビュー、オーナーダッシュボード。
デプロイ先: https://kushmap.vercel.app

## 技術スタック

- Next.js 14, React 18, TypeScript
- Tailwind CSS 3, shadcn/ui
- Supabase (PostgreSQL + PostGIS)
- Google Maps API

## よく使うコマンド

```bash
npm run dev     # 開発サーバー起動
npm run build   # プロダクションビルド
npm run lint    # ESLint
```

## 注意事項

- パッケージマネージャは npm
- 外部API（Google Places等）の一時画像URLをDBに直接保存しないこと。必ずSupabase Storageにダウンロード・アップロードしてから永続URLを保存する
