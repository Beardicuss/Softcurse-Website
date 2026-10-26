# Security review — 2026-10-09

## Executive summary

No critical or high-severity findings were identified in the React 19 frontend or Cloudflare Pages
Functions admin surface. Authentication cookies are HTTP-only, Secure, and SameSite=Strict;
state-changing admin endpoints require a same-origin request; passwords use salted PBKDF2; TOTP
secrets are encrypted; database queries use bound parameters; public comments are approval-first;
and uploaded Chronicle HTML runs in a sandbox without same-origin or network access.

One medium-severity defense-in-depth gap remains intentionally open: the main application CSP is
report-only because the Developer Tools module supports administrator-configured external scripts.
That capability is now hardened so an enabled script must be a public HTTPS resource with valid
SHA-256, SHA-384, or SHA-512 Subresource Integrity metadata.

## Medium severity

### SEC-001 — Main application CSP is report-only

- Rule: JS-CSP-001
- Severity: Medium
- Location: `public/_headers:7`
- Evidence: the policy is delivered as `Content-Security-Policy-Report-Only`, so violations are
  observed but not blocked.
- Impact: if another XSS defect is introduced later, this policy will not prevent execution.
- Current mitigation: React escapes rendered CMS/comment text; no application `dangerouslySetInnerHTML`
  sink is used; third-party integrations require HTTPS and SRI; sensitive Chronicle HTML is isolated
  by the enforced sandbox policy in `functions/_lib/chapters.js:67`.
- Recommended resolution: move external scripts to an explicit deployment-time origin allowlist,
  verify the report-only telemetry is clean, then promote the current policy to enforced CSP.
- False-positive note: absence of an enforced CSP is defense-in-depth, not evidence of a present XSS
  exploit.

## Resolved during this review

### SEC-002 — External scripts could be enabled without SRI

- Previous severity: Medium
- Locations: `functions/api/admin/developer/index.js:52`,
  `src/components/common/IntegrationLoader.jsx:12`
- Resolution: enabled scripts now require a syntactically valid SHA-256/384/512 integrity value on
  the server, and the browser loader refuses records without it.

## Verified controls

- Admin session cookie flags: `functions/_lib/cms.js:178`
- Same-origin mutation enforcement: `functions/_lib/cms.js:185`
- Public webhook destinations reject obvious local/private IP targets:
  `functions/_lib/developer.js:17`
- Sandboxed Chronicle uploads: `functions/_lib/chapters.js:67`
- No enabled production external scripts existed at review time.

## Revalidation

Run `npm run check` and `npm run smoke:production` after security-sensitive changes. Before enforcing
CSP, inspect Cloudflare CSP reports and test Turnstile, Web Analytics, admin login, the comment form,
and any explicitly approved integration script.
