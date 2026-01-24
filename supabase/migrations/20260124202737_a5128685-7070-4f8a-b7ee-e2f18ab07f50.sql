-- Add bonus_scans column to profiles table for promotional offers
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bonus_scans integer DEFAULT 0;

-- Add a comment explaining the column
COMMENT ON COLUMN public.profiles.bonus_scans IS 'Bonus scans from promotions (decrements when used)';