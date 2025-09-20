-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number TEXT NOT NULL UNIQUE,
  room_type TEXT NOT NULL CHECK (room_type IN ('AC', 'Non-AC')),
  status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Maintenance')),
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create guests table
CREATE TABLE public.guests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_proof TEXT NOT NULL,
  room_id UUID REFERENCES public.rooms(id),
  room_number TEXT,
  check_in DATE NOT NULL DEFAULT CURRENT_DATE,
  check_out DATE,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  pending_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_frequent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL DEFAULT 'General',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no authentication required)
CREATE POLICY "Allow all operations on rooms" ON public.rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on guests" ON public.guests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_guests_updated_at
  BEFORE UPDATE ON public.guests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update room status when guest is assigned/removed
CREATE OR REPLACE FUNCTION public.update_room_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT (guest assigned to room)
  IF TG_OP = 'INSERT' AND NEW.room_id IS NOT NULL THEN
    UPDATE public.rooms 
    SET status = 'Occupied' 
    WHERE id = NEW.room_id;
  END IF;
  
  -- Handle UPDATE (room assignment changed)
  IF TG_OP = 'UPDATE' THEN
    -- If room was removed or changed, make old room available
    IF OLD.room_id IS NOT NULL AND (NEW.room_id IS NULL OR NEW.room_id != OLD.room_id) THEN
      UPDATE public.rooms 
      SET status = 'Available' 
      WHERE id = OLD.room_id AND status = 'Occupied';
    END IF;
    
    -- If new room assigned, make it occupied
    IF NEW.room_id IS NOT NULL AND NEW.room_id != COALESCE(OLD.room_id, gen_random_uuid()) THEN
      UPDATE public.rooms 
      SET status = 'Occupied' 
      WHERE id = NEW.room_id;
    END IF;
  END IF;
  
  -- Handle DELETE (guest removed)
  IF TG_OP = 'DELETE' AND OLD.room_id IS NOT NULL THEN
    UPDATE public.rooms 
    SET status = 'Available' 
    WHERE id = OLD.room_id AND status = 'Occupied';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for room status updates
CREATE TRIGGER update_room_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.guests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_room_status();