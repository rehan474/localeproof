# LocaleProof

**One website. Every language.**

English–Arabic release checks with evidence you can inspect and fixes you can verify.

[![Quality checks](https://github.com/rehan474/localeproof/actions/workflows/quality.yml/badge.svg)](https://github.com/rehan474/localeproof/actions/workflows/quality.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-174d40.svg)](LICENSE)

An English page can work perfectly while its Arabic counterpart loses an image, overflows on a phone, or sends search engines to the wrong canonical URL. LocaleProof compares paired pages and preserves the evidence behind each finding.

## Try the demo

```sh
git clone https://github.com/rehan474/localeproof.git
cd localeproof
npm ci
npm run dev
```

Use Node.js 22.12 or newer. Open **http://localhost:3000/inspect**.

1. Compare the English and Arabic previews.
2. Select **Mobile**, then inspect an overflow finding.
3. Switch to **After fixes** and open **Resolved**.
4. Export the report as JSON.

The public demo uses clearly labeled fixtures. It never sends arbitrary URLs to a scanner. Its page previews are illustrations, not captured scan screenshots. Live scans require the setup below.

## What it checks

| Check               | Evidence                                            |
| ------------------- | --------------------------------------------------- |
| Page availability   | HTTP status                                         |
| Document language   | HTML `lang` against the expected language           |
| Reading direction   | Computed `rtl` or `ltr`                             |
| Page title          | Non-empty document title                            |
| Canonical URL       | Exact self-referencing page URL, ignoring fragments |
| Language alternates | English and Arabic links to the supplied pair       |
| Visible images      | Loaded images in the initial viewport               |
| Viewport overflow   | Document width against viewport width               |

Each pair is checked at **1440 × 900** and **390 × 900**. Findings have stable identities across scans, allowing new, recurring, and resolved issues to be distinguished.

These checks do not assess translation quality, full accessibility compliance, or search rankings. A resource blocked by the scanner's network policy may appear as a missing image; review blocked-resource evidence first.

## Live scans

The first release is a **single-owner service**, with PostgreSQL and a separate browser worker.

```sh
cp .env.example .env
docker compose up -d db
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Put the generated value in `OWNER_TOKEN`. Set `ALLOWED_SCAN_HOSTS` to the exact page and asset hosts you own or are authorized to inspect, separated by commas. Set `DATABASE_URL` and a persistent `EVIDENCE_DIR` shared by the app and worker.

```sh
npm run db:migrate
npm run browser:install
npm run dev
# In another terminal:
npm run worker
```

Open `/owner`, enter the token, and add up to five English–Arabic page pairs. The token stays in page memory and is cleared on navigation or reload. No cloud credentials or paid services are required for the demo.

**Production:** build with `npm run build`, then run `node --env-file=.env .output/server/index.mjs`. Run the worker separately as an unprivileged user with Chromium sandbox support. Use HTTPS, a private database, an outbound network policy, persistent storage, backups, and an edge request limiter. The Compose credentials are for local development only. See [SECURITY.md](SECURITY.md).

## Code map

| Directory                               | Responsibility                                                 |
| --------------------------------------- | -------------------------------------------------------------- |
| `pages/`                                | Route composition and page state                               |
| `components/`                           | Focused UI: previews, metrics, findings, evidence              |
| `composables/`                          | Owner workspace requests and polling lifecycle                 |
| `types/`                                | Shared frontend report contracts                               |
| `server/api/`                           | Small HTTP handlers and response status codes                  |
| `server/utils/`                         | Owner authentication and bounded request parsing               |
| `server/middleware/`, `server/plugins/` | Security headers and CSP                                       |
| `lib/`                                  | Pure checks, validation, network policy, scanning, persistence |
| `db/`                                   | Transactional PostgreSQL schema                                |
| `scripts/`                              | Migration and worker entry points                              |
| `tests/`                                | Rule, validation, authentication, network, and database tests  |

[Architecture and tradeoffs](docs/architecture.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md)

## Development checks

```sh
npm run format:check
npm run typecheck
npm test
npm run build
# Disposable PostgreSQL database only:
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/localeproof_test npm run test:integration
```

The GitHub workflow runs the checks and database integration against a disposable PostgreSQL service. Do not run integration tests against a production database.

## Release scope

Implemented: demo exploration, paired-page scanning, eight checks, authenticated owner API, PostgreSQL queue, saved reports, screenshot evidence, and scan comparison.

Next milestones: verified production deployment, expanded browser regression coverage, object-storage support, and scheduled scans. Multi-user accounts and billing are intentionally outside this release.

Built by [Mohammad Rehan](https://github.com/rehan474). MIT licensed.
