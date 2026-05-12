# CraftFocus E2E Test Report

Date: 2026-04-29  
Target: Web (`<public-app-url>`)  
Account used: `<redacted-test-user>`

## Scope

- Login
- Home dashboard
- Focus session completion path
- Room screen interaction path
- Craft upload + pixel preview + post creation
- Friends page
- Exchanges page

## Result

- Overall: **PASS**
- Playwright run: `1 passed`
- Command:

```bash
E2E_BASE_URL='<public-app-url>' \
E2E_EMAIL='<set-in-env>' \
E2E_PASSWORD='<set-in-env>' \
npx playwright test tests/e2e/user-flow.spec.ts --project=chromium
```

## Evidence Screenshots

### 1) Login
![Login](./e2e/01-login.png)

### 2) Home
![Home](./e2e/02-home.png)

### 3) Focus Complete
![Focus Complete](./e2e/03-focus-complete.png)

### 4) Room
![Room](./e2e/04-room.png)

### 5) Craft Detail (after upload/post)
![Craft Detail](./e2e/05-craft-detail.png)

### 6) Friends
![Friends](./e2e/06-friends.png)

### 7) Exchanges
![Exchanges](./e2e/07-exchanges.png)

## Issues Found and Fixed During This E2E Pass

1. E2E config could not target deployed web URL cleanly.
   - Fix: `playwright.config.ts` now supports `E2E_BASE_URL` override and disables local web server when external URL is set.

2. Room cell selectors were not stable for browser automation.
   - Fix: Added accessibility labels to room grid cells (`Room cell x N, y M`) for reliable selection.

3. User-flow test instability around route paths and strict text matching.
   - Fix: Updated `tests/e2e/user-flow.spec.ts` with subpath-safe navigation and strict heading/role selectors.

## Notes

- Room placement requires unlocked inventory; for accounts without unlocked items the test validates the empty-state path instead.
- Test uses demo image asset: `assets/images/icon.png`.
