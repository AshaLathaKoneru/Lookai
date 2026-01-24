-- Drop the security definer view and replace with a security invoker view
DROP VIEW IF EXISTS public.weekly_leaderboard;

-- Create the view with SECURITY INVOKER (default, safe)
CREATE VIEW public.weekly_leaderboard 
WITH (security_invoker = true)
AS
SELECT 
  p.user_id,
  p.name,
  p.avatar_url,
  COALESCE(SUM(m.calories), 0)::bigint as total_calories,
  COUNT(m.id)::bigint as meals_logged,
  p.calorie_goal,
  CASE 
    WHEN p.calorie_goal > 0 THEN 
      ROUND((COALESCE(SUM(m.calories), 0)::numeric / (p.calorie_goal * 7)) * 100, 1)
    ELSE 0 
  END as goal_percentage
FROM public.profiles p
LEFT JOIN public.meals m ON p.user_id = m.user_id 
  AND m.meal_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY p.user_id, p.name, p.avatar_url, p.calorie_goal
ORDER BY meals_logged DESC, total_calories DESC;