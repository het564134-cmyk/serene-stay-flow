import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface Guest {
  id: string;
  name: string;
  phone: string;
  id_proof: string;
  room_id?: string;
  room_number?: string;
  check_in: string;
  check_out?: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  is_frequent: boolean;
  payment_mode?: string;
  pay_to_whom?: string;
  created_at: string;
  updated_at: string;
}

export const useGuests = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Subscribe to realtime changes for guests
  useEffect(() => {
    const channel = supabase
      .channel('guests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guests'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['guests'] });
          queryClient.invalidateQueries({ queryKey: ['rooms'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Call the function to update expired checkouts when component mounts
  useEffect(() => {
    const updateExpiredCheckouts = async () => {
      try {
        const { error } = await supabase.rpc('update_expired_checkouts');
        if (error) {
          console.error('Error updating expired checkouts:', error);
        } else {
          // Refresh data after updating
          queryClient.invalidateQueries({ queryKey: ['guests'] });
          queryClient.invalidateQueries({ queryKey: ['rooms'] });
        }
      } catch (error) {
        console.error('Error calling update_expired_checkouts:', error);
      }
    };

    updateExpiredCheckouts();
  }, [queryClient]);

  const guestsQuery = useQuery({
    queryKey: ['guests'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('guests')
          .select(`
            *,
            rooms (
              room_number,
              room_type
            )
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Supabase error:', error);
          throw new Error(`Database error: ${error.message}`);
        }
        return data as Guest[];
      } catch (error: any) {
        console.error('Query error:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const addGuest = useMutation({
    mutationFn: async (guest: Omit<Guest, 'id' | 'created_at' | 'updated_at' | 'is_frequent'>) => {
      const { data, error } = await supabase
        .from('guests')
        .insert([{ ...guest, is_frequent: false }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({
        title: "Success",
        description: "Guest added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add guest",
        variant: "destructive",
      });
    },
  });

  const updateGuest = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Guest> & { id: string }) => {
      const { data, error } = await supabase
        .from('guests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({
        title: "Success",
        description: "Guest updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update guest",
        variant: "destructive",
      });
    },
  });

  const deleteGuest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({
        title: "Success",
        description: "Guest deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete guest",
        variant: "destructive",
      });
    },
  });

  const searchGuests = (query: string) => {
    if (!query || !guestsQuery.data) return guestsQuery.data || [];
    
    const searchTerm = query.toLowerCase();
    return guestsQuery.data.filter(
      guest =>
        guest.name.toLowerCase().includes(searchTerm) ||
        guest.phone.includes(searchTerm) ||
        guest.id_proof.toLowerCase().includes(searchTerm) ||
        guest.room_number?.includes(searchTerm)
    );
  };

  const pendingGuests = guestsQuery.data?.filter(guest => guest.pending_amount > 0) || [];

  return {
    guests: guestsQuery.data || [],
    pendingGuests,
    isLoading: guestsQuery.isLoading,
    error: guestsQuery.error,
    addGuest,
    updateGuest,
    deleteGuest,
    searchGuests,
  };
};