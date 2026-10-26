# Softcurse Control Panel

## Control Panel v2 status

Phase A foundation now includes a responsive administration shell, persistent light/dark theme,
collapsible navigation, a Ctrl/Cmd+K command palette, richer dashboard metrics, reusable accessible
data tables, database-backed administrator accounts, five system roles, granular server-side
permissions, and PBKDF2-SHA256 password hashing.

The Security page lists active sessions, identifies the current device, permits privileged users
to revoke other sessions, and provides a password-change flow that signs out other devices. New
administrator accounts are created with a temporary password and cannot enter the control panel
until they replace it. The Administrators page includes an editable grouped permission matrix for
every system role except the protected Super Admin role.

Authenticator-app two-factor authentication is available from **Security**. TOTP secrets are
AES-GCM encrypted before storage, recovery codes are stored only as SHA-256 hashes, and each
recovery code can be used once. Set a long `ADMIN_TOTP_KEY` Cloudflare secret before enabling 2FA
in production. For backward-compatible local development, encryption falls back to
`ADMIN_PASSWORD` when the dedicated key is absent. Apply migration `0014_admin_totp.sql` before
deploying the 2FA endpoints.

Apply `0013_admin_identity_and_rbac.sql` before deploying this version. The first successful login
with the existing `ADMIN_USERNAME` and `ADMIN_PASSWORD` secrets creates the initial database-backed
Super Admin automatically, so the existing production credentials remain valid during migration.

The notification center and a review-only Workers AI assistant are now available. The assistant can
improve or summarize copy, suggest SEO metadata or tags, and draft Georgian or Russian translations.
It never writes to the database or publishes content. It uses only Cloudflare Workers AI, has an
8,000-character input limit, a 384-token response limit, and defaults to 10 requests per day across
all administrators. No browser-local model or paid third-party model is part of the architecture.
Apply `0015_notifications_and_ai_usage.sql` before deploying these endpoints.

The **Media library** provides authenticated R2 uploads, drag-and-drop multi-file upload, folders,
search and file-type filters, private previews, alt-text and display-name editing, and guarded
permanent deletion. It also inventories the fixed artwork already attached to content and links each
placement back to its content editor. Reusable library files support common images, PDF, text, JSON,
CSV, audio, and web video up to 25 MB each. Apply `0016_media_library.sql` before deploying it.

The **Settings & SEO** module manages site identity, default metadata, crawler access, sitemap
exclusions, exact-path 301/302 redirects, and maintenance mode. Redirect hits are counted, changes
are audited, and every settings save creates a revision record. Maintenance mode returns HTTP 503
with `Retry-After`; signed-in administrators can remain allowed. Apply
`0017_settings_and_seo.sql` before deploying the module.

The **Comments & moderation** module adds approval-first discussion to published blog articles.
Public submissions are rate limited, email addresses and IP addresses are stored only as salted
hashes, and nothing appears publicly until an authorized administrator approves it. Moderators can
approve, reject, mark spam, permanently delete, and publish staff replies. The control panel also
includes permission-aware global record search, a dismissible first-run tour, and unsaved-change
warnings in the content editor. Apply `0023_comments_and_hardening.sql` before deployment.

Private database snapshots support a guarded two-step restore. **Inspect restore** validates the
backup format, size, schema columns, and table-by-table record counts without changing data. Applying
the restore requires typing an exact snapshot-specific phrase and automatically creates a recovery
snapshot first. Credentials, 2FA keys, sessions, API tokens, audit history, and system metadata are
excluded from restore so content recovery cannot lock administrators out or reactivate secrets.

The production control panel lives at `/admin` and manages the public catalogs without rebuilding static data files.

## Production resources

- Pages project: `softcursesystems`
- D1 database binding: `CMS_DB` → `softcurse-cms`
- Private R2 binding: `CMS_ASSETS` → `softcurse-cms-assets`
- Required secret: `ADMIN_PASSWORD`
- Recommended 2FA encryption secret: `ADMIN_TOTP_KEY`
- Optional Workers AI binding: `AI`
- Future commerce secret: `COMMERCE_DATA_KEY` (leave unset until entitlement operations are needed)

Set the password interactively so it is never stored in Git or shell history:

```powershell
npx wrangler pages secret put ADMIN_PASSWORD --project-name softcursesystems
```

Set `ADMIN_TOTP_KEY` the same way with a different long random value before enabling production 2FA.
In the Cloudflare Pages project settings, add a Workers AI binding named exactly `AI`. The
`AI_DAILY_REQUEST_LIMIT` variable defaults to `10`; keep it low to protect the free allocation.

The username defaults to `softcurse`. Sessions last 12 hours, use an HTTP-only same-site cookie, and mutations require a same-origin browser request.

When paid delivery is activated later, create a long, unique `COMMERCE_DATA_KEY` and upload it interactively. It is used as an HMAC key so customer email addresses are never stored in plain text. Changing this key after customer records exist will prevent the same email from matching its earlier identity.

## Content workflow

1. Open a module and create or edit a record.
2. Save descriptive content as a draft.
3. Open **Visual Assets**. Every slot shows its exact required size before selection. The browser crops, resizes, and converts the source to WebP before upload.
4. Open **Launchers & Files**.
   - Add a web launcher for a hosted game or app.
   - Add GitHub Releases, MEGA, itch.io, Google Drive, OneDrive, Dropbox, or custom HTTPS links without consuming R2 storage.
   - Mark one primary download and keep additional providers as mirrors.
   - Upload an installer to R2 only when Softcurse-managed storage is preferred. Large files use multipart uploads.
5. Open **Commerce** to mark the product free, paid, external-store, or coming-soon. Commerce is dormant by default and live sales are server-locked.
   - The entitlement section stays read-only until `COMMERCE_DATA_KEY` exists.
   - After activation, it can grant manual access, issue hashed license keys, and create expiring download links for published R2-managed files.
6. Preview the public page, then change the record and release states to **Published**.

## Chronicle workflow

Chronicles include a dedicated **Chapters** tab. It imports the existing bundled chapter references and supports:

- Complete UTF-8 `.html`/`.htm` uploads up to 2 MB per chapter.
- Draft, published, and archived states; chapter numbering; titles; optional POV labels; and ordering controls.
- Sandboxed previews, replacement uploads, source downloads, and deletion.
- R2-managed chapter files for new uploads. Existing bundled HTML remains supported until it is replaced.

Uploaded interactive HTML runs in an isolated sandbox with network requests, forms, parent-page access, and same-origin access blocked. Inline chapter scripts and styles remain available, together with the existing Google Fonts dependency.

## Release and commerce safety

- External downloads must use HTTPS and provider-specific links are hostname validated.
- Release records support stable, beta, alpha, and development channels plus version, platform, architecture, file size, release notes, and SHA-256.
- Paid-download tables for orders, entitlements, licenses, idempotent payment events, and expiring download tokens are provisioned but inactive.
- Protected downloads work only for private R2-managed releases. GitHub, MEGA, and similar external links are public at their provider and cannot be protected by Softcurse tokens.
- Generated license keys and download URLs are displayed once. The database stores only their hashes.
- `COMMERCE_LIVE_ENABLED` remains `false`. Card data is never collected or stored by Softcurse.

Archiving removes a managed record from the public catalog without destroying it. Permanent deletion is supported by the API but intentionally not exposed as a one-click editor action.

## Asset specifications

Specifications are centralized in `functions/_lib/cms.js` and returned by `/api/admin/schema`. The server validates slot, content type, output dimensions, WebP signature, and upload size.

## Development and deployment

Create an ignored `.dev.vars` file for local login:

```text
ADMIN_PASSWORD="your-local-only-password"
```

Then run:

```powershell
npm run build
npx wrangler d1 migrations apply softcurse-cms --local
npm run pages:dev
```

Normal local development intentionally starts without Workers AI, so the assistant displays
**Unavailable** while every other admin feature remains usable. To test real AI inference, first
authenticate Wrangler and start the AI-enabled preview:

```powershell
npx wrangler login
npm run pages:dev:ai
```

The free allocation and model availability are controlled by the Cloudflare account. The UI and API
fail closed if the `AI` binding is absent; generated text always requires manual review.

Production migrations and deployment:

```powershell
npx wrangler d1 migrations apply softcurse-cms --remote
npm run deploy
```

## System, analytics, and backups

The operations center records cookie-free, aggregated page views by day, path, referring host,
device class, and country code. It does not store visitor IP addresses or build visitor profiles.
Analytics begin when migration `0019_system_and_analytics.sql` is deployed; earlier traffic cannot
be reconstructed.

Database backups are explicit administrator actions. Each snapshot is stored as JSON under the
private `backups/` prefix in R2 and has a D1 manifest containing its record count, size, creator,
and timestamp. The export action downloads the same portable JSON structure directly. Automated
restore is intentionally disabled until schema validation, dry-run diffing, and rollback safeguards
are implemented.
