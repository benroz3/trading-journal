import client from './client';
import type { Strategy } from '../types';

export async function getAll(): Promise<Strategy[]> {
  const { data } = await client.get<Strategy[]>('/strategies');
  return data;
}

export async function create(strategyData: { name: string; description?: string; color?: string }): Promise<Strategy> {
  const { data } = await client.post<Strategy>('/strategies', strategyData);
  return data;
}

export async function update(
  id: string,
  strategyData: { name?: string; description?: string; color?: string }
): Promise<Strategy> {
  const { data } = await client.put<Strategy>(`/strategies/${id}`, strategyData);
  return data;
}

export async function remove(id: string): Promise<void> {
  await client.delete(`/strategies/${id}`);
}
