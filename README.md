# CraftFocus

[![Deploy Web](https://github.com/LEO0331/craftfocus/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/LEO0331/craftfocus/actions/workflows/deploy-pages.yml)
[![Lighthouse CI](https://github.com/LEO0331/craftfocus/actions/workflows/lighthouse.yml/badge.svg)](https://github.com/LEO0331/craftfocus/actions/workflows/lighthouse.yml)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](./coverage)

CraftFocus is a cross-platform focus and craft-sharing app where users complete timed sessions, unlock pixel-style room items, and share handmade work with friends.

Built with Expo + React Native + TypeScript + Expo Router, it runs from one codebase on:
- iOS
- Android
- Web

![CraftFocus How It Works](./assets/images/how-it-works.svg)

## Why CraftFocus

- Turn focused time into visible progress
- Build a personal pixel room with unlocked items
- Share craft/leather/sewing projects in a social feed
- Send and manage exchange requests with friends

## Core Features

- Email/password authentication (Supabase)
- Focus sessions with reward logic (coins + item progress)
- Room grid with place/remove item support
- Craft post upload and feed
- Optional pixel-style image preview generation
- Likes, comments, friendships, and exchange requests
- Profile editing with avatar upload

## How To Play

1. Create account and log in.
2. Start a focus session:
   - Choose `25 / 45 / 60` minutes
   - Pick a category and build target
3. Complete session to gain:
   - Focus coins
   - Item progress (unlocks room furniture)
4. Open **Room** tab:
   - Select an unlocked inventory item
   - Tap a cell to select it
   - Tap **Place Selected Item In Selected Cell**
5. Upload your real craft work in **Crafts**:
   - Optional pixel preview generation
   - Post to feed and optionally open for exchange
6. Add friends, visit their rooms, and manage exchange requests.

## Pixel Item Styles

The room uses handcrafted pixel sprites with different visual identities (materials, shading, accents), including:
- Leather wallet
- Sewing kit + fabric roll
- Dumbbell + yoga mat
- Study/work desk variants
- Bookshelf, lamp, plant

## Tech Stack

- Expo React Native
- TypeScript
- Expo Router
- Supabase (Auth, Postgres, Storage)
- Playwright (E2E)
- Vitest (unit + coverage)

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start development:

```bash
npx expo start
```

### Web

```bash
npx expo start --web
```

### iOS / Android

```bash
npx expo start --ios
npx expo start --android
```

## Supabase Setup

1. Create a Supabase project (free tier supported).
2. Run migration:

- `supabase/migrations/20260428143000_mvp_schema.sql`

3. Run seed:

- `supabase/seed_item_catalog.sql`

4. Enable email/password auth provider.
5. Create public storage bucket: `craft-images`.

### Seed Demo Data For One Existing User

After migrations are applied, you can seed test data for any existing auth user:

```sql
select public.seed_demo_data_for_user('YOUR_USER_UUID'::uuid);
```

Find the UUID in Supabase:
- `Authentication` -> `Users` -> copy `User UID`

### Storage Policy

- Bucket: `craft-images` (public read enabled)
- Uploads are limited to authenticated users
- Users may only write files under their own prefix:
  - `<auth.uid()>/...`
  - Example: `8f2c.../avatars/1714300000.jpg`
- File upload limits:
  - Max size: 10MB
  - Allowed types: `image/jpeg`, `image/png`, `image/webp`

## Testing

### Unit

```bash
npm test
npm run test:coverage
```

Coverage thresholds are configured at 85%+ for core deterministic logic modules.

### E2E (Web)

```bash
npm run test:e2e
```

## Lighthouse (Web)

Run local Lighthouse audit for:
- Performance
- Accessibility
- Best Practices
- SEO

```bash
npm run lighthouse:web
```

Reports are generated as:
- `lighthouse-report.report.json`
- `lighthouse-report.report.html`

## Privacy & Security Notes

- No personal credentials or private keys are stored in this repository.
- Runtime keys are provided through environment variables only.
- Avoid committing `.env` files or production secrets.

## License

See `LICENSE`.
