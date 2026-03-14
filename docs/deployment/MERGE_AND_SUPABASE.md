# Merge to main and Supabase

Use this when merging a feature branch (e.g. `feature/receptionist-tool`) into `main` and applying database changes to production.

## 1. Finish work on the feature branch

```bash
# From repo root
git status   # see what’s changed

# Ignore Supabase CLI temp files (they are in .gitignore)
# Stage what you want to merge (code, migrations, docs)
git add -A
git status   # confirm; remove any file you don’t want with git restore --staged <file>

git commit -m "Your merge message, e.g. Receptionist tool: booking form, contact UI, link to widget"
git push origin feature/receptionist-tool
```

## 2. Merge into main

**Option A — merge locally**

```bash
git checkout main
git pull origin main
git merge feature/receptionist-tool -m "Merge branch 'feature/receptionist-tool'"
git push origin main
```

**Option B — merge via Pull Request (recommended)**

1. Open a PR: `feature/receptionist-tool` → `main`.
2. Review and merge on GitHub/GitLab.
3. Pull the updated main locally: `git checkout main && git pull origin main`.

## 3. Apply Supabase migrations to production

Migrations live in `apps/dashboard/supabase/migrations/`. After merging to main, apply them to your **production** Supabase project.

1. **Link to production** (only needed once per machine, or if you previously linked to a branch):

   ```bash
   cd apps/dashboard
   pnpm exec supabase link --project-ref vwbxkkzzpacqzqvqxqvf
   ```

   When prompted, use your **production** database password.

2. **Push migrations** (runs only migrations that haven’t been applied yet):

   ```bash
   pnpm exec supabase db push --linked
   ```

3. **Verify** in the [Supabase Dashboard](https://supabase.com/dashboard/project/vwbxkkzzpacqzqvqxqvf): Database → Migrations. All migrations from `apps/dashboard/supabase/migrations/` should be listed and applied.

## 4. Deploy app (Vercel)

If your Vercel projects deploy from `main`:

- **Widget** (book.veyond.eu) and **Dashboard** will redeploy from the new `main`.
- Ensure production env vars point to the **production** Supabase URL and keys (not the receptionist-test branch).

## Reference

| Environment   | Supabase project ref   | Use |
|---------------|------------------------|-----|
| Production    | `vwbxkkzzpacqzqvqxqvf` | main app + receptionist on book.veyond.eu |
| Branch (test) | `jpntijqynbdjoxvxnahq` | receptionist-test branch only |

After merging, production DB and app both use the same migrations and code from `main`.
