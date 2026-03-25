import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as strategiesApi from '../api/strategies.api';
import toast from 'react-hot-toast';

export function useStrategies() {
  return useQuery({
    queryKey: ['strategies'],
    queryFn: strategiesApi.getAll,
  });
}

export function useCreateStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description?: string; color?: string }) =>
      strategiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Strategy created successfully');
    },
  });
}

export function useUpdateStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; color?: string } }) =>
      strategiesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      toast.success('Strategy updated successfully');
    },
  });
}

export function useDeleteStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => strategiesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Strategy deleted successfully');
    },
  });
}
