# Backend Operations Plan: Staging/Production Database Management

## Context

Traverum has a growing Supabase backend (51+ migrations, 2 edge functions, RLS, PostGIS) but lacks formal separation between staging and production databases. Currently all apps point to a single Supabase project (`aefmaxslyjlhtlulvgaa` / ref `vwbxkkzzpacqzqvqxqvf`). The `active-state.md` documents "Staging DB may drift from production schema" as a known issue. The team uses AI assistants (Claude Code, Cursor) as primary development tools, so documentation and skills are the primary way to enforce workflows.

**Goal:** Waterproof staging/production database management, professional migration workflow, and deployment safety — all optimized for a small AI-assisted team.

---

## Decision: What to create and why

### Why update the existing migration skill (not create a new one)

The `database-migrations` SKILL.md is already excellent — 228 lines covering the full workflow. Creating a separate "backend operations" skill would fragment knowledge. Instead, we **extend** the existing skill with the missing pieces: sync checks, breaking change protocol, rollback patterns, and the staging project reference.

### Why add a "Backend Operations" section to CLAUDE.md (not a separate doc)

CLAUDE.md is the first file every Claude Code session reads. Backend safety rules need to be there — not buried in a skill that only triggers on migration keywords. The project currently has no root `CLAUDE.md` — the rules live in `placeholde-for-claude.md`. We'll **rename it to `CLAUDE.md`** and add the backend section.

### Why NOT create a new agent

A dedicated backend agent would be overkill. The migration skill already auto-triggers on schema change keywords. Adding backend rules to CLAUDE.md ensures they're always in context. An agent adds indirection without value for a 1-3 person team.

### Why add a GitHub Action for migration safety

CI catches mistakes before they reach production. A lightweight, file-only check (no database connection needed, no secrets) validates migration filenames, flags destructive SQL, and verifies types were regenerated. High value, zero infrastructure.

---

## Implementation Plan

### 1. Rename `placeholde-for-claude.md` to `CLAUDE.md` and add backend section

**File:** `CLAUDE.md` (root, renamed from `placeholde-for-claude.md`)

Keep all existing content. Add new section after "Hard rules":

```markdown
## Backend Operations

### Database Environments

| Environment | Project Ref | MCP Server | Purpose |
|---|---|---|---|
| Staging | <staging-ref> | user-supabase-staging | Development, preview deploys, E2E, local dev |
| Production | vwbxkkzzpacqzqvqxqvf | <production MCP> | Live users, real Stripe |

Supabase CLI (`config.toml`) is linked to **staging** by default. Production access requires explicit `--project-ref` or the production MCP server.

### Before Any Schema Change

Read `.agents/skills/database-migrations/SKILL.md` in full. No exceptions.

### Database Safety Rules

- Never apply DDL to production without applying to staging first
- Never use `execute_sql` for DDL — always `apply_migration`
- Never drop/rename columns without grepping the entire codebase first
- Always regenerate types after schema changes; always re-append convenience aliases
- Breaking changes require two-phase migrations (see migration skill)
- Always run `list_migrations` on both environments before applying to production — catch drift early

### Deployment Order (schema + code changes)

**Additive changes** (new column/table): migrate first, then deploy apps
**Destructive changes** (drop column): deploy apps first (stop reading the column), then migrate
**Renames/type changes**: two-phase — add new + migrate data → deploy apps → drop old

Standard sequence:
1. Apply migration to staging → verify
2. Commit migration + types + app code
3. Merge PR
4. Apply migration to production
5. Vercel auto-deploys from main
6. Verify on production

### Pre-deployment Checklist

Before merging any PR with schema changes:
- [ ] Migration SQL is idempotent (`IF NOT EXISTS`, `CREATE OR REPLACE`)
- [ ] Applied to staging and verified
- [ ] Migration file saved to `apps/dashboard/supabase/migrations/`
- [ ] Types regenerated, convenience aliases preserved
- [ ] `pnpm --filter @traverum/widget typecheck` passes
- [ ] RLS policies added for any new tables
- [ ] No destructive operations (or two-phase plan documented)
```

Also add to "Environment Variables" section a note about Vercel scoping:
- Production Vercel env vars → production Supabase
- Preview/Development Vercel env vars → staging Supabase

### 2. Update `database-migrations` SKILL.md

**File:** `.agents/skills/database-migrations/SKILL.md`

Changes (surgical updates, not a rewrite):

**a) Add environment table** after the Golden Rules section:

```markdown
## Environments

| Environment | Project Ref | MCP Server |
|---|---|---|
| Staging | <staging-ref> | user-supabase-staging |
| Production | vwbxkkzzpacqzqvqxqvf | <production MCP> |
```

**b) Add "Sync Check" step** between Step 7 (commit) and Step 8 (apply to production):

```markdown
### Step 7.5 — Sync check (before production)

Before applying to production, run `list_migrations` on BOTH environments.
Verify:
- Production has all migrations that staging has minus the new one(s)
- No unexpected migrations exist on either side
- If drift is found: STOP. Reconcile before proceeding.
```

**c) Add "Breaking Change Protocol"** section after the Migration Types section:

```markdown
## Breaking Change Protocol

When a migration drops columns, renames, or changes types:

### Phase 1 (backward-compatible)
- Add the new column/table alongside the old one
- Write a data migration to copy/transform data
- Apply to staging → commit → merge → apply to production
- Deploy all apps (they still use old column, new column just sits there)

### Phase 2 (cleanup)
- Update all app code to use the new column
- Deploy all apps
- Write a migration to drop the old column
- Apply to staging → commit → merge → apply to production

Never combine Phase 1 and Phase 2 in the same PR.
```

**d) Add "Rollback Patterns"** subsection:

```markdown
## Rollback Patterns

- **Additive migrations** (new column/table): No rollback needed — unused columns are harmless
- **Data migrations**: Take a logical backup of affected rows BEFORE running
- **Destructive migrations**: Write a paired rollback migration file — don't apply it, just have it ready
- **Emergency rollback**: App-level rollback via Vercel (promote previous deployment), then assess database state
```

### 3. Update `DEPLOYMENT.md` — add staging environment

**File:** `docs/deployment/DEPLOYMENT.md`

Add staging project ref to the environment table and Vercel environment scoping section.

### 4. Create migration check GitHub Action

**File:** `.github/workflows/migration-check.yml`

Lightweight, file-only CI check (no secrets, no DB connection):
1. Filename validation (YYYYMMDDHHMMSS pattern)
2. Destructive SQL warning (DROP TABLE, DROP COLUMN, TRUNCATE)
3. Types regenerated check (new .sql → types.ts modified)
4. Convenience aliases check

### 5. Add typecheck to existing test workflow

**File:** `.github/workflows/test.yml` — add `pnpm --filter @traverum/widget typecheck`

### 6. Update `config.toml` to link to staging

**File:** `apps/dashboard/supabase/config.toml` — change `project_id` to staging ref

---

## Two-Database Setup (operational steps)

1. Create staging Supabase project (`traverum-staging`)
2. Apply all 51 migrations via `supabase db push --linked`
3. Deploy edge functions to staging with test Stripe keys
4. Update Vercel env vars (production scope → production DB, preview scope → staging DB)
5. Update GitHub secrets for E2E to point to staging
6. Seed staging with test data
