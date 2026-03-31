# 2026-03-27_hydration-fix

## Goal
Fix hydration error on `/experiences` page — "Expected server HTML to contain a matching `<path>` in `<svg>`"

## Blast Radius
- `apps/widget/next.config.js` — webpack alias added
- `apps/admin/package.json` — lucide-react version bumped
- `apps/dashboard/package.json` — lucide-react version bumped
- `package.json` (root) — pnpm overrides added

## Done
- Diagnosed root cause: two versions of `lucide-react` in monorepo (v0.462.0 hoisted at root for admin/dashboard, v0.562.0 in widget). Next.js server bundler resolved root version, client bundler resolved widget version. SVG elements differ between versions (e.g. `<polyline>` vs `<path>` for Clock icon), causing hydration mismatch.
- Added webpack `resolve.alias` in `next.config.js` using `require.resolve` to pin lucide-react to the correct v0.562.0 from pnpm's store.
- Upgraded admin and dashboard from `^0.462.0` to `^0.562.0`.
- Added `pnpm.overrides` in root `package.json` to enforce `lucide-react@0.562.0` workspace-wide.
- Verified fix: fresh page loads show zero hydration errors.

## Decisions
- When upgrading lucide-react in any app, upgrade all apps to the same version (logged to tech-context.md).
- webpack `resolve.alias` with `require.resolve` is the reliable way to pin monorepo packages for Next.js server/client consistency in pnpm workspaces.

## Open Items
- [ ] Verify admin and dashboard still render icons correctly after lucide-react upgrade to v0.562.0
- [ ] Also present on `/receptionist` — `aria-hidden` mismatch warning from Lucide icons used without explicit `aria-hidden` prop (same root cause, now fixed by version alignment)

## Notes
- The `data-cursor-ref` warning in browser console is from Cursor's browser automation tool injecting attributes — not a real hydration issue.
- pnpm `--force` and `overrides` alone did NOT remove the duplicate version from root `node_modules` — the webpack alias was the critical fix.
