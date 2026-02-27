import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  created_at: string;
}

export const useExpenses = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const expensesQuery = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as Expense[];
    },
    retry: 2,
    retryDelay: 1000,
  });

  const addExpense = useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: "Success",
        description: "Expense added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add expense",
        variant: "destructive",
      });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete expense",
        variant: "destructive",
      });
    },
  });

  return {
    expenses: expensesQuery.data || [],
    isLoading: expensesQuery.isLoading,
    error: expensesQuery.error,
    refetch: expensesQuery.refetch,
    addExpense,
    deleteExpense,
  };
};