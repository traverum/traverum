---
description: Promote an accepted decision from brain/awareness/decisions/ into the wiki
argument-hint: <decision-slug>
---

Promote decision: $ARGUMENTS

## Steps

1. **Read `brain/awareness/decisions/<slug>.md`.**
   - Confirm the frontmatter has `status: accepted`.
   - If the status is `proposed` or `superseded`, stop and ask the user whether to proceed or update the status first.

2. **Find the target wiki page.**
   - Consult `brain/memory/wiki/index.md`.
   - The target is usually the entity or concept page the decision affects (e.g., a decision about Stripe off-session charging goes into `[[payment-modes]]` or `[[commission]]`).
   - If no obvious target exists, ask the user where it should land — or propose creating a new page.

3. **Show the user the proposed diff.** Make it easy to eyeball: target page, insertion point, added/updated lines. Wait for approval before writing.

4. **Update the wiki page in-place.**
   - Bump `updated:` in the frontmatter.
   - Add the new knowledge — prefer enriching existing sections over appending a new one at the bottom.
   - Add `[[cross-links]]` where relevant.

5. **Append to `brain/memory/wiki/log.md`:**

   ```
   ## [YYYY-MM-DD] promote | decision <slug> → wiki/<page>
   ```

6. **Archive the decision file:**

   ```
   git mv brain/awareness/decisions/<slug>.md brain/awareness/decisions/archive/
   ```

## Rules

- Never promote without the user's sign-off on the diff.
- Never duplicate content — if the decision is already captured, just archive it (with a note in `log.md` explaining why no wiki change was needed).
