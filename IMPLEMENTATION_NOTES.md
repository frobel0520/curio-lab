# Curio Lab Implementation Notes

## Repository audit

- Audited: 2026-08-09
- Existing application code: none
- Existing package manager configuration: none
- Existing Git repository: none
- Available runtime: Node.js 24.14.1
- Product source of truth: `preview.md`

## Accepted architecture decisions

- Product brand: 好奇一下 Curio Lab
- Repository and project folder: `curio-lab`
- Mother site: one application containing multiple tools
- First tool namespace: `/tools/cat-cost`
- Initial hosting target: Cloudflare Pages or Workers
- Initial persistence: browser LocalStorage only
- Advertising: deferred; no AdSense code in the product MVP

## Route decision

The original standalone routes in `preview.md` will be namespaced under the first tool:

- `/tools/cat-cost`
- `/tools/cat-cost/calculator`
- `/tools/cat-cost/result`
- `/tools/cat-cost/methodology`
- `/tools/cat-cost/faq`

Shared legal and brand pages remain at the mother-site level.

## Assumptions

- The initial tool remains fully client-side and requires no database or backend.
- Cloudflare deployment configuration will be added after the local production build passes.
- Visual design tokens are recorded in `brand-spec.md`.

## V0 interface checkpoint

- Added the Curio Lab mother-site home page.
- Added the first tool landing page at `/tools/cat-cost`.
- Added a clickable calculator shell at `/tools/cat-cost/calculator`.
- Added minimal shared about, privacy, and terms routes so navigation has no dead links.
- Configured a static export in `next.config.ts` for a Cloudflare-compatible output baseline.
- Verified on 2026-08-09: typecheck, lint, and production build pass.
- The calculator button intentionally stops after the first screen in v0; domain logic is the next phase after visual approval.
- V0 feedback: the warm-humanist direction was approved; display heading sizes were reduced by roughly 20–30% before feature development.

## Gate A functional calculator

- Added centralized domain types and Taiwan preset configuration under `lib/calculator`.
- Preset amounts are reversible placeholders marked `TODO_PRODUCT_REVIEW`; no amounts are hardcoded in React components.
- Duration accepts an arrival date or a direct years/months fallback.
- Added an eight-step calculator with preset, custom, and zero-cost paths.
- Added schema-versioned LocalStorage recovery and reset behavior.
- Added a pure calculation engine for historical totals, category reconciliation, and lifetime averages.
- Added the local-only result route, category breakdown, methodology, and FAQ pages.
- Added executable unit assertions covering leap-day duration, recurring cost, category reconciliation, future one-off exclusion, age boundaries, and invalid numeric input.
- Verified on 2026-08-09: tests, typecheck, lint, and static production build pass.

## Remaining product review

- Confirm Taiwan preset amounts before public launch.
- Approve or revise the current share-card copy before public launch.

## Simplification feedback

- Food remains a fast monthly-cost estimate; brand, body weight, meals, and serving-size modeling are intentionally out of scope.
- Removed arrival-date input. Relationship duration uses direct years/months.
- Removed the methodology call-to-action from the result page; restart remains available.

## Share-first result

- Removed cat-age input and the future scenario entirely.
- Added a native Canvas 1080 × 1350 result card with no new dependency.
- Mobile browsers use file-based Web Share when supported.
- Unsupported browsers download the PNG instead; the UI does not mislabel a calculator URL as a shared result.
- Share card currently uses the brand name rather than an unconfirmed domain.
- Removed non-essential quote and methodology copy from the share card.
- The card now carries the runtime tool URL, and Web Share sends the image plus a `?ref=share-card` return link.
- Direct targeting of FB/IG/Threads is intentionally not faked: the standards-based system share sheet controls available destinations.

## Mixed social share panel

- Added an accessible share sheet with Facebook, LINE, Instagram, Threads, copy-link, and download-image actions.
- Facebook and Threads open their URL/text sharing flows with platform-specific `ref` parameters.
- LINE uses its official `https://line.me/R/share` App Link, passing the caption and return URL to the LINE share screen on supported mobile devices.
- Instagram uses file-based Web Share; unsupported browsers download the PNG for manual upload.
- Added `react-icons` for recognizable platform and utility icons.
- Added tool-level social metadata for link previews.

## Enhanced mixed sharing

- Facebook, Instagram, and Threads now generate the PNG first, then pass the card, caption, and return link to the native share sheet when file sharing is supported.
- The site cannot force a native share-sheet destination. The interface tells the user to select the platform they tapped; Instagram users can then choose Stories inside the app.
- Fallbacks are explicit: Facebook downloads the card and opens URL sharing, Threads downloads the card and opens its text intent, and Instagram downloads the card for manual upload.
- The result card includes both the return URL and a QR code. A public production origin is required for off-device return traffic.
- R2 has a monthly free allowance but can bill overages. Under the current zero-cost requirement, public card storage and Meta OAuth publishing remain disabled.

## Cloudflare share architecture

- Added a separate Cloudflare Worker under `worker/`; the Next.js mother site remains a static export.
- R2 was replaced by Workers KV because enabling R2 required payment details. D1 tracks daily/monthly usage, live bytes, hashed per-client uploads, card expiry, and one-time OAuth state.
- Conservative caps are 500 uploads/day, 10,000/month, 50,000 image reads/day, 1,000,000/month, 500 MB live storage, five uploads/client/day, and 1.5 MB/card.
- Public result pages and KV images expire after seven days. Scheduled cleanup removes expired metadata and reconciles tracked storage.
- The frontend uploads only after the user opens the share panel. API failure or quota exhaustion automatically restores the local mixed-sharing behavior.
- Threads OAuth and image publishing are implemented behind configuration. Tokens are used once and are not persisted; the feature remains off until a verified Meta authorization URL and app credentials are supplied.
- Production Workers use the account subdomain `curio-lab.workers.dev`: the mother site is `www.curio-lab.workers.dev` and the share API is `api.curio-lab.workers.dev`.
