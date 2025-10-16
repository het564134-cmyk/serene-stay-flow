import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface Room {
  id: string;
  room_number: string;
  room_type: 'AC' | 'Non-AC';
  status: 'Available' | 'Occupied' | 'Maintenance';
  price: number;
  created_at: string;
  updated_at: string;
}

export const useRooms = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Subscribe to realtime changes for rooms
  useEffect(() => {
    const channel = supabase
      .channel('rooms-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['rooms'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const roomsQuery = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*');
        
        if (error) {
          console.error('Supabase error:', error);
          throw new Error(`Database error: ${error.message}`);
        }
        
        // Sort rooms numerically by room_number
        const sortedData = (data as Room[]).sort((a, b) => {
          const numA = parseInt(a.room_number);
          const numB = parseInt(b.room_number);
          return numA - numB;
        });
        
        return sortedData;
      } catch (error: any) {
        console.error('Query error:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const addRoom = useMutation({
    mutationFn: async (room: Omit<Room, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('rooms')
        .insert([room])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({
        title: "Success",
        description: "Room added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add room",
        variant: "destructive",
      });
    },
  });

  const updateRoom = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Room> & { id: string }) => {
      const { data, error } = await supabase
        .from('rooms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({
        title: "Success",
        description: "Room updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update room",
        variant: "destructive",
      });
    },
  });

  const deleteRoom = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({
        title: "Success",
        description: "Room deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete room",
        variant: "destructive",
      });
    },
  });

  const availableRooms = roomsQuery.data?.filter(room => room.status === 'Available') || [];

  return {
    rooms: roomsQuery.data || [],
    availableRooms,
    isLoading: roomsQuery.isLoading,
    error: roomsQuery.error,
    addRoom,
    updateRoom,
    deleteRoom,
  };
};