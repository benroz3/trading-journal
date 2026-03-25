import client from './client';
import type { TradeImage } from '../types';

export async function upload(tradeId: string, files: File[]): Promise<TradeImage[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  const { data } = await client.post<TradeImage[]>(`/trades/${tradeId}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
}

export async function remove(id: string): Promise<void> {
  await client.delete(`/images/${id}`);
}
