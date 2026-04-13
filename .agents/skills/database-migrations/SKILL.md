---
name: database-migrations
description: >-
  Step-by-step workflow for Supabase database migrations.
  Use when making schema changes, creating tables, altering columns,
  adding RLS policies, writing DDL, or any database modification.
  Triggers on: migration, schema change, add column, create table,
  alter table, DDL, database change, new table, Supabase schema,
  drop column, rename column, add index, add constraint.
---

# Database Migrations

Read this skill in full before writing or applying any migration.

## Environments

| Environment | MCP Server | Supabase Project | Vercel Scope | When to use |
|---|---|---|---|---|
| Staging | `user-supabase-staging` | Staging project | Preview deployments | All development, testing, new migrations |
| Production | Production MCP | Production project | Production deployments | After staging is verified |

Vercel env vars are scoped: `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` point to staging on Preview, production on Production.

## Golden Rules

1. **Migrations live in git.** Both environments consume the same SQL file.
2. **Never ad-hoc SQL into production.** Every DDL change goes through `apply_migration`, never `execute_sql`.
3. **Staging first, always.** Production only after staging is verified and tested.
4. **Identical SQL.** The SQL applied to production must be byte-for-byte identical to what was applied to staging and saved in git.
5. **One migration per logical change.** Don't bundle unrelated changes into one file.
6. **Always regenerate types and re-append convenience aliases.** See `docs/kb/decisions.md` > Types.

## Before Writing Any SQL

Stop. Answer these questions before writing a single line:

- [ ] What tables/columns are affected?
- [ ] Which apps read/write these tables? (widget API routes, dashboard reads, admin reads, receptionist)
- [ ] Does this add a new table? -> RLS policies are **required**.
- [ ] Is this a breaking change? (dropping columns, renaming, changing types, tightening constraints)
- [ ] If breaking: is there app code that must be deployed simultaneously?
- [ ] Can the migration be idempotent? (`IF NOT EXISTS`, `IF EXISTS`, `CREATE OR REPLACE`)
- [ ] What is the rollback plan if this goes wrong?

## Workflow

Follow these steps in exact order. Do not skip any step.

### Step 1 — Write the migration SQL

Write clean, idempotent SQL. Use `IF NOT EXISTS` / `IF EXISTS` where possible.

Include RLS policies for any new table. Include comments for non-obvious decisions.

```sql
-- Example: adding a column
ALTER TABLE experiences
  ADD COLUMN IF NOT EXISTS max_group_size integer;

-- Example: new table (always include RLS)
CREATE TABLE IF NOT EXISTS experience_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE experience_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can manage tags for own experiences"
  ON experience_tags FOR ALL
  USING (
    experience_id IN (
      SELECT e.id FROM experiences e
      JOIN user_partners up ON up.partner_id = e.partner_id
      WHERE up.user_id = auth.uid()
    )
  );
```

### Step 2 — Apply to staging

Use the `user-supabase-staging` MCP server, `apply_migration` tool.

```
Server:   user-supabase-staging
Tool:     apply_migration
Args:
  name:   descriptive_snake_case_name  (without timestamp prefix)
  query:  <the SQL from Step 1>
```

The MCP `apply_migration` tool tracks the migration in Supabase's internal migration history. This is why we never use `execute_sql` for DDL.

### Step 3 — Verify on staging

Run verification queries via `execute_sql` on `user-supabase-staging`:

- Confirm the table/column exists: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '...'`
- Confirm RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = '...'`
- Confirm policies exist: `SELECT policyname FROM pg_policies WHERE tablename = '...'`
- If data migration: spot-check a few rows

If anything is wrong, fix the SQL, apply a corrective migration to staging, and restart from Step 1.

### Step 4 — Save migration file to git

Save the **exact SQL that was applied** to:

```
apps/dashboard/supabase/migrations/YYYYMMDDHHMMSS_descriptive_name.sql
```

Timestamp format: `YYYYMMDDHHmmSS` (14 digits, UTC-ish, just be consistent and monotonically increasing).

Examples:
```
20260324120000_add_experience_tags.sql
20260325090000_add_max_group_size_to_experiences.sql
```

The file content must be identical to the SQL applied in Step 2.

### Step 5 — Regenerate Supabase types

Generate types from the **staging** database so the codebase matches the new schema:

Use the `user-supabase-staging` MCP server, `generate_typescript_types` tool, and save the output to `apps/widget/src/lib/supabase/types.ts`.

### Step 6 — Typecheck

Run the widget typecheck to catch any breakage:

```bash
pnpm --filter @traverum/widget typecheck
```

If it fails, fix the app code. The migration exposed a type mismatch — that's the point of this step.

### Step 7 — Commit to git

Commit the migration file and updated types together:

```
feat(db): add experience_tags table

Migration: 20260324120000_add_experience_tags.sql
Applied to staging, verified.
```

### Step 8 — Apply to production (when ready)

This may happen in the same session or a later session. When the team is ready:

Use the **production** Supabase MCP server, `apply_migration` tool, with the **exact same SQL** from the migration file in git.

```
Server:   <production MCP server>
Tool:     apply_migration
Args:
  name:   <same descriptive name as staging>
  query:  <read from the migration file in git — do NOT rewrite>
```

**Read the SQL from the file.** Do not rewrite it from memory.

### Step 9 — Verify on production

Same verification queries as Step 3, but on the production MCP.

### Step 10 — Regenerate production types (optional)

If types were generated from staging, they should already match. Regenerate from production only if you want to double-check.

## What NOT To Do

- **Don't use `execute_sql` for DDL changes.** Always `apply_migration` so it's tracked in Supabase's migration history.
- **Don't apply to production without testing on staging first.**
- **Don't skip saving the migration file to git.** That's how schema drift happens.
- **Don't make different changes to staging vs production.** The "let me just quickly fix this on prod" trap has burned every team that tried it.
- **Don't bundle unrelated changes.** One migration per logical change. Easier to reason about, easier to roll back.
- **Don't forget RLS on new tables.** Supabase defaults to RLS disabled. An unprotected table is a security hole.
- **Don't forget to regenerate types.** Missing generated types break `next build` on Vercel (this has happened before).
- **Don't drop or rename columns without checking all apps.** Search the codebase for the column name before dropping.

## Naming Convention

```
YYYYMMDDHHMMSS_descriptive_name.sql
```

- Timestamp: 14 digits, monotonically increasing
- Name: snake_case, describes the change
- Verb prefix: `create_`, `add_`, `drop_`, `alter_`, `update_`, `fix_`

Good:
```
20260324120000_create_experience_tags.sql
20260324130000_add_max_group_size_to_experiences.sql
20260325090000_drop_legacy_booking_status.sql
```

Bad:
```
20260324_changes.sql              (vague, short timestamp)
migration_3.sql                   (no timestamp)
20260324120000_fix.sql            (too vague)
```

## MCP Tool Reference

| Tool | Server | Use for |
|------|--------|---------|
| `apply_migration` | `user-supabase-staging` | All DDL changes on staging (CREATE, ALTER, DROP, policies) |
| `apply_migration` | Production MCP | All DDL changes on production |
| `execute_sql` | Either | Read-only verification queries, data inspection, debugging |
| `list_migrations` | Either | Check which migrations have been applied |
| `list_tables` | Either | Quick schema overview |
| `generate_typescript_types` | Either | Regenerate `types.ts` after schema changes |

## Migration Types

### Schema migration (most common)
Adding/altering tables, columns, constraints, indexes. Follow the full workflow above.

### Data migration
Backfilling data, transforming existing rows. Same workflow, but:
- Never hardcode IDs that were auto-generated (they differ between environments)
- Use `WHERE` conditions to find rows by business logic, not by ID
- Consider: does the data even exist in staging? You may need to adjust.

### RLS policy changes
Same workflow. Test by querying as different roles on staging.

### Function/RPC changes
Use `CREATE OR REPLACE FUNCTION` so the migration is idempotent.

## Breaking Changes (Two-Phase Migration)

Breaking changes (dropping columns, renaming columns, changing types) require two phases to avoid downtime:

### Phase 1 — Add the new, keep the old
1. Add new column/table alongside the old one
2. Update app code to write to **both** old and new
3. Deploy app code
4. Backfill new column from old data

### Phase 2 — Remove the old (separate PR, later)
1. Update app code to read/write only the new column
2. Deploy app code
3. Drop old column in a new migration

**Never drop a column in the same deployment as the code change that stops using it.** The old code may still be running during deployment.

## Rollback Patterns

If a migration causes issues:

- **Additive changes** (new column, new table): Safe to leave in place while fixing app code. Drop in a follow-up migration if needed.
- **Data migrations**: Write a reverse migration before applying. Test the reverse on staging.
- **Destructive changes**: This is why we require two-phase. If you followed the protocol, Phase 1 is always safe to roll back (old code still works).

## Sync Check

Before applying a migration to production, verify staging and production are in sync:

```
# On both staging and production MCP:
list_migrations
```

Compare the migration lists. If production is behind, apply missing migrations in order before the new one.

## Related KB Pages

- Schema reference: `docs/kb/schema.md`
- API routes (to check which apps use a table): `docs/kb/api-routes.md`
- Technical decisions (type conventions, convenience aliases): `docs/kb/decisions.md`
