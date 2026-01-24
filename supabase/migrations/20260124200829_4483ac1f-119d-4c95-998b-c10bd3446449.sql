-- Fix weekly_leaderboard view to use security_invoker for proper RLS
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
GROUP BY p.user_id, p.name, p.avatar_url, p.calorie_goal
ORDER BY goal_percentage DESC;