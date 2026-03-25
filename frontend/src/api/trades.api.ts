import client from './client';
import type { Trade, TradeFormData, TradeFilters, PaginatedResponse } from '../types';

export async function getAll(filters?: TradeFilters): Promise<PaginatedResponse<Trade>> {
  const params = filters ? { ...filters } : {};
  const { data } = await client.get<PaginatedResponse<Trade>>('/trades', { params });
  return data;
}

export async function getById(id: string): Promise<Trade> {
  const { data } = await client.get<Trade>(`/trades/${id}`);
  return data;
}

export async function create(tradeData: TradeFormData): Promise<Trade> {
  const { data } = await client.post<Trade>('/trades', tradeData);
  return data;
}

export async function update(id: string, tradeData: Partial<TradeFormData>): Promise<Trade> {
  const { data } = await client.put<Trade>(`/trades/${id}`, tradeData);
  return data;
}

export async function remove(id: string): Promise<void> {
  await client.delete(`/trades/${id}`);
}
