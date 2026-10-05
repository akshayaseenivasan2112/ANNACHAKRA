/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AnnaChakra Plan, Factory, and ESG Impact Types
 */

import { PlateWasteResult } from './batch';

// -------------------------------------------------------------
// PLAN TAB: DEMAND FORECAST & CANTEEN TYPES
// -------------------------------------------------------------

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface DailyCanteenRecord {
  date: string; // 'YYYY-MM-DD'
  dayOfWeek: DayOfWeek;
  menu: string;
  attendance: number;
  holidayFlag: boolean;
  holidayName?: string;
  rainFlag: boolean;
  mealsCooked: number;
  mealsEaten: number;
  surplusKg: number;
  plateWastePercent?: number; // 0-100%
  plateWasteItem?: string;
  plateWasteNote?: string;
  forecastMeals?: number;
}

export interface DayForecast {
  date: string; // 'YYYY-MM-DD'
  dayOfWeek: DayOfWeek;
  expectedAttendance: number;
  holidayFlag: boolean;
  holidayName?: string;
  rainFlag: boolean;
  forecastMeals: number;
  lowerConfidence: number; // -6%
  upperConfidence: number; // +8%
  reductionPercent: number; // compared to baseline
  reason: string;
  estimatedFoodSavedKg: number;
}

export interface ForecastAdviceCard {
  id: string;
  dayOfWeek: DayOfWeek;
  dateStr: string;
  headline: string; // e.g. "Friday: cook 12% less rice."
  reason: string; // "Expected attendance is lower and rain is forecast."
  foodSavedKg: number;
  recommendedMeals: number;
  reductionPercent: number;
  category: 'Weather' | 'Holiday' | 'Historical Pattern' | 'Weekly Trend';
  urgency: 'high' | 'medium' | 'info';
}

export interface PlannerSimulationInput {
  targetDayIndex: number; // 0 = Tomorrow, 1 = Day after...
  expectedAttendance: number;
  isHoliday: boolean;
  isRain: boolean;
}

// -------------------------------------------------------------
// FACTORY TAB: PROCESSING-UNIT MONITORING & ANOMALY TYPES
// -------------------------------------------------------------

export interface FactoryLiveSensorState {
  storageTempC: number;
  storageHumidityPercent: number;
  lineSpeedPacketsPerHour: number;
  machineStatus: 'Normal Running' | 'Minor Jam' | 'Speed Throttled' | 'Line Idle' | 'Cleaning';
  powerDrawKw: number;
  flourStockKg: number;
  activeLotId: string;
  lastUpdated: number;
}

export interface HourlyFactoryRecord {
  id: string;
  timestamp: number;
  dateStr: string;
  hour: number; // 0 to 23
  shift: 1 | 2 | 3;
  lineSpeedPacketsPerHour: number;
  flourInKg: number;
  flourUsedKg: number;
  packetsOut: number;
  powerKwh: number;
  downtimeMinutes: number;
  // Anomaly tracking
  isAnomaly?: boolean;
  anomalyType?: 'Downtime' | 'Raw-material loss' | 'Overproduction' | 'Energy waste' | 'Near-date stock';
  anomalyNote?: string;
}

export interface AnomalyCard {
  id: string;
  dateStr: string;
  hourStr: string;
  type: 'Downtime' | 'Raw-material loss' | 'Overproduction' | 'Energy waste' | 'Near-date stock';
  headline: string;
  description: string;
  estimatedLossRupees: number;
  estimatedLossKg: number;
  suggestedAction: string;
  severity: 'critical' | 'warning' | 'info';
  isResolved?: boolean;
  // Near-date stock specific payload for cascade redistribution
  stockPayload?: {
    lotNumber: string;
    productName: string;
    quantityKg: number;
    category: 'Cooked' | 'Raw/Bulk' | 'Packaged';
    bestBeforeHours: number;
  };
}

export interface ControlChartPoint {
  index: number;
  label: string; // 'Day 1 H8'
  value: number;
  mean: number;
  upperControlLimit: number; // +3 sigma
  lowerControlLimit: number; // -3 sigma
  isAnomaly: boolean;
  anomalyType?: string;
}

// -------------------------------------------------------------
// IMPACT TAB: ESG & SCENARIO TYPES
// -------------------------------------------------------------

export interface EsgScenarioInputs {
  mealsPerDay: number; // default 1,000
  surplusPercent: number; // default 12%
  kgPerMeal: number; // default 0.5 kg
  operatingDaysPerYear: number; // default 300
  preventionRatePercent: number; // default 30%
  redirectionRatePercent: number; // default 50%
}

export interface EsgScenarioOutputs {
  annualMealsServed: number;
  annualSurplusGeneratedKg: number;
  annualSurplusGeneratedTonnes: number;
  annualPreventedKg: number;
  annualPreventedTonnes: number;
  annualRedirectedKg: number;
  annualRedirectedTonnes: number;
  totalRescuedOrPreventedTonnes: number;
  annualMealsSaved: number;
  annualCo2eAvoidedTonnes: number;
  annualFinancialSavingsRupees: number;
}

export interface EsgSummaryMetrics {
  kgPrevented: number;
  kgRedistributed: number;
  mealsServed: number;
  co2eAvoidedKg: number;
  rupeesSaved: number;
  anomaliesResolved: number;
  totalHandovers: number;
  chainStatus: string;
  lastBlockHash: string;
  fssaiNumber: string;
  fssaiValid: boolean;
  adviceComplianceRatePercent: number; // default 70%
}
