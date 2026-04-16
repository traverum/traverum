---
date: 2026-04-16
slug: widget-image-fix
---

## What we worked on

Diagnosed why some experience cards on the production widget showed gray placeholders instead of actual images, while the detail page displayed them fine.

Root cause: Vercel free tier image optimization quota exhaustion. The listing page uses Next.js `<Image>` (proxied through `/_next/image`), while the detail page's `ImageGallery` uses raw `<img>` tags — bypassing Vercel entirely.

Images are already optimized at upload time in the dashboard (WebP, 500-700KB, resized) via `browser-image-compression`, so Vercel's re-optimization was redundant double-processing.

## Decisions made

- Set `images.unoptimized: true` globally in `apps/widget/next.config.js`. Removed the `remotePatterns` whitelist (no longer needed when optimization is disabled). Upload-time optimization is sufficient.

## Files touched

- `apps/widget/next.config.js` — replaced `images.remotePatterns` array with `images.unoptimized: true`

## Open threads

- None. Change is ready to deploy.

## Handover

One-line fix in `next.config.js` — needs a deploy to the widget Vercel project. No other changes required. If image quality complaints arise later, the upload-time optimization in `apps/dashboard/src/lib/image-optimization.ts` is the place to tune (resolution, quality, file size targets).
