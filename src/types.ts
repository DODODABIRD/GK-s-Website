/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface Village {
  id: string;
  name: string;
  region: string;
  coordinates: LocationCoordinates;
  population: number;
  consumptionPerCapitaKgPerDay: number; // Daily rice consumption in kg
  aggregateProductionKgPerDay: number; // Current local harvest rate
  currentPricePerKgIdr: number; // Current daily rice price in IDR
  priceHistory15Days: number[]; // 15-day historic prices
  posDailyDemandKg: number; // True village POS demand
  dcInventoryReservedKg: number; // Allocated reserves from closest DC
  is3T: boolean;
}

export interface DistributionCenter {
  id: string;
  name: string;
  region: string;
  coordinates: LocationCoordinates;
  riceInventoryKg: number;
  capacityKg: number;
  assignedVillages: string[]; // Connected village IDs
  operator: "BULOG" | "BAPANAS" | "Koperasi Merah Putih";
}

export interface CommodityPriceSnapshot {
  date: string;
  ricePriceIdr: number;
  chilliPriceIdr: number;
  shallotPriceIdr: number;
}

export type PresetType = "STANDARD" | "SEVERE_DROUGHT" | "PEAK_HARVEST" | "HOLIDAY_DEMAND";

export interface ControlTowerMetrics {
  totalSurplusKg: number;
  totalDeficitKg: number;
  activeDeficitCount: number;
  activeVolatilityCount: number;
  averageRicePriceIdr: number;
}
