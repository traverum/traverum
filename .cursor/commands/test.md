Run the full test suite and give a deploy verdict.

## Steps

1. **Run unit tests:**
   - Execute `pnpm test:pull` in the terminal
   - Wait for completion and capture the results

2. **Run E2E tests:**
   - Execute `pnpm test:e2e` in the terminal
   - Wait for completion and capture the results

3. **Analyze failures (if any):**
   - For each failure, identify which product journey it relates to (reference `docs/product/`)
   - Classify: is this a **regression** from recent work, or a **pre-existing** issue?

4. **Update `docs/testing.md`:**
   - Scan all `*.test.ts` files in `apps/widget/src/`, `apps/dashboard/src/`, `packages/shared/src/`
   - Scan all `*.spec.ts` files in `apps/e2e/tests/`
   - Rebuild the unit test and E2E test tables with current file paths and test counts
   - Cross-reference against `docs/product/` to update the Gaps section
   - Update the "Last updated" date

5. **Deploy verdict:**
   - **Safe to deploy** — all tests pass
   - **Safe with caveat** — failures are pre-existing, not caused by recent changes
   - **Blocked** — regression detected, with explanation of what broke and which journey is affected
