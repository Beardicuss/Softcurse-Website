# Softcurse Control Panel

The production control panel lives at `/admin` and manages the public catalogs without rebuilding static data files.

## Production resources

- Pages project: `softcursesystems`
- D1 database binding: `CMS_DB` → `softcurse-cms`
- Private R2 binding: `CMS_ASSETS` → `softcurse-cms-assets`
- Required secret: `ADMIN_PASSWORD`
- Future commerce secret: `COMMERCE_DATA_KEY` (leave unset until entitlement operations are needed)

Set the password interactively so it is never stored in Git or shell history:

```powershell
npx wrangler pages secret put ADMIN_PASSWORD --project-name softcursesystems
```

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
npx wrangler pages dev dist
```

Production migrations and deployment:

```powershell
npx wrangler d1 migrations apply softcurse-cms --remote
npm run deploy
```
