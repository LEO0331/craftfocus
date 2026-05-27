# CraftFocus E2E Test Report

Date: 2026-05-27  
Target: Web static export and deployed-compatible `/craftfocus` routes  
Account data: credentials are supplied through environment variables and are not stored in this repository.

## Scope

Current automated coverage focuses on the web MVP shell and authenticated flows when credentials are provided.

Covered by smoke tests without backend env:

- Login route renders without a blank page.
- Configuration error banner appears when Supabase public env vars are missing.
- Login form controls render.
- Signup route renders and links back to login.

Covered by authenticated E2E when `E2E_EMAIL` and `E2E_PASSWORD` are set:

- Login.
- Home dashboard.
- Focus session path.
- Room and gallery surfaces.
- Official inventory claim path.
- Header companion/seed status.
- Listing/detail route paths.

## Current Local Result

- Overall: **PASS**
- Command: `npm run test:e2e`
- Result: `2 passed`, `2 skipped`
- Skipped tests are credential-gated and only run when E2E credentials are present.

## Commands

### Static export

```bash
npm run e2e:build
```

### Smoke/E2E

```bash
npm run test:e2e
```

### Authenticated deployed run

```bash
E2E_BASE_URL='https://<github-username>.github.io/craftfocus' \
E2E_EMAIL='<set-in-env>' \
E2E_PASSWORD='<set-in-env>' \
npm run test:e2e
```

## Evidence Screenshots

Some screenshots are historical evidence from prior authenticated passes and may not reflect the latest visual polish exactly.

### 1) Login
![Login](./e2e/01-login.png)

### 2) Home
![Home](./e2e/02-home.png)

### 3) Focus Complete
![Focus Complete](./e2e/03-focus-complete.png)

### 4) Room
![Room](./e2e/04-room.png)

### 5) Friends
![Friends](./e2e/06-friends.png)

### 6) My Claims
![My Claims](./e2e/07-exchanges.png)

## Notes

- The login page now includes a lightweight animated game-flow preview above the login card.
- The app shows a branded loading shell during startup/auth boot so first load does not look blank.
- Room visuals and placement anchors continue to evolve; E2E selectors should prefer accessibility labels and stable route checks over pixel-perfect positions.
- Supabase-backed actions require a configured backend and valid test user.
