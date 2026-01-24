-- =============================================
-- FAVORITE RECIPES
-- =============================================
CREATE TABLE public.favorite_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipe_name TEXT NOT NULL,
  recipe_image TEXT,
  calories INTEGER,
  protein TEXT,
  carbs TEXT,
  fat TEXT,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, recipe_name)
);

ALTER TABLE public.favorite_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
ON public.favorite_recipes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
ON public.favorite_recipes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
ON public.favorite_recipes FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- MEAL PLANNING
-- =============================================
CREATE TABLE public.meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_name TEXT NOT NULL,
  recipe_image TEXT,
  calories INTEGER,
  protein TEXT,
  carbs TEXT,
  fat TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_meal_plans_user_date ON public.meal_plans(user_id, plan_date);

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal plans"
ON public.meal_plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans"
ON public.meal_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
ON public.meal_plans FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
ON public.meal_plans FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- SOCIAL: FOLLOWERS/FOLLOWING
-- =============================================
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all follows"
ON public.user_follows FOR SELECT
USING (true);

CREATE POLICY "Users can follow others"
ON public.user_follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.user_follows FOR DELETE
USING (auth.uid() = follower_id);

-- =============================================
-- SOCIAL: SHARED MEALS (public meal posts)
-- =============================================
CREATE TABLE public.shared_meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE,
  caption TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_shared_meals_user ON public.shared_meals(user_id);
CREATE INDEX idx_shared_meals_created ON public.shared_meals(created_at DESC);

ALTER TABLE public.shared_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public shared meals"
ON public.shared_meals FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can share own meals"
ON public.shared_meals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shared meals"
ON public.shared_meals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shared meals"
ON public.shared_meals FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- SOCIAL: LIKES
-- =============================================
CREATE TABLE public.meal_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  shared_meal_id UUID NOT NULL REFERENCES public.shared_meals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, shared_meal_id)
);

ALTER TABLE public.meal_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
ON public.meal_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like"
ON public.meal_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike"
ON public.meal_likes FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- PUSH NOTIFICATION SUBSCRIPTIONS
-- =============================================
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
ON public.push_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
ON public.push_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
ON public.push_subscriptions FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- NOTIFICATION PREFERENCES
-- =============================================
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  meal_reminders BOOLEAN NOT NULL DEFAULT true,
  daily_summary BOOLEAN NOT NULL DEFAULT true,
  social_notifications BOOLEAN NOT NULL DEFAULT true,
  reminder_times JSONB DEFAULT '["08:00", "12:00", "19:00"]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
ON public.notification_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
ON public.notification_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON public.notification_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- =============================================
-- WEEKLY LEADERBOARD VIEW (for performance)
-- =============================================
CREATE OR REPLACE VIEW public.weekly_leaderboard AS
SELECT 
  p.user_id,
  p.name,
  p.avatar_url,
  COALESCE(SUM(m.calories), 0) as total_calories,
  COUNT(m.id) as meals_logged,
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