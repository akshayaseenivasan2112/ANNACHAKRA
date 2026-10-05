/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AnnaChakra Spoilage Clock Engine
 * 
 * Implements pure Arrhenius kinetics and Mean Kinetic Temperature (MKT)
 * accounting for perishable food safety and dynamic shelf-life estimation,
 * with multimodal photo freshness risk adjustment rules.
 */

import {
  FoodBatch,
  FoodCategory,
  StorageType,
  StorageConfigMap,
  SpoilageCalculationResult,
  SpoilageStatus,
  PhotoRuleSettings,
} from '../types/batch';

/**
 * Universal Physical and Chemical Constants
 * deltaH: Standard activation energy / enthalpy of degradation (kJ/mol)
 * R: Universal gas constant in kJ/(mol*K)
 */
export const ARRHENIUS_DELTA_H = 83.144; // kJ / mol (standard USP/ICH parameter)
export const GAS_CONSTANT_R = 0.008314; // kJ / (mol * K)
export const DELTA_H_OVER_R = ARRHENIUS_DELTA_H / GAS_CONSTANT_R; // ~ 10000.4811 K
export const ABSOLUTE_ZERO_CELSIUS = 273.15;

/**
 * Default Photo Freshness Adjustment Rules (Illustrative Defaults)
 */
export const DEFAULT_PHOTO_RULES: PhotoRuleSettings = {
  highThreshold: 75, // >= 75: no change
  lowThreshold: 45, // 45-74: safe hours multiplied by 0.5
  moderateFactor: 0.5,
};

/**
 * Default Reference Baselines
 */
export const DEFAULT_STORAGE_CONFIGS: StorageConfigMap = {
  'Cooked_Ambient': {
    category: 'Cooked',
    storageType: 'Ambient',
    baseSafeHours: 4,
    referenceTempC: 25,
    description: 'Freshly prepared food held at standard room temperature',
  },
  'Cooked_Chilled': {
    category: 'Cooked',
    storageType: 'Chilled',
    baseSafeHours: 48,
    referenceTempC: 5,
    description: 'Cooked food actively refrigerated at 5 °C',
  },
  'Cooked_Hot-hold': {
    category: 'Cooked',
    storageType: 'Hot-hold',
    baseSafeHours: 6,
    referenceTempC: 60,
    description: 'Cooked food held in warming units above 60 °C',
  },
  'Raw/Bulk_Ambient': {
    category: 'Raw/Bulk',
    storageType: 'Ambient',
    baseSafeHours: 8,
    referenceTempC: 25,
    description: 'Raw agricultural or bulk produce at ambient temperature',
  },
  'Raw/Bulk_Chilled': {
    category: 'Raw/Bulk',
    storageType: 'Chilled',
    baseSafeHours: 72,
    referenceTempC: 5,
    description: 'Raw meat, seafood, dairy, or produce held in cold room',
  },
  'Raw/Bulk_Hot-hold': {
    category: 'Raw/Bulk',
    storageType: 'Hot-hold',
    baseSafeHours: 4,
    referenceTempC: 60,
    description: 'Pre-marinated / thermal prep raw ingredients in heat pass',
  },
  'Packaged_Ambient': {
    category: 'Packaged',
    storageType: 'Ambient',
    baseSafeHours: 168,
    referenceTempC: 25,
    description: 'Commercial packaged goods at 25 °C (7 days baseline)',
  },
  'Packaged_Chilled': {
    category: 'Packaged',
    storageType: 'Chilled',
    baseSafeHours: 336,
    referenceTempC: 5,
    description: 'Packaged perishable dairy, chilled ready meals (14 days)',
  },
  'Packaged_Hot-hold': {
    category: 'Packaged',
    storageType: 'Hot-hold',
    baseSafeHours: 12,
    referenceTempC: 60,
    description: 'Packaged warm delivery / hot-box items',
  },
};

export function getStorageConfigKey(category: FoodCategory, storageType: StorageType): string {
  return `${category}_${storageType}`;
}

export function celsiusToKelvin(tempC: number): number {
  return Math.max(0.1, tempC + ABSOLUTE_ZERO_CELSIUS);
}

export function calculateArrheniusRateFactor(tempC: number, referenceTempC: number): number {
  const tKelvin = celsiusToKelvin(tempC);
  const tRefKelvin = celsiusToKelvin(referenceTempC);
  const exponent = -DELTA_H_OVER_R * (1 / tKelvin - 1 / tRefKelvin);
  const clampedExponent = Math.max(-50, Math.min(50, exponent));
  return Math.exp(clampedExponent);
}

/**
 * Pure Spoilage Clock calculation function with Photo Freshness integration
 */
export function calculateBatchSpoilage(
  batch: FoodBatch,
  currentTimeMs: number,
  configs: StorageConfigMap = DEFAULT_STORAGE_CONFIGS,
  photoRules: PhotoRuleSettings = DEFAULT_PHOTO_RULES
): SpoilageCalculationResult {
  const configKey = getStorageConfigKey(batch.category, batch.storageType);
  const config = configs[configKey] || DEFAULT_STORAGE_CONFIGS[configKey] || {
    category: batch.category,
    storageType: batch.storageType,
    baseSafeHours: 4,
    referenceTempC: 25,
    description: 'Fallback storage profile',
  };

  const baseSafeHours = config.baseSafeHours;
  const refTempC = config.referenceTempC;

  const initialTime = batch.preparedTime;
  const initialTemp = batch.initialTempC;

  const validReadings = (batch.readings || [])
    .filter((r) => r.timestamp >= initialTime)
    .sort((a, b) => a.timestamp - b.timestamp);

  const checkpoints: Array<{ timestamp: number; tempC: number }> = [];

  if (validReadings.length === 0 || validReadings[0].timestamp > initialTime) {
    checkpoints.push({ timestamp: initialTime, tempC: initialTemp });
  }

  validReadings.forEach((r) => {
    checkpoints.push({ timestamp: r.timestamp, tempC: r.temperatureC });
  });

  const now = Math.max(initialTime, currentTimeMs);

  let consumedRefHours = 0;
  let totalElapsedHours = 0;
  let sumDeltaTExp = 0;

  const intervals: Array<{
    durationHours: number;
    tempC: number;
    rateFactor: number;
    consumedHours: number;
  }> = [];

  for (let i = 0; i < checkpoints.length; i++) {
    const currentCp = checkpoints[i];
    const nextTimestamp = (i + 1 < checkpoints.length) ? checkpoints[i + 1].timestamp : now;
    
    const intervalMs = Math.max(0, nextTimestamp - currentCp.timestamp);
    const durationHours = intervalMs / (1000 * 60 * 60);

    if (durationHours > 0) {
      const tempC = currentCp.tempC;
      const rateFactor = calculateArrheniusRateFactor(tempC, refTempC);
      const consumedInInterval = durationHours * rateFactor;

      consumedRefHours += consumedInInterval;
      totalElapsedHours += durationHours;

      const tK = celsiusToKelvin(tempC);
      const mktExp = Math.exp(-DELTA_H_OVER_R / tK);
      sumDeltaTExp += durationHours * mktExp;

      intervals.push({
        durationHours,
        tempC,
        rateFactor,
        consumedHours: consumedInInterval,
      });
    }
  }

  // Calculate Mean Kinetic Temperature in Celsius
  let meanKineticTempC = checkpoints[checkpoints.length - 1]?.tempC ?? initialTemp;
  if (totalElapsedHours > 0 && sumDeltaTExp > 0) {
    const averageExp = sumDeltaTExp / totalElapsedHours;
    if (averageExp > 0) {
      const lnAvg = Math.log(averageExp);
      const mktKelvin = DELTA_H_OVER_R / (-lnAvg);
      meanKineticTempC = mktKelvin - ABSOLUTE_ZERO_CELSIUS;
    }
  }

  // Raw clock hours left before photo adjustment
  const rawSafeHoursLeft = Math.max(0, baseSafeHours - consumedRefHours);

  // Apply Photo Freshness Adjustment rule:
  // - If is_food is false: do not change the clock
  // - photo score >= 75: no change
  // - photo score 45 to 74: remaining safe hours multiplied by 0.5
  // - photo score < 45: status becomes "Unsafe: never offer as food"
  let adjustedSafeHoursLeft = rawSafeHoursLeft;
  let isPhotoUnsafe = false;
  let photoAdjustmentApplied = false;
  let photoRuleNote: string | undefined = undefined;

  const photo = batch.photoResult;
  if (photo && photo.is_food) {
    const score = photo.freshness_score;
    if (score < photoRules.lowThreshold) {
      isPhotoUnsafe = true;
      adjustedSafeHoursLeft = 0;
      photoAdjustmentApplied = true;
      photoRuleNote = `Photo score ${score} is below ${photoRules.lowThreshold}: classified unsafe by visual inspection.`;
    } else if (score < photoRules.highThreshold) {
      adjustedSafeHoursLeft = rawSafeHoursLeft * photoRules.moderateFactor;
      photoAdjustmentApplied = true;
      photoRuleNote = `Photo score ${score} (45–74): safe hours scaled by ${photoRules.moderateFactor}x.`;
    } else {
      photoAdjustmentApplied = false;
      photoRuleNote = `Photo score ${score} (≥75): visual condition verified fresh.`;
    }
  }

  const safeHoursLeft = Math.max(0, adjustedSafeHoursLeft);
  const isExpired = safeHoursLeft <= 0 || isPhotoUnsafe;

  // Percentage remaining (calculated relative to base safe hours)
  const percentageLeft = baseSafeHours > 0
    ? Math.max(0, Math.min(100, (safeHoursLeft / baseSafeHours) * 100))
    : 0;

  // Status classification
  let status: SpoilageStatus;
  if (isExpired || isPhotoUnsafe || percentageLeft <= 0) {
    status = 'Unsafe: never offer as food';
  } else if (percentageLeft < 20) {
    status = 'Urgent';
  } else if (percentageLeft <= 50) {
    status = 'Use soon';
  } else {
    status = 'Safe';
  }

  const currentTempC = checkpoints[checkpoints.length - 1]?.tempC ?? initialTemp;
  const currentRateFactor = calculateArrheniusRateFactor(currentTempC, refTempC);

  let projectedRemainingSeconds = 0;
  if (!isExpired && currentRateFactor > 0.00001) {
    const projectedRemainingHours = safeHoursLeft / currentRateFactor;
    projectedRemainingSeconds = Math.max(0, Math.floor(projectedRemainingHours * 3600));
  }

  return {
    baseSafeHours,
    referenceTempC: refTempC,
    consumedRefHours,
    rawSafeHoursLeft,
    safeHoursLeft,
    percentageLeft,
    status,
    currentTempC,
    currentRateFactor,
    projectedRemainingSeconds,
    isExpired,
    meanKineticTempC: Number(meanKineticTempC.toFixed(1)),
    totalElapsedHours: Number(totalElapsedHours.toFixed(2)),
    photoAdjustmentApplied,
    photoRuleNote,
    intervals,
  };
}

export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) {
    return '00:00:00';
  }

  const days = Math.floor(totalSeconds / 86400);
  const remainingSecs = totalSeconds % 86400;
  const hours = Math.floor(remainingSecs / 3600);
  const minutes = Math.floor((remainingSecs % 3600) / 60);
  const seconds = remainingSecs % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (days > 0) {
    return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatDateTime(timestampMs: number): string {
  const d = new Date(timestampMs);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function getStatusTheme(status: SpoilageStatus) {
  switch (status) {
    case 'Safe':
      return {
        badgeBg: 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]',
        clockColor: 'text-[#166534]',
        progressBg: 'bg-[#16A34A]',
        pulse: 'ring-[#22C55E]/30',
        label: 'Safe',
      };
    case 'Use soon':
      return {
        badgeBg: 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]',
        clockColor: 'text-[#D97706]',
        progressBg: 'bg-[#D97706]',
        pulse: 'ring-[#F59E0B]/30',
        label: 'Use soon',
      };
    case 'Urgent':
      return {
        badgeBg: 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]',
        clockColor: 'text-[#DC2626]',
        progressBg: 'bg-[#DC2626]',
        pulse: 'ring-[#EF4444]/40 animate-pulse',
        label: 'Urgent',
      };
    case 'Unsafe: never offer as food':
    default:
      return {
        badgeBg: 'bg-[#1E293B] text-[#F8FAFC] border-[#334155]',
        clockColor: 'text-[#475569]',
        progressBg: 'bg-[#475569]',
        pulse: 'ring-slate-400/20',
        label: 'Unsafe: never offer as food',
      };
  }
}
