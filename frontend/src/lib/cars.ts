import { api } from "./api";
import type { Car, CarInput } from "../types/car";

export const carsApi = {
  list: () => api.get<Car[]>("/cars"),
  create: (input: CarInput) => api.post<Car>("/cars", input),
  update: (carId: string, input: Partial<CarInput>) => api.patch<Car>(`/cars/${carId}`, input),
  remove: (carId: string) => api.delete(`/cars/${carId}`),
  activate: (carId: string) => api.post(`/cars/${carId}/activate`),
};
