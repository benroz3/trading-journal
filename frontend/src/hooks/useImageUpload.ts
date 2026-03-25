import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as imagesApi from '../api/images.api';
import toast from 'react-hot-toast';

export function useUploadImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tradeId, files }: { tradeId: string; files: File[] }) =>
      imagesApi.upload(tradeId, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast.success('Images uploaded successfully');
    },
  });
}

export function useDeleteImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => imagesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast.success('Image deleted successfully');
    },
  });
}
