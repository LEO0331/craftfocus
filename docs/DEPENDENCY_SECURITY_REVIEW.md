# Dependency security review — 2026-11-02

Scope: dependencies installed by CraftFocus, including its active Expo/React
Native build tools and Vitest test tools. The worktree was clean before review.
The authenticated Dependabot page could not be read: the connector has no alert
API, and browser automation stopped because it could not establish the current
URL reliably. This review uses the lockfile, installed consumer source, npm's
live advisory report, and public GitHub advisories; it does not claim to enumerate
or dismiss the repository's exact GitHub alert IDs.

## Updates

| Package | Previous → installed | Project usage |
|---|---|---|
| decode-uri-component | 0.5.0 → 0.5.1 | Expo Router / React Navigation query-string parsing in the app |
| compression | 1.8.1 → 1.8.2 | Expo development-server responses |
| node-forge | 1.4.0 → 1.4.2 | Expo certificate and code-signing tools |
| shell-quote | 1.10.0 → 1.12.0 | React Native developer tools |
| source-map-js | 1.2.1 → 1.2.2 | Metro/PostCSS builds and coverage tooling |
| undici | 6.28.1 → 6.29.1 | Expo CLI HTTP, downloads and proxies |
| vite | 8.3.2 → 8.3.5 | Vitest transformation tooling |
| vitest / @vitest/coverage-v8 / @vitest/mocker | 4.1.11 → 4.1.12 | Unit tests and coverage |

Raised the URI decoder override and Vitest/coverage minimum versions. Other
updates stay within existing dependency ranges in package-lock.json. Existing
query-string and Metro postinstall compatibility patches remain required.
No Expo SDK, native package, application, database, auth or deployment changes.

The [new decoder advisory](https://github.com/advisories/GHSA-qr28-fpjm-wq7f)
also affects the previously patched 0.5.0 release. Navigation is a real consumer,
so the 0.5.1 update is applicable even though this is a static client and has no
Node request-body parsing server.

## Findings retained

After updates, npm audit reports 29 affected dependency nodes: 28 moderate and
one low, with zero high or critical. Most entries propagate from these three
underlying packages; they are not 29 independent vulnerable implementations.

| Package / advisory | Exposure and decision |
|---|---|
| [deepmerge](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) | Expo config/plugin merging of trusted repository configuration. No app-user data path found. No patched release published; retain rather than downgrade or add an unmaintained replacement. |
| [glob](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) | Expo/build filesystem scanning. Expo's TypeScript prerequisite uses a cancellation timeout when tsconfig.json is absent; this repo has tsconfig.json. The cancellation API is present in the toolchain, so this is conditional build exposure, not an unused package. Fixed in 14.0.2; installed modern consumers require 13.x. Legacy 7.x consumers also require callback APIs. No forced global major override. |
| [minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249) | Expo/native build globs and ignore patterns from trusted local project configuration; no app-user-controlled pattern input found. Fixed in 11.0.1. Installed 3.x consumers expect a callable CommonJS export, while modern releases expose a different API. No global major override. |

Revisit these with a coordinated Expo/React Native toolchain upgrade or upstream
compatible fixes. Reassess exposure before allowing untrusted project config,
glob patterns or source trees into build jobs. Alerts were not dismissed remotely.

## Validation

TypeScript, 23 unit files / 77 tests, and Playwright's web export plus three
browser smoke flows passed; two authenticated flows skipped for absent credentials.
The export preserves the /craftfocus base path. Clean-install and final consumer
verification results are recorded in progress.md.

Limits: no native device build, authenticated Supabase flow, production deploy,
or live GitHub alert closure check. Database regressions and Lighthouse were
not rerun because schema and application behavior were unchanged.
