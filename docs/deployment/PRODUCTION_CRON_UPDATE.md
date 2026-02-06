# Production Cron Job Update

## ⚠️ Before Going to Production

The cron jobs in `vercel.json` are currently set to **daily** schedules for testing on Vercel Hobby plan. 

**For production, you need to either:**

### Option 1: Upgrade to Vercel Pro
Upgrade to Vercel Pro to enable hourly cron jobs, then update `vercel.json`:

```json
{
  "path": "/api/cron/expire-unpaid",
  "schedule": "0 * * * *"  // Change from "0 3 * * *" to hourly
},
{
  "path": "/api/cron/expire-pending",
  "schedule": "0 * * * *"  // Change from "0 4 * * *" to hourly
},
{
  "path": "/api/cron/expire-reservations",
  "schedule": "0 * * * *"  // Change from "0 5 * * *" to hourly
}
```

### Option 2: Use External Cron Services
Keep daily schedules in `vercel.json` and set up external cron services for hourly execution:

- [cron-job.org](https://cron-job.org) (free)
- [EasyCron](https://www.easycron.com)
- [Cronitor](https://cronitor.io)

**Configuration:**
- URL: `https://your-domain.com/api/cron/[job-name]`
- Method: POST
- Schedule: `0 * * * *` (hourly)
- Headers: `Authorization: Bearer <CRON_SECRET>` (if set)

## Current Testing Schedule (Daily)

- **Auto-complete**: 2 AM daily
- **Completion Check**: 9 AM daily
- **Expire Unpaid**: 3 AM daily ⚠️ (should be hourly in production)
- **Expire Pending**: 4 AM daily ⚠️ (should be hourly in production)
- **Expire Reservations**: 5 AM daily ⚠️ (should be hourly in production)

## Production Schedule (Recommended)

- **Auto-complete**: 2 AM daily ✅
- **Completion Check**: 9 AM daily ✅
- **Expire Unpaid**: Every hour ⚠️ (requires Pro or external service)
- **Expire Pending**: Every hour ⚠️ (requires Pro or external service)
- **Expire Reservations**: Every hour ⚠️ (requires Pro or external service)
