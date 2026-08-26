# Softcurse Control Panel

The production control panel lives at `/admin` and manages the public catalogs without rebuilding static data files.

## Production resources

- Pages project: `softcursesystems`
- D1 database binding: `CMS_DB` → `softcurse-cms`
- Private R2 binding: `CMS_ASSETS` → `softcurse-cms-assets`
- Required secret: `ADMIN_PASSWORD`

Set the password interactively so it is never stored in Git or shell history:

```powershell
npx wrangler pages secret put ADMIN_PASSWORD --project-name softcursesystems
```

The username defaults to `admin`. Sessions last 12 hours, use an HTTP-only same-site cookie, and mutations require a same-origin browser request.

## Content workflow

1. Open a module and create or edit a record.
2. Save descriptive content as a draft.
3. Open **Visual Assets**. Every slot shows its exact required size before selection. The browser crops, resizes, and converts the source to WebP before upload.
4. Open **Launchers & Files**.
   - Add a web launcher for a hosted game or app.
   - Upload an installer or other release file for downloadable content. Large files use multipart uploads.
5. Preview the public page, then change the record and release states to **Published**.

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
