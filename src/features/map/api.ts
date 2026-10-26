import { apiClient } from '@/lib/api-client';

import type { CreateMapPinRequest, MapFocus, MapPin, UpdateMapPinRequest } from './types';

const pinsBase = (contextId: string) => `/historical-contexts/${contextId}/map-pins`;

export const mapApi = {
  // Ghim ADMIN của trận + ghi chú USER của chính người gọi, theo năm của bối cảnh
  getPins: async (contextId: string, year: number) =>
    (await apiClient<MapPin[] | null>(`${pinsBase(contextId)}?year=${year}`)) ?? [],

  createPin: (contextId: string, payload: CreateMapPinRequest) =>
    apiClient<MapPin>(pinsBase(contextId), { method: 'POST', body: JSON.stringify(payload) }),

  updatePin: (contextId: string, pinId: string, payload: UpdateMapPinRequest) =>
    apiClient<MapPin>(`${pinsBase(contextId)}/${pinId}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deletePin: (contextId: string, pinId: string) =>
    apiClient<null>(`${pinsBase(contextId)}/${pinId}`, { method: 'DELETE' }),

  getFocuses: async (contextId: string) =>
    (await apiClient<MapFocus[] | null>(`/historical-contexts/${contextId}/map-focuses`)) ?? [],
};
