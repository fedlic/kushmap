# Contributing to KUSHMAP

Thanks for your interest in contributing to KUSHMAP! This guide will help you get started.

## Local Development Setup

### Prerequisites

- Node.js 18+
- npm
- A Supabase account (free tier works)
- A Google Cloud account with Maps JavaScript API and Places API (New) enabled

### Getting Started

1. Fork this repository and clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/kushmap.git
cd kushmap
npm install
```

2. Create `.env.local` with the required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

3. Run the database migration in Supabase SQL Editor using `supabase/migrations/001_initial_schema.sql`.

4. Start the dev server:

```bash
npm run dev
# Open http://localhost:3000
```

## How to Submit a Pull Request

1. Create a new branch from `main`:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and test locally with `npm run build` and `npm run lint`.

3. Commit your changes with a clear message:

```bash
git commit -m "feat: add shop filtering by strain type"
```

4. Push to your fork and open a PR against `main`.

5. Describe what your PR does and include screenshots if it changes the UI.

## Ways to Contribute

### Adding Shops

- Open an issue with the shop name, address, and Google Maps link
- Or submit a PR that adds the shop via a script or SQL migration

### Translations

- UI strings are currently in Japanese and English
- Help translate to Thai, Chinese, or other languages
- Look for text in `components/` and `app/` directories

### Bug Fixes

- Check the Issues tab for open bugs
- Reproduce the issue locally before submitting a fix
- Include steps to verify the fix in your PR description

### New Features

- Open an issue first to discuss the feature
- Keep PRs focused on a single change
- Follow the existing code style (TypeScript, Tailwind CSS, shadcn/ui)

## Code Style

- TypeScript for all new code
- Tailwind CSS for styling (no custom CSS unless necessary)
- Use shadcn/ui components where possible
- Run `npm run lint` before submitting

## Code of Conduct

Be respectful and constructive. We welcome contributors of all experience levels. Harassment, discrimination, or toxic behavior will not be tolerated. Maintainers reserve the right to remove any contribution or contributor that does not align with a positive and inclusive community.
