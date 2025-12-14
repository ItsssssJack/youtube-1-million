# Database Migrations

This folder contains SQL migration files for the Growth Intelligence Dashboard database schema.

## Tables Created

1. **tracked_channels** - Competitor channels being monitored
2. **video_snapshots** - Historical performance data for trend analysis
3. **outliers** - Detected outlier videos flagged for review

## How to Run Migrations

### Option 1: Supabase SQL Editor (Recommended for initial setup)

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Navigate to your project
3. Click on "SQL Editor" in the left sidebar
4. Copy and paste the contents of `000_run_all_migrations.sql`
5. Click "Run" to execute all migrations at once

**OR** run each migration individually in order:
1. `001_create_tracked_channels.sql`
2. `002_create_video_snapshots.sql`
3. `003_create_outliers.sql`

### Option 2: Supabase CLI (For automated deployments)

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Initialize Supabase in your project (if not already done)
supabase init

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Option 3: Programmatic execution (Advanced)

You can also execute these migrations programmatically using the Supabase client:

```typescript
import { supabase } from './services/supabaseClient';
import fs from 'fs';

const runMigration = async (filePath: string) => {
  const sql = fs.readFileSync(filePath, 'utf-8');
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) console.error('Migration failed:', error);
};
```

## Schema Overview

### tracked_channels
- Stores competitor channels to monitor
- Tracks scraping frequency and priority
- Maintains average views and metadata

### video_snapshots
- Historical performance snapshots
- Enables velocity and trend calculations
- Stores view counts at multiple points in time

### outliers
- Flagged videos that significantly outperform averages
- Includes user status (new, viewed, dismissed)
- Quick access table for dashboard display

## Notes

- All tables include created_at/updated_at timestamps
- Indexes are optimized for common query patterns
- Row Level Security (RLS) policies are commented out but available
- UUID primary keys for distributed scaling
