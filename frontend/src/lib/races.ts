import { api } from "./api";
import type { Race, RaceResult } from "../types/race";

export type CreateRandomRouteInput = {
  mode: "RANDOM_ROUTE";
  name: string;
  distanceMeters: number;
  originLat: number;
  originLng: number;
  timeoutSeconds?: number;
};

export type CreatePinDropInput = {
  mode: "PIN_DROP";
  name: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  timeoutSeconds?: number;
};

export type RacePreview = {
  id: string;
  name: string;
  mode: "RANDOM_ROUTE" | "PIN_DROP";
  status: string;
  distanceMeters: number;
  hostName: string;
  participantCount: number;
};

export const racesApi = {
  create: (input: CreateRandomRouteInput | CreatePinDropInput) => api.post<Race>("/races", input),
  list: () => api.get<Race[]>("/races"),
  history: () => api.get<{ race: Race; result: RaceResult | null }[]>("/races/history"),
  get: (raceId: string) => api.get<Race>(`/races/${raceId}`),
  preview: (raceId: string) => api.get<RacePreview>(`/races/${raceId}/preview`),
  join: (raceId: string) => api.post(`/races/${raceId}/join`),
  start: (raceId: string) => api.post(`/races/${raceId}/start`),
  results: (raceId: string) => api.get<RaceResult[]>(`/races/${raceId}/results`),
};
