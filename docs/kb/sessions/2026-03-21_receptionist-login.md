# 2026-03-21_receptionist-login

## Goal

Fix receptionist tool login for users with multiple partner memberships (e.g. `eliassalmi02@gmail.com`).

## Blast Radius

(filled by /plan)

## Done

- Traced `no_hotel_config` to `getReceptionistContext()` in `apps/widget/src/lib/receptionist/auth.ts`.
- Confirmed via production DB: user had multiple `user_partners` rows; supplier partner had no `hotel_configs`; receptionist row had a valid `hotel_config_id`.
- Replaced non-deterministic `.limit(1).single()` on memberships with: fetch all allowed roles, sort (receptionist → explicit `hotel_config_id` → other), iterate until a `hotel_configs` row resolves.
- Logged decision in `docs/decisions.md` (2026-03-21).

## Decisions

- Receptionist context resolution for multi-partner users: see `docs/decisions.md` § 2026-03-21.

## Open Items

- [ ] Optionally add a short **Design decisions** note in `docs/product/receptionist/browse-and-book.md` (or `_overview.md`) describing multi-partner context choice — only if product docs should mirror implementation.

## Notes

- Root cause was unordered `limit(1)` on `user_partners`, not missing data for the test account.
