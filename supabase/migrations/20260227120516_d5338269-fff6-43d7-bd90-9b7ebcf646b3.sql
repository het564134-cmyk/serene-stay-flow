
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow all operations on rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow all operations on guests" ON public.guests;
DROP POLICY IF EXISTS "Allow all operations on expenses" ON public.expenses;

-- Recreate as permissive policies
CREATE POLICY "Allow all operations on rooms"
ON public.rooms FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on guests"
ON public.guests FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on expenses"
ON public.expenses FOR ALL
USING (true)
WITH CHECK (true);
