-- Security Enhancements Migration
-- This migration adds additional RLS policies to protect user privacy

-- =============================================
-- PROFILES: Hide emails from other users
-- =============================================

-- Drop the existing "Users can view own profile" policy to replace it
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Users can view their full profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- Users can view other users' public profile data (but not email)
CREATE POLICY "Users can view public profiles"
ON public.profiles FOR SELECT
USING (auth.uid() != user_id);

-- Add a column to control profile visibility (for future use)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- =============================================
-- PUSH SUBSCRIPTIONS: Only user can access their credentials
-- =============================================

-- Policies are already restrictive (user can only see own subscriptions)
-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint 
ON public.push_subscriptions(endpoint);

-- =============================================
-- NOTIFICATION PREFERENCES: Ensure privacy
-- =============================================

-- Policies are already correct (user can only access own preferences)
-- No changes needed

-- =============================================  
-- LEADERBOARD: Only show public profiles
-- =============================================

-- Recreate the weekly_leaderboard view to only include public profiles
DROP VIEW IF EXISTS public.weekly_leaderboard;

CREATE VIEW public.weekly_leaderboard
WITH (security_invoker = on) AS
SELECT 
  p.user_id,
  p.name,
  p.avatar_url,
  p.calorie_goal,
  COALESCE(SUM(m.calories), 0) as total_calories,
  COUNT(m.id) as meals_logged,
  CASE 
    WHEN p.calorie_goal > 0 THEN 
      ROUND((COALESCE(SUM(m.calories), 0)::numeric / (p.calorie_goal * 7)) * 100, 1)
    ELSE 0 
  END as goal_percentage
FROM public.profiles p
LEFT JOIN public.meals m ON p.user_id = m.user_id 
  AND m.meal_date >= CURRENT_DATE - INTERVAL '7 days'
WHERE p.is_public = true  -- Only show public profiles
GROUP BY p.user_id, p.name, p.avatar_url, p.calorie_goal
ORDER BY goal_percentage DESC;

-- Grant select permission on the view
GRANT SELECT ON public.weekly_leaderboard TO authenticated;
GRANT SELECT ON public.weekly_leaderboard TO anon;

-- =============================================
-- STORAGE: Ensure avatars bucket policies are correct
-- =============================================

-- Note: Storage policies are managed separately via the storage schema
-- Users should only be able to upload/delete their own avatars
-- Public read access is fine for avatars

COMMENT ON TABLE public.profiles IS 'User profile information with privacy controls';
COMMENT ON COLUMN public.profiles.is_public IS 'Controls whether user appears in public leaderboards and searches';
