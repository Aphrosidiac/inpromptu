import { api } from "./api";
import type { Car } from "../types/car";

export type UserStats = {
  racesJoined: number;
  racesFinished: number;
  wins: number;
  bestElapsedMs: number | null;
  bestSpeedKmh: number | null;
  totalDistanceKm: number;
};

export type PublicProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  stats: UserStats;
  cars: Car[];
};

export const usersApi = {
  stats: () => api.get<UserStats>("/users/me/stats"),
  profile: (userId: string) => api.get<PublicProfile>(`/users/${userId}/profile`),
};
