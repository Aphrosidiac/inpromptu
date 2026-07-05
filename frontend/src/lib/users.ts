import { api } from "./api";

export type UserStats = {
  racesJoined: number;
  racesFinished: number;
  wins: number;
  bestElapsedMs: number | null;
  bestSpeedKmh: number | null;
  totalDistanceKm: number;
};

export const usersApi = {
  stats: () => api.get<UserStats>("/users/me/stats"),
};
