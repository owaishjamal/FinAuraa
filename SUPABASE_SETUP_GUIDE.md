# Supabase Setup - Quick Fix Guide

## Issue: Profile Table Empty & Login Invalid

If you're experiencing:
- ✅ Account created successfully
- ❌ Login says "invalid"
- ❌ Profile table is empty

## Quick Fix Steps

### Step 1: Enable Auto-Confirm (Recommended for Development)

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers** > **Email**
3. Find **"Confirm email"** setting
4. **Disable** "Confirm email" (turn it OFF)
5. Click **Save**

This allows users to sign in immediately without email confirmation.

### Step 2: Verify Database Trigger Exists

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this query to check if the trigger exists:

```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

If you see no results, the trigger is missing. Run this to create it:

```sql
-- Recreate the trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Step 3: Manually Create Profiles for Existing Users

If you already have users but no profiles:

```sql
-- Insert profiles for all existing users who don't have one
INSERT INTO profiles (id, email, full_name)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;
```

### Step 4: Test

1. Try signing up a new account
2. Check the profiles table - it should have an entry
3. Try signing in immediately (if auto-confirm is disabled)

## Alternative: Use Environment Variable for Auto-Confirm

In Supabase Dashboard:
- Go to **Project Settings** > **Auth**
- Set **"Enable email confirmations"** to **OFF**

## Troubleshooting

### If profile still doesn't create:

Check RLS policies:
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Check policies exist
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### If login still says invalid:

1. Check if email confirmation is required:
   - Supabase Dashboard > Authentication > Providers > Email
   - Disable "Confirm email"

2. Reset password if needed:
   - Use "Forgot password" in the app
   - Or manually reset in Supabase Dashboard > Authentication > Users

