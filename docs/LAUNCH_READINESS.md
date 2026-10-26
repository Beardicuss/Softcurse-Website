# Admin panel launch readiness

Last verified: 2026-10-09 (Asia/Tbilisi)

## Status

The Softcurse control panel is production-ready for its configured features. Live payment processing
remains intentionally disabled until a provider and credentials are selected. Email replies depend on
the optional Resend configuration, and external analytics providers are optional because first-party,
cookie-free analytics are already active.

## Automated gates

```powershell
npm run check
npm run smoke:production
npx wrangler d1 migrations list softcurse-cms --remote
```

`npm run check` runs lint, the Node regression suite, and the Vite production build. The production
smoke suite verifies representative routes, security headers, published CMS content, comments,
admin authentication boundaries, sitemap/LLM feeds, and critical media assets.

## Browser QA completed

- Desktop production homepage and semantic landmark snapshot
- Mobile 390×844 homepage layout and navigation
- Mobile blog article, comments list, and comment form
- Mobile admin login layout, labels, and touch targets
- Browser console: zero errors and zero warnings in checked flows
- Screenshots: `output/playwright/home-mobile.png` and
  `output/playwright/admin-login-mobile.png` (local QA artifacts, not deployed)

## Operational checklist

1. Keep `ADMIN_TOTP_KEY` and the administrator password in Cloudflare secrets only.
2. Keep two-factor authentication enabled for privileged accounts.
3. Create a private database snapshot before bulk content, commerce, or layout changes.
4. Use **Inspect restore** before any restore and verify every table-count difference.
5. Review active sessions, login history, audit events, pending comments, and new messages regularly.
6. Leave `COMMERCE_LIVE_ENABLED=false` until a payment provider has been implemented and tested.
7. Require SRI hashes for every enabled external script and treat each script as full site access.
8. Run the automated gates above before every production deployment.

## Recovery

Open **System & analytics → Backups**, select **Inspect restore**, review the dry-run table comparison,
and type the exact displayed phrase. The server creates a recovery snapshot immediately before it
replaces restorable data. Credentials, 2FA, sessions, API tokens, audit history, and system metadata
are never replaced by a content restore.

## Adding a module

1. Add a numbered D1 migration with tables and granular permissions.
2. Add authenticated Pages Functions under `functions/api/admin/<module>`.
3. Map read/write permissions in `functions/api/admin/_middleware.js`.
4. Add a focused React manager under `src/admin/` and register its route, sidebar entry, title, and
   command-palette action in `AdminApp.jsx`.
5. Add validation unit tests and extend the smoke test when a public route or API is introduced.
6. Apply the migration locally, run `npm run check`, deploy the migration remotely, then deploy Pages.
7. Run `npm run smoke:production` and document any external configuration that remains optional.

## Intentional limitations

- Production restore execution was not performed as QA because it is destructive; validation and
  preview were tested, while apply logic is protected by confirmation and a recovery snapshot.
- CSP remains report-only while runtime-configurable external scripts are supported. See
  `docs/SECURITY_REVIEW.md`.
- Real card payments, refunds, and provider webhooks remain disabled/unconfigured.
