#!/usr/bin/env bash
# Copy production database data to the receptionist branch (or any branch).
# Only copies "content" tables (partners, experiences, etc.), not users/user_partners,
# so the branch auth stays independent and restore does not hit auth FKs.
#
# Prerequisites: pg_dump and psql on PATH (e.g. from Postgres or Supabase CLI).
#
# 1. Get connection strings from Supabase Dashboard:
#    - Production: Project Settings → Database → Connection string (URI, Session mode).
#    - Branch: same for the branch project (e.g. receptionist-test).
#
# 2. Set env vars (do not commit these):
#    export PRODUCTION_DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
#    export BRANCH_DATABASE_URL="postgresql://postgres.[BRANCH-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
#
# 3. Run:
#    ./apps/dashboard/supabase/scripts/copy-production-to-branch.sh
#
# 4. After restore: sign up at the branch's /receptionist/login, then in SQL Editor run
#    the user_partners INSERT (see seed.sql or receptionist-tool.md) to link your user to a hotel.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DUMP_FILE="${SCRIPT_DIR}/.production_data_dump.sql"

# Tables we copy (no users/user_partners — branch auth stays separate)
TABLES="partners hotel_configs experiences experience_sessions media distributions reservations bookings"

if [[ -z "${PRODUCTION_DATABASE_URL}" || -z "${BRANCH_DATABASE_URL}" ]]; then
  echo "Set PRODUCTION_DATABASE_URL and BRANCH_DATABASE_URL (see script header)."
  exit 1
fi

SKIP_CLEAR="${SKIP_CLEAR:-}"
STEP=1
STEPS=3
[[ -n "$SKIP_CLEAR" ]] && STEPS=2

echo "Step ${STEP}/${STEPS}: Dumping content tables (data only) from production..."
TABLES_ARG=""
for t in $TABLES; do TABLES_ARG="${TABLES_ARG} -t public.${t}"; done
pg_dump "${PRODUCTION_DATABASE_URL}" \
  --schema=public \
  --data-only \
  --no-owner \
  --no-privileges \
  ${TABLES_ARG} \
  --file="${DUMP_FILE}"

STEP=$((STEP + 1))
if [[ -z "$SKIP_CLEAR" ]]; then
  echo "Step ${STEP}/${STEPS}: Clearing branch data..."
  psql "${BRANCH_DATABASE_URL}" -f "${SCRIPT_DIR}/clear-branch-data.sql"
  STEP=$((STEP + 1))
else
  echo "Skipping clear (SKIP_CLEAR is set)."
  STEP=$((STEP + 1))
fi

echo "Step ${STEP}/${STEPS}: Restoring production data into branch..."
psql "${BRANCH_DATABASE_URL}" -f "${DUMP_FILE}"

echo "Done. Consider removing dump file: rm ${DUMP_FILE}"
echo "Next: sign up at the branch receptionist login, then link your user to a hotel (see seed.sql or docs)."
