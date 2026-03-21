# Supabase CLI reference

Paste the Context7 documentation below this line.

---

# Supabase CLI

Supabase CLI is a command-line tool for developing, managing, and deploying Supabase projects. It enables local development with a full Supabase stack (Postgres database, authentication, storage, edge functions), database migrations management, and direct interaction with the Supabase Management API. The CLI is built in Go and can be installed via npm, Homebrew, Scoop, or directly from source.

The CLI provides a complete workflow for Supabase development: initialize projects locally, run a containerized Supabase stack, create and manage database migrations, deploy Edge Functions, generate TypeScript types from your database schema, and manage secrets. It bridges local development with hosted Supabase projects through linking, allowing you to push migrations, pull schema changes, and synchronize configurations between environments.

## Initialize a New Project

Creates the `supabase/config.toml` configuration file and directory structure for local development. This is the first step when starting a new Supabase project.

```bash
# Initialize a new Supabase project in the current directory
supabase init

# Initialize with interactive mode to configure IDE settings
supabase init --interactive

# Force overwrite existing config.toml
supabase init --force

# Initialize in a specific directory
supabase init --workdir ./my-project
```

## Bootstrap from Starter Template

Creates a new project from a starter template, providing a quick way to get started with common Supabase use cases.

```bash
# Interactive mode - prompts for template selection
supabase bootstrap

# Bootstrap with a specific template
supabase bootstrap nextjs

# Bootstrap into a specific directory
supabase bootstrap --workdir ./my-app
```

## Start Local Development Stack

Starts all Supabase services locally using Docker containers including Postgres, GoTrue (auth), Storage, PostgREST, and more. Requires Docker to be running.

```bash
# Start all services (requires ~7GB RAM)
supabase start

# Start with specific services excluded
supabase start -x gotrue,imgproxy

# Exclude multiple services
supabase start -x gotrue -x imgproxy -x storage-api

# Ignore health check failures
supabase start --ignore-health-check
```

## Stop Local Development Stack

Stops all running Supabase containers. Data is preserved by default between restarts.

```bash
# Stop the local stack (preserves data)
supabase stop

# Stop and reset all local data
supabase stop --no-backup

# Stop all Supabase projects on the machine
supabase stop --all
```

## Check Local Stack Status

Shows the status and connection details of the local development stack including API URLs and keys.

```bash
# Show status in pretty format
supabase status

# Export environment variables for supabase-js initialization
supabase status -o env

# Output as JSON
supabase status -o json
```

## Login to Supabase

Authenticates the CLI with your Supabase account using a personal access token. Required for Management API commands.

```bash
# Interactive login (opens browser)
supabase login

# Login with a token directly (for CI environments)
supabase login --token sbp_xxxxxxxxxxxxx

# Login with a named token
supabase login --token sbp_xxxxxxxxxxxxx --name "CI Token"

# Login without opening browser
supabase login --no-browser

# Use environment variable instead of login
export SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxx
```

## Link to Remote Project

Links your local project to a hosted Supabase project. Required for commands that interact with remote databases.

```bash
# Link to a project (prompts for project selection)
supabase link

# Link to a specific project
supabase link --project-ref your-project-ref

# Link with database password (for CI)
supabase link --project-ref your-project-ref --password your-db-password

# Use environment variable for password
export SUPABASE_DB_PASSWORD=your-db-password
supabase link --project-ref your-project-ref
```

## Create Database Migration

Creates a new empty migration file in the `supabase/migrations` directory with a timestamp prefix.

```bash
# Create a new migration file
supabase migration new create_users_table
# Output: Created migration: supabase/migrations/20240115120000_create_users_table.sql

# Pipe output from db diff to create migration
supabase db diff | supabase migration new add_profiles_table
```

## Diff Database Schema

Compares the local or remote database schema against migration files to identify changes. Uses migra by default.

```bash
# Diff local database against migrations
supabase db diff

# Diff and save to a new migration file
supabase db diff -f add_new_table

# Diff specific schemas only
supabase db diff --schema public,auth

# Diff against linked remote project
supabase db diff --linked

# Diff against a specific database URL
supabase db diff --db-url "postgresql://user:pass@host:5432/db"

# Use alternative diff tools
supabase db diff --use-pg-schema
supabase db diff --use-pg-delta
```

## Push Migrations to Remote

Applies all pending local migrations to a remote database. Creates a migration history table on first run.

```bash
# Push migrations to linked project
supabase db push

# Dry run - show what would be applied
supabase db push --dry-run

# Push to a specific database URL
supabase db push --db-url "postgresql://user:pass@host:5432/db"

# Include custom roles from supabase/roles.sql
supabase db push --include-roles

# Include seed data after migrations
supabase db push --include-seed

# Push including all migrations not in history
supabase db push --include-all
```

## Pull Schema from Remote

Pulls schema changes from a remote database and creates a new migration file locally.

```bash
# Pull schema from linked project
supabase db pull

# Pull with custom migration name
supabase db pull my_schema_changes

# Pull specific schemas
supabase db pull --schema public,extensions

# Pull from specific database URL
supabase db pull --db-url "postgresql://user:pass@host:5432/db"
```

## Reset Local Database

Recreates the local Postgres container and applies all migrations from scratch. Useful for testing migration sequences.

```bash
# Reset local database
supabase db reset

# Reset without running seed.sql
supabase db reset --no-seed

# Reset up to a specific migration version
supabase db reset --version 20240115120000

# Reset to the last N migrations only
supabase db reset --last 5

# Reset linked remote database (dangerous!)
supabase db reset --linked
```

## Dump Database Schema or Data

Exports schema or data from a database using pg_dump.

```bash
# Dump schema to stdout
supabase db dump

# Dump schema to file
supabase db dump -f schema.sql

# Dump data only (INSERT statements)
supabase db dump --data-only -f data.sql

# Dump data using COPY statements (faster)
supabase db dump --data-only --use-copy -f data.sql

# Dump specific schemas
supabase db dump --schema public,auth -f schema.sql

# Dump only cluster roles
supabase db dump --role-only -f roles.sql

# Exclude specific tables from data dump
supabase db dump --data-only -x public.large_table -f data.sql

# Dump from local database
supabase db dump --local -f local_schema.sql
```

## Lint Database Schema

Checks your database schema for common issues and anti-patterns using plpgsql_check.

```bash
# Lint local database
supabase db lint

# Lint linked project
supabase db lint --linked

# Lint specific schemas
supabase db lint --schema public,private

# Set minimum level to report
supabase db lint --level warning

# Exit with error on specific level
supabase db lint --fail-on error
```

## List Migrations

Shows the status of local and remote migrations, indicating which have been applied.

```bash
# List migrations comparing local to linked project
supabase migration list

# List comparing to local database
supabase migration list --local

# List comparing to specific database
supabase migration list --db-url "postgresql://user:pass@host:5432/db"
```

## Repair Migration History

Manually updates the migration history table to mark migrations as applied or reverted.

```bash
# Mark a migration as applied
supabase migration repair 20240115120000 --status applied

# Mark a migration as reverted
supabase migration repair 20240115120000 --status reverted

# Repair multiple versions
supabase migration repair 20240115120000 20240116130000 --status applied

# Repair on linked project
supabase migration repair 20240115120000 --status applied --linked
```

## Squash Migrations

Combines multiple migration files into a single file to clean up migration history.

```bash
# Squash all migrations into the latest file
supabase migration squash

# Squash up to a specific version
supabase migration squash --version 20240115120000

# Squash on linked project
supabase migration squash --linked
```

## Create Edge Function

Creates a new Edge Function with boilerplate TypeScript code in the `supabase/functions` directory.

```bash
# Create a new function
supabase functions new hello-world
# Creates: supabase/functions/hello-world/index.ts
```

## Serve Edge Functions Locally

Runs all Edge Functions locally for development and testing with hot reload support.

```bash
# Serve all functions
supabase functions serve

# Serve with environment variables from file
supabase functions serve --env-file .env.local

# Serve without JWT verification
supabase functions serve --no-verify-jwt

# Serve with debugging enabled (Chrome DevTools)
supabase functions serve --inspect

# Serve with specific inspect mode
supabase functions serve --inspect-mode brk    # Break at first line
supabase functions serve --inspect-mode run    # Allow connection
supabase functions serve --inspect-mode wait   # Wait for connection

# Serve with custom import map
supabase functions serve --import-map ./import_map.json
```

## Deploy Edge Functions

Deploys Edge Functions to your linked Supabase project.

```bash
# Deploy all functions
supabase functions deploy

# Deploy a specific function
supabase functions deploy hello-world

# Deploy without JWT verification
supabase functions deploy hello-world --no-verify-jwt

# Deploy to specific project
supabase functions deploy --project-ref your-project-ref

# Deploy with custom import map
supabase functions deploy --import-map ./import_map.json

# Deploy using server-side bundling (faster)
supabase functions deploy --use-api

# Parallel deployment with multiple jobs
supabase functions deploy --use-api --jobs 4

# Delete functions not present locally
supabase functions deploy --prune
```

## List Edge Functions

Lists all Edge Functions deployed to your Supabase project.

```bash
# List all deployed functions
supabase functions list

# List functions for specific project
supabase functions list --project-ref your-project-ref
```

## Delete Edge Function

Removes an Edge Function from your Supabase project (does not delete local files).

```bash
# Delete a function from remote
supabase functions delete hello-world

# Delete from specific project
supabase functions delete hello-world --project-ref your-project-ref
```

## Download Edge Functions

Downloads Edge Function source code from your Supabase project.

```bash
# Download a specific function
supabase functions download hello-world

# Download all functions
supabase functions download

# Download from specific project
supabase functions download --project-ref your-project-ref
```

## Generate TypeScript Types

Generates TypeScript (or other language) type definitions from your database schema for use with supabase-js.

```bash
# Generate types from local database
supabase gen types --local > types/database.ts

# Generate types from linked project
supabase gen types --linked > types/database.ts

# Generate types from specific project
supabase gen types --project-id your-project-ref > types/database.ts

# Generate from specific database URL
supabase gen types --db-url "postgresql://user:pass@host:5432/db" > types/database.ts

# Generate for specific schemas
supabase gen types --local --schema public,auth > types/database.ts

# Generate Go types
supabase gen types --local --lang go > types/database.go

# Generate Swift types
supabase gen types --local --lang swift > Database.swift

# Generate Swift with public access control
supabase gen types --local --lang swift --swift-access-control public
```

## Generate JWT Signing Key

Generates a secure private JWT signing key for authentication.

```bash
# Generate ES256 key (recommended)
supabase gen signing-key

# Generate RS256 key
supabase gen signing-key --algorithm RS256

# Append to existing keys file
supabase gen signing-key --append
```

## Generate Bearer JWT Token

Creates a Bearer JWT token for accessing the Data API with specific roles and claims.

```bash
# Generate token for authenticated role
supabase gen bearer-jwt --role authenticated

# Generate token with specific user ID
supabase gen bearer-jwt --role authenticated --sub user-uuid-here

# Generate token with custom expiry
supabase gen bearer-jwt --role authenticated --valid-for 1h

# Generate token with specific expiration timestamp
supabase gen bearer-jwt --role authenticated --exp 2024-12-31T23:59:59Z

# Generate token with custom claims
supabase gen bearer-jwt --role authenticated --payload '{"custom_claim": "value"}'

# Generate anonymous token for anon role
supabase gen bearer-jwt --role anon
```

## Manage Projects

Create, list, and delete Supabase projects using the Management API.

```bash
# List all projects
supabase projects list

# Create a new project (interactive)
supabase projects create

# Create a project with all options
supabase projects create my-project \
  --org-id your-org-id \
  --db-password your-secure-password \
  --region us-east-1

# Create with specific instance size
supabase projects create my-project \
  --org-id your-org-id \
  --db-password your-secure-password \
  --region us-east-1 \
  --size small

# Get API keys for a project
supabase projects api-keys --project-ref your-project-ref

# Delete a project (interactive)
supabase projects delete

# Delete a specific project
supabase projects delete your-project-ref
```

## Manage Secrets

Set, list, and unset environment variables for Edge Functions.

```bash
# List all secrets
supabase secrets list

# Set a single secret
supabase secrets set MY_SECRET=secret_value

# Set multiple secrets
supabase secrets set API_KEY=key123 DB_URL=postgres://...

# Set secrets from .env file
supabase secrets set --env-file .env.production

# Unset a secret
supabase secrets unset MY_SECRET

# Unset multiple secrets
supabase secrets unset API_KEY DB_URL

# Manage secrets for specific project
supabase secrets list --project-ref your-project-ref
```

## Inspect Database

Tools for analyzing database performance, identifying issues, and monitoring resource usage.

```bash
# Show overall database statistics
supabase inspect db db-stats

# Show table sizes and row counts
supabase inspect db table-stats

# Show index statistics and usage
supabase inspect db index-stats

# Show replication slot information
supabase inspect db replication-slots

# Show current locks
supabase inspect db locks

# Show blocking queries
supabase inspect db blocking

# Show slow queries from pg_stat_statements
supabase inspect db outliers

# Show most frequently called queries
supabase inspect db calls

# Show queries running longer than 5 minutes
supabase inspect db long-running-queries

# Show table bloat estimates
supabase inspect db bloat

# Show vacuum statistics
supabase inspect db vacuum-stats

# Show role statistics
supabase inspect db role-stats

# Show read/write traffic profile
supabase inspect db traffic-profile

# Generate CSV report of all stats
supabase inspect report --output-dir ./reports

# Inspect local database
supabase inspect db table-stats --local

# Inspect specific database URL
supabase inspect db table-stats --db-url "postgresql://user:pass@host:5432/db"
```

## Run Database Tests

Execute pgTAP tests against your database to verify schema and function behavior.

```bash
# Run all tests in supabase/tests directory
supabase test db

# Run specific test files
supabase test db supabase/tests/my_test.sql

# Run tests against linked project
supabase test db --linked

# Run tests against specific database
supabase test db --db-url "postgresql://user:pass@host:5432/db"

# Create a new test file
supabase test new my_function_test
# Creates: supabase/tests/my_function_test.sql
```

## Global CLI Flags

Common flags available across most commands for controlling behavior and output.

```bash
# Enable debug logging
supabase --debug <command>

# Auto-confirm all prompts (for CI)
supabase --yes <command>

# Change working directory
supabase --workdir ./my-project <command>

# Use specific profile
supabase --profile production <command>

# Output format (pretty, json, toml, yaml, env)
supabase -o json <command>

# Use custom Docker network
supabase --network-id my-network <command>

# Enable experimental features
supabase --experimental <command>

# Create support ticket on error
supabase --create-ticket <command>
```

## Summary

The Supabase CLI streamlines the entire development lifecycle for Supabase projects. For local development, developers can initialize projects, start a complete local stack with all Supabase services, create and test Edge Functions, manage database migrations, and generate type definitions. The CLI integrates seamlessly with CI/CD pipelines through environment variables and non-interactive modes, making it ideal for automated deployments and testing.

For production workflows, the CLI provides powerful tools to manage hosted Supabase projects: link local projects to remote instances, push migrations safely with dry-run previews, pull schema changes from production, deploy Edge Functions, and manage secrets. The inspect commands offer deep visibility into database performance. Whether you're prototyping locally or managing production infrastructure, the Supabase CLI provides a consistent, scriptable interface for all Supabase operations.
