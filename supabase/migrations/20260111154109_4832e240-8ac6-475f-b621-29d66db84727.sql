-- Fix security issues: Remove overly permissive RLS policy on settings table
-- and add proper access restrictions

-- Step 1: Drop the overly permissive policy on settings
DROP POLICY IF EXISTS "Allow all operations on settings" ON public.settings;

-- Step 2: Create restrictive RLS policy - no direct access to settings table
-- Settings should only be accessed via secure edge functions
CREATE POLICY "Settings only accessible via service role"
ON public.settings
FOR ALL
USING (false)
WITH CHECK (false);

-- Note: The settings table will only be accessible via edge functions using the service role key
-- This prevents any direct client access to admin passwords