# Onboarding & Smart Profiles Setup

## Database Migration

Apply the NGOs migration via Supabase:

1. **Supabase Dashboard**: Project → SQL Editor → paste and run `supabase/migrations/20250227000000_create_ngos.sql`

Or with Supabase CLI:

```bash
supabase db push
```

## AI Profile Summary (Edge Function)

The AI summary feature uses a Supabase Edge Function that calls OpenAI.

### 1. Deploy the Edge Function

```bash
# From project root
supabase functions deploy generate-profile-summary
```

### 2. Set the API Key

```bash
supabase secrets set OPENAI_API_KEY=your-openai-api-key
```

Or via Supabase Dashboard: Project → Edge Functions → `generate-profile-summary` → Settings → Secrets.

### 3. Optional: Local Development

```bash
# Create supabase/.env.local with:
OPENAI_API_KEY=your-openai-api-key

# Serve locally
supabase functions serve generate-profile-summary --env-file supabase/.env.local
```

## Routes

| Path | Description |
|------|-------------|
| `/ngos/new` | Create NGO profile (authenticated) |
| `/ngos/:id` | View NGO details (authenticated) |

## Features

- **NGO profile creation**: Mission, causes, needs, region
- **Multi-select tags**: Causes and needs with quick-select options and custom input
- **AI profile summary**: Volunteer profile summary via Edge Function (GPT-3.5-turbo)
