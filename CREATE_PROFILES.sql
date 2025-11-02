-- Manually create profiles for existing users who don't have one
-- Run this in Supabase SQL Editor if profiles table is empty

-- Check existing users without profiles
SELECT 
  u.id,
  u.email,
  CASE WHEN p.id IS NULL THEN 'No profile' ELSE 'Has profile' END as profile_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- Create profiles for all users who don't have one
INSERT INTO profiles (id, email, full_name)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', NULL) as full_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verify profiles were created
SELECT COUNT(*) as total_users FROM auth.users;
SELECT COUNT(*) as total_profiles FROM profiles;

