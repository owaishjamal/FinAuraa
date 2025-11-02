# FinAura Setup Guide

## Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Fill in project details (name, database password, region)
4. Wait for project to be created (~2 minutes)

### Step 3: Run Database Migration

1. In Supabase Dashboard, go to SQL Editor
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and click "Run"
5. You should see "Success. No rows returned"

### Step 4: Get API Keys

1. In Supabase Dashboard, go to Settings > API
2. Copy:
   - Project URL (starts with `https://`)
   - `anon` `public` key (long string)

### Step 5: Configure App

**Option A: Environment Variables (Recommended)**
Create `.env` file in project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Option B: Meta Tags**
Add to your `index.html`:
```html
<meta name="supabase-url" content="https://your-project.supabase.co" />
<meta name="supabase-anon-key" content="your-anon-key-here" />
```

**Option C: Global Variables**
In your HTML before React loads:
```javascript
window.SUPABASE_URL = "https://your-project.supabase.co";
window.SUPABASE_ANON_KEY = "your-anon-key-here";
```

### Step 6: Run the App

```bash
npm run dev
```

Visit `http://localhost:5173`

### Step 7: Test Authentication

1. Click "Sign In" in the header
2. Click "Sign up" tab
3. Create an account with email/password
4. Check your email for verification (or use auto-confirm in Supabase settings)

## Verification Checklist

- ✅ App loads without errors
- ✅ Can sign up with email/password
- ✅ Can sign in after signup
- ✅ NFI computation works
- ✅ Data saves to Supabase (check Supabase Dashboard > Table Editor)
- ✅ Can see user profile in header dropdown

## Troubleshooting

### "Supabase not configured" warning
- Check your environment variables are set correctly
- Restart the dev server after changing `.env`

### Authentication not working
- Ensure email confirmation is set up in Supabase Auth settings
- Check Supabase Dashboard > Authentication > Providers > Email

### Database errors
- Make sure migration ran successfully
- Check Supabase Dashboard > Table Editor to see if tables exist
- Verify RLS policies are enabled

### Build errors
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then `npm install`
- Check Node.js version is 18+

## Database Schema Overview

The migration creates:
- `profiles` - User profiles with financial state
- `nfi_history` - All NFI computations
- `transactions` - CSV imported transactions
- `nudges` - Personalized recommendations
- `nudge_feedback` - User feedback on nudges
- `goals` - User financial goals
- `achievements` - Unlocked badges
- `analytics_summary` - Pre-computed analytics

All tables have Row Level Security (RLS) enabled.

## Next Steps

- Customize themes in `src/constants/palette.js`
- Add AI integration points marked with comments
- Enhance mathematical models in `src/utils/nfi.js`
- Add more features using the Supabase service layer

