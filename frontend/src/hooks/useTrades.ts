import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as tradesApi from '../api/trades.api';
import type { TradeFilters, TradeFormData } from '../types';
import toast from 'react-hot-toast';

export function useTrades(filters?: TradeFilters) {
  return useQuery({
    queryKey: ['trades', filters],
    queryFn: () => tradesApi.getAll(filters),
  });
}

export function useTrade(id: string | undefined) {
  return useQuery({
    queryKey: ['trades', id],
    queryFn: () => tradesApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateTrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TradeFormData) => tradesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Trade created successfully');
    },
  });
}

export function useUpdateTrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TradeFormData> }) =>
      tradesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Trade updated successfully');
    },
  });
}

export function useDeleteTrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tradesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Trade deleted successfully');
    },
  });
}
