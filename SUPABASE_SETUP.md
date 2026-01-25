# Supabase Setup Guide

This guide will help you connect your Traverum project to Supabase.

## Prerequisites

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **Supabase CLI** - Will be installed via npm

## Step 1: Install Dependencies

```bash
npm install
```

This will install:
- Supabase JS client
- TypeScript
- Supabase Functions JS

## Step 2: Install Supabase CLI (Optional for now)

**You can start working with Supabase without the CLI** by using the web dashboard. However, the CLI is useful for local development and deploying Edge Functions.

### Option A: Install via Scoop (Recommended for Windows)

1. First install Scoop (if not already installed):
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   irm get.scoop.sh | iex
   ```

2. Install Supabase CLI:
   ```powershell
   scoop install supabase
   ```

### Option B: Direct Download

Download the Windows binary from the [Supabase CLI releases page](https://github.com/supabase/cli/releases) and add it to your PATH.

### Option C: Use npx (No installation needed)

You can use the CLI via npx without installing:

```bash
npx supabase@latest --version
npx supabase@latest link --project-ref YOUR_PROJECT_REF
```

**Note**: For now, you can skip CLI installation and connect using the dashboard method below.

## Step 3: Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in your project details:
   - **Name**: Traverum (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users (Europe recommended)
5. Wait for the project to be created (usually 2-3 minutes)

## Step 4: Link Your Local Project to Supabase

Once your Supabase project is ready:

1. **Get your Project Reference ID:**
   - Go to your Supabase project dashboard
   - Click on "Project Settings" (gear icon)
   - Copy the "Reference ID" (it looks like: `abcdefghijklmnop`)

2. **Link the project:**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   
   When prompted:
   - Enter your database password (the one you created in Step 3)
   - The CLI will download your project configuration

## Step 5: Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   copy env.example .env
   ```

2. Get your Supabase credentials:
   - Go to Project Settings > API in your Supabase dashboard
   - Copy the following values:

3. Update `.env` with your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
   SUPABASE_PROJECT_REF=YOUR_PROJECT_REF
   ```

## Step 6: Verify Connection

Test that everything is connected:

```bash
# Start local Supabase (optional, for local development)
supabase start

# Check connection status
supabase status
```

## Step 7: Set Up Edge Functions (Optional - for local development)

If you want to develop Edge Functions locally:

```bash
# Start local Supabase instance
supabase start

# This will start:
# - API: http://localhost:54321
# - Studio: http://localhost:54323
# - Inbucket (email testing): http://localhost:54324
```

## Alternative: Quick Setup WITHOUT CLI (Easiest for getting started)

**You don't need the CLI to connect to Supabase!** Here's the simplest way:

1. **Create your Supabase project** (if you haven't already):
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Create a new project

2. **Get your credentials**:
   - Go to Project Settings > API in your Supabase dashboard
   - Copy the following:
     - Project URL (looks like `https://xxxxx.supabase.co`)
     - `anon` `public` key
     - `service_role` `secret` key (keep this secret!)

3. **Create your `.env` file**:
   ```powershell
   copy env.example .env
   ```
   Then edit `.env` and paste your credentials.

4. **Start using Supabase!** You can now use the Supabase JS client in your code.

The CLI is only needed if you want to:
- Run Supabase locally for development
- Deploy Edge Functions via command line
- Use database migrations locally

You can manage everything else through the Supabase dashboard.

## Next Steps

After connecting:
- [ ] Set up your database schema (tables for reservations, bookings, etc.)
- [ ] Configure Row Level Security (RLS) policies
- [ ] Create Edge Functions for booking flow
- [ ] Set up Stripe webhooks

## Troubleshooting

### npm/node not found
- **Refresh your PowerShell session** or restart your terminal
- Node.js was likely installed but PATH wasn't refreshed
- Try: Close and reopen PowerShell, or run: `refreshenv` (if you have Chocolatey)

### CLI not found
- **You don't need the CLI to start!** Use the dashboard method above
- If you want the CLI, install via Scoop: `scoop install supabase`
- Or use npx: `npx supabase@latest [command]` (no installation needed)

### Connection errors
- Verify your project reference ID is correct
- Check that your database password is correct
- Ensure you have internet connection

### Environment variables not loading
- Make sure `.env` file is in the project root
- Verify file name is exactly `.env` (not `.env.txt`)
- Restart your development server after changing `.env`

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
