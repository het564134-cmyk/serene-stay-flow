-- Create a function to automatically update room status based on checkout dates
CREATE OR REPLACE FUNCTION public.update_expired_checkouts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update rooms to Available if guest's checkout date has passed and room is still occupied
  UPDATE public.rooms r
  SET status = 'Available'
  WHERE r.status = 'Occupied'
  AND EXISTS (
    SELECT 1 FROM public.guests g
    WHERE g.room_id = r.id
    AND g.check_out IS NOT NULL
    AND g.check_out < CURRENT_DATE
  );
  
  -- Clear room assignments for guests whose checkout date has passed
  UPDATE public.guests
  SET room_id = NULL, room_number = NULL
  WHERE check_out IS NOT NULL
  AND check_out < CURRENT_DATE
  AND room_id IS NOT NULL;
END;
$$;