export type Car = {
  id: string;
  userId: string;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  photoUrl: string | null;
  engineType: string | null;
  drivetrain: string | null;
  horsepowerHp: number | null;
  torqueNm: number | null;
  weightKg: number | null;
  topSpeedKmh: number | null;
  zeroToHundredSec: number | null;
  isActive: boolean;
  createdAt: string;
};

export type CarInput = {
  name: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  photoUrl?: string;
  engineType?: string;
  drivetrain?: string;
  horsepowerHp?: number;
  torqueNm?: number;
  weightKg?: number;
  topSpeedKmh?: number;
  zeroToHundredSec?: number;
};
