-- Create recipe cache table for 24h caching
CREATE TABLE public.recipe_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  search_query TEXT NOT NULL,
  query_hash TEXT NOT NULL UNIQUE,
  recipes JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Index for faster lookups by hash
CREATE INDEX idx_recipe_cache_query_hash ON public.recipe_cache(query_hash);

-- Index for cleanup of expired entries
CREATE INDEX idx_recipe_cache_expires_at ON public.recipe_cache(expires_at);

-- Enable RLS
ALTER TABLE public.recipe_cache ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read from cache (public recipes)
CREATE POLICY "Anyone can read recipe cache"
ON public.recipe_cache
FOR SELECT
USING (expires_at > now());

-- Only service role can insert/update/delete
-- This is fine since edge functions use service role