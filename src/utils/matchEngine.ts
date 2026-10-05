/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AnnaChakra Cascade Redistribution Engine
 * 
 * Pure, well-commented multi-tiered food routing engine.
 * Computes optimal redistribution decisions in real-time based on live
 * Arrhenius safe hours (H), logistics time windows, allergen constraints,
 * and multi-factor receiver match scoring.
 */

import {
  FoodBatch,
  Receiver,
  ReceiverMatchResult,
  MatchScoreBreakdown,
  MatchWeights,
  LogisticsSettings,
  TierEvaluation,
  CascadeTier,
  SpoilageCalculationResult,
} from '../types/batch';

/**
 * Default Logistics Buffer Settings (Editable in Settings)
 */
export const DEFAULT_LOGISTICS_SETTINGS: LogisticsSettings = {
  pickupBufferHours: 0.5, // 30 minutes to pack totes & load vehicle
  servingWindowHours: 1.0, // 60 minutes for dining service / food bank distribution
  minInHouseSafeHours: 2.0, // Minimum safe shelf-life required for internal kitchen repurposing
};

/**
 * Default Multi-Factor Match Scoring Weights (Sum = 100, Editable)
 */
export const DEFAULT_MATCH_WEIGHTS: MatchWeights = {
  timeSlack: 25, // Remaining safety margin after transit & service
  capacityFit: 20, // Ability to absorb entire batch in one trip
  needLevel: 20, // Vulnerability / hunger severity (1 to 5)
  reliability: 20, // Historical on-time acceptance rate (0 to 100)
  roadTime: 15, // Travel transit speed / proximity
};

/**
 * 9 Standard Fictional Demo Receivers
 * Clearly labelled "Fictional demo data"
 * 
 * Configured so that for the official demo batch ("Vegetable curry", 40 kg, Cooked),
 * the nearest receiver ("Demo Shelter A", 2 km) is NOT the best match because
 * of inadequate capacity (10 kg) and low reliability (55%).
 */
export const DEMO_RECEIVERS: Receiver[] = [
  // --- TIER T2: PEOPLE (Community Shelters, Kitchens, Charities) ---
  {
    id: 'rec-shelter-a',
    name: 'Demo Shelter A',
    type: 'Emergency Night Shelter',
    driveMinutes: 8,
    distanceKm: 2,
    capacityKgNow: 10, // Deficient capacity for 40 kg batch!
    needLevel: 3,
    noAllergens: [],
    accepts: ['Cooked', 'Packaged'],
    reliability: 55, // Low reliability
    tier: 'T2',
    contactPerson: 'Ramesh K. (Intake Officer)',
    address: 'Near Old Bus Terminal, Ward 4',
  },
  {
    id: 'rec-shelter-b',
    name: 'Demo Shelter B',
    type: 'Community Relief Shelter',
    driveMinutes: 14,
    distanceKm: 4,
    capacityKgNow: 60, // Ample capacity for 40 kg batch
    needLevel: 5, // Maximum acute need
    noAllergens: [],
    accepts: ['Cooked', 'Packaged'],
    reliability: 92, // High reliability
    tier: 'T2',
    contactPerson: 'Sister Mary (Kitchen Head)',
    address: 'Sector 12, Civic Center Link',
  },
  {
    id: 'rec-kitchen-c',
    name: 'Demo Community Kitchen C',
    type: 'Central Community Dining',
    driveMinutes: 20,
    distanceKm: 6,
    capacityKgNow: 80,
    needLevel: 4,
    noAllergens: ['Peanut'], // Strict peanut exclusion
    accepts: ['Cooked', 'Raw/Bulk', 'Packaged'],
    reliability: 85,
    tier: 'T2',
    contactPerson: 'Chef Anand (Production Head)',
    address: 'Industrial Estate Gate 2',
  },
  {
    id: 'rec-orphanage-d',
    name: 'Demo Orphanage D',
    type: 'Children Welfare Home',
    driveMinutes: 24,
    distanceKm: 7,
    capacityKgNow: 35,
    needLevel: 4,
    noAllergens: ['Peanut'], // Strict peanut exclusion
    accepts: ['Cooked', 'Packaged'],
    reliability: 78,
    tier: 'T2',
    contactPerson: 'Dr. Sunita (Warden)',
    address: 'Green Meadows Bypass',
  },
  {
    id: 'rec-youth-home-e',
    name: 'Demo Senior Care Home E',
    type: 'Elderly Residential Care',
    driveMinutes: 26,
    distanceKm: 8,
    capacityKgNow: 45,
    needLevel: 4,
    noAllergens: ['Tree nuts'],
    accepts: ['Cooked', 'Packaged'],
    reliability: 82,
    tier: 'T2',
    contactPerson: 'Matron Preethi',
    address: 'Ring Road South',
  },

  // --- TIER T3: SECONDARY BUYERS (Discount surplus wholesalers) ---
  {
    id: 'rec-buyer-bulk-e',
    name: 'Demo Bulk Buyer E',
    type: 'Surplus Commercial Aggregator',
    driveMinutes: 28,
    distanceKm: 9,
    capacityKgNow: 200,
    needLevel: 3,
    noAllergens: [],
    accepts: ['Raw/Bulk', 'Packaged'], // Does not accept Cooked
    reliability: 90,
    tier: 'T3',
    contactPerson: 'Vikram Trading Co.',
    address: 'Grain Mandi Yard 7',
  },
  {
    id: 'rec-discount-outlet-g',
    name: 'Demo Discount Food Outlet G',
    type: 'Surplus Clearance Market',
    driveMinutes: 30,
    distanceKm: 10,
    capacityKgNow: 180,
    needLevel: 2,
    noAllergens: [],
    accepts: ['Raw/Bulk', 'Packaged'],
    reliability: 88,
    tier: 'T3',
    contactPerson: 'Bazaar Logistics',
    address: 'Wholesale Depot B-4',
  },

  // --- TIER T4: ANIMAL FEED ---
  {
    id: 'rec-feed-unit-f',
    name: 'Demo Feed Unit F',
    type: 'Livestock & Poultry Feed Processor',
    driveMinutes: 35,
    distanceKm: 11,
    capacityKgNow: 300,
    needLevel: 3,
    noAllergens: [],
    accepts: ['Cooked', 'Raw/Bulk'],
    reliability: 95,
    tier: 'T4',
    contactPerson: 'Kisan Agro Products',
    address: 'Agro Industrial Zone',
  },

  // --- TIER T5: BIOGAS & COMPOST ---
  {
    id: 'rec-biogas-plant-g',
    name: 'Demo Biogas Plant G',
    type: 'Municipal Anaerobic Digester & Compost Facility',
    driveMinutes: 40,
    distanceKm: 13,
    capacityKgNow: 1000,
    needLevel: 5,
    noAllergens: [],
    accepts: ['Cooked', 'Raw/Bulk', 'Packaged'],
    reliability: 99,
    tier: 'T5',
    contactPerson: 'CleanEnergy Municipal Grid',
    address: 'Bio-waste Energy Park',
  },
];

/**
 * Calculates the required logistics delivery window in hours:
 * driveMinutes/60 + pickupBuffer + servingWindow
 */
export function calculateHoursNeeded(
  driveMinutes: number,
  logistics: LogisticsSettings = DEFAULT_LOGISTICS_SETTINGS
): number {
  return driveMinutes / 60 + logistics.pickupBufferHours + logistics.servingWindowHours;
}

/**
 * Computes 5-factor normalized score (0-100) for a qualifying T2 receiver
 */
export function calculateMatchScore(
  receiver: Receiver,
  batch: FoodBatch,
  adjustedSafeHours: number,
  hoursNeeded: number,
  weights: MatchWeights = DEFAULT_MATCH_WEIGHTS
): MatchScoreBreakdown {
  // 1. Time Slack: how much safe life remains after delivery & serving
  // Higher safety margin -> closer to 1.0
  const slackHours = adjustedSafeHours - hoursNeeded;
  const timeSlackRaw = adjustedSafeHours > 0
    ? Math.min(1, Math.max(0, slackHours / Math.max(0.1, adjustedSafeHours)))
    : 0;

  // 2. Capacity Fit: min(1, capacity / quantity)
  // Penalizes receivers that cannot take the whole batch in one dispatch
  const quantity = Math.max(0.1, batch.quantityKg);
  const capacityFitRaw = Math.min(1, Math.max(0, receiver.capacityKgNow / quantity));

  // 3. Need Level: normalized from 1-5 scale (0.2 to 1.0)
  const needLevelRaw = Math.min(1, Math.max(0.2, receiver.needLevel / 5));

  // 4. Reliability: historical on-time pickups (0 to 1.0)
  const reliabilityRaw = Math.min(1, Math.max(0, receiver.reliability / 100));

  // 5. Road Time: shorter drive is better (1 - driveMinutes/60, clamped 0 to 1)
  const roadTimeRaw = Math.max(0, 1 - Math.min(1, receiver.driveMinutes / 60));

  // Total weight normalization check
  const totalWeight =
    weights.timeSlack +
    weights.capacityFit +
    weights.needLevel +
    weights.reliability +
    weights.roadTime;
  const normWeight = totalWeight > 0 ? totalWeight : 100;

  const timeSlackWeighted = (timeSlackRaw * weights.timeSlack * 100) / normWeight;
  const capacityFitWeighted = (capacityFitRaw * weights.capacityFit * 100) / normWeight;
  const needLevelWeighted = (needLevelRaw * weights.needLevel * 100) / normWeight;
  const reliabilityWeighted = (reliabilityRaw * weights.reliability * 100) / normWeight;
  const roadTimeWeighted = (roadTimeRaw * weights.roadTime * 100) / normWeight;

  const totalScore = Math.round(
    timeSlackWeighted +
    capacityFitWeighted +
    needLevelWeighted +
    reliabilityWeighted +
    roadTimeWeighted
  );

  return {
    timeSlackRaw,
    capacityFitRaw,
    needLevelRaw,
    reliabilityRaw,
    roadTimeRaw,
    timeSlackWeighted: Number(timeSlackWeighted.toFixed(1)),
    capacityFitWeighted: Number(capacityFitWeighted.toFixed(1)),
    needLevelWeighted: Number(needLevelWeighted.toFixed(1)),
    reliabilityWeighted: Number(reliabilityWeighted.toFixed(1)),
    roadTimeWeighted: Number(roadTimeWeighted.toFixed(1)),
    totalScore: Math.min(100, Math.max(0, totalScore)),
  };
}

/**
 * Generates a concise human-readable explanation of why a receiver is scored/ranked
 */
export function generateWhyThisOne(
  receiver: Receiver,
  batch: FoodBatch,
  score: MatchScoreBreakdown,
  hoursNeeded: number
): string {
  const parts: string[] = [];

  if (receiver.needLevel >= 4) {
    parts.push(`High hunger priority (${receiver.needLevel}/5)`);
  }
  if (receiver.reliability >= 85) {
    parts.push(`${receiver.reliability}% reliable`);
  }
  if (receiver.capacityKgNow >= batch.quantityKg) {
    parts.push(`absorbs full ${batch.quantityKg} kg`);
  } else {
    parts.push(`capacity ${receiver.capacityKgNow} kg (partial)`);
  }
  parts.push(`${receiver.driveMinutes} min away (${hoursNeeded.toFixed(1)}h total window)`);

  return parts.join(', ');
}

/**
 * Evaluates all receivers for a specific batch and calculates Cascade Ladder
 * 
 * Cascade tiers:
 * - T1 In-house reuse: Reusable checkbox ticked AND H >= 2.0h
 * - T2 People (Shelters/Charities): H >= hours needed, category accepted, no allergen conflicts
 * - T3 Secondary Buyers: Raw/Bulk or Packaged only, H >= hours needed, falling-price discount
 * - T4 Animal Feed: H > 0 and T2/T3 not possible ("where permitted by local rules")
 * - T5 Biogas/Compost: Always available; ONLY tier allowed when Unsafe or H <= 0
 */
export function evaluateCascadeEngine(
  batch: FoodBatch,
  spoilage: SpoilageCalculationResult,
  receivers: Receiver[] = DEMO_RECEIVERS,
  logistics: LogisticsSettings = DEFAULT_LOGISTICS_SETTINGS,
  weights: MatchWeights = DEFAULT_MATCH_WEIGHTS
): {
  recommendedTier: CascadeTier;
  tierEvaluations: Record<CascadeTier, TierEvaluation>;
  rankedT2Matches: ReceiverMatchResult[];
  excludedReceivers: ReceiverMatchResult[];
  nearestT2Receiver: ReceiverMatchResult | null;
  bestT2Receiver: ReceiverMatchResult | null;
  splitSuggestion?: {
    isRecommended: boolean;
    receiverA: ReceiverMatchResult;
    receiverB: ReceiverMatchResult;
    quantityA: number;
    quantityB: number;
    reason: string;
  };
} {
  const H = spoilage.safeHoursLeft; // Adjusted safe hours from photo & Arrhenius
  const isUnsafe = spoilage.status === 'Unsafe: never offer as food' || H <= 0;

  // Minimum distance receiver among T2
  const t2Receivers = receivers.filter((r) => r.tier === 'T2');
  const minDistanceKm = Math.min(...t2Receivers.map((r) => r.distanceKm));

  // Evaluate each receiver against batch conditions
  const evaluatedReceivers: ReceiverMatchResult[] = receivers.map((receiver) => {
    const hoursNeeded = calculateHoursNeeded(receiver.driveMinutes, logistics);
    const timeSlackHours = H - hoursNeeded;
    const isNearest = receiver.tier === 'T2' && receiver.distanceKm === minDistanceKm;

    // Check disqualifications:
    let isQualified = true;
    let disqualificationReason = '';

    if (isUnsafe) {
      if (receiver.tier !== 'T5') {
        isQualified = false;
        disqualificationReason = 'Batch is classified Unsafe: never offer as food. Only Biogas/Compost (T5) permitted.';
      }
    } else {
      // Category acceptance check
      if (!receiver.accepts.includes(batch.category)) {
        isQualified = false;
        disqualificationReason = `Does not accept "${batch.category}" category food (accepts: ${receiver.accepts.join(', ')}).`;
      }
      // Allergen exclusion check (Hard exclusion)
      else if (
        batch.allergens &&
        batch.allergens.some((alg) => alg !== 'None' && receiver.noAllergens.includes(alg))
      ) {
        const conflictingAllergen = batch.allergens.find(
          (alg) => alg !== 'None' && receiver.noAllergens.includes(alg)
        );
        isQualified = false;
        disqualificationReason = `Strict allergen exclusion: batch contains ${conflictingAllergen}, which this facility forbids.`;
      }
      // Safe hours window check
      else if (H < hoursNeeded) {
        isQualified = false;
        disqualificationReason = `Transit window deficit: requires ${hoursNeeded.toFixed(1)}h (transit + buffers), but only ${H.toFixed(1)}h safe life remains.`;
      }
    }

    const score = calculateMatchScore(receiver, batch, H, hoursNeeded, weights);
    const whyThisOne = generateWhyThisOne(receiver, batch, score, hoursNeeded);

    return {
      receiver,
      isQualified,
      disqualificationReason,
      hoursNeeded: Number(hoursNeeded.toFixed(2)),
      timeSlackHours: Number(timeSlackHours.toFixed(2)),
      score,
      whyThisOne,
      isNearest,
    };
  });

  // Separate qualified and excluded
  const qualifiedT2 = evaluatedReceivers
    .filter((r) => r.receiver.tier === 'T2' && r.isQualified)
    .sort((a, b) => b.score.totalScore - a.score.totalScore);

  const excludedReceivers = evaluatedReceivers.filter((r) => !r.isQualified);

  const nearestT2Receiver =
    evaluatedReceivers.find((r) => r.receiver.tier === 'T2' && r.isNearest) || null;
  const bestT2Receiver = qualifiedT2[0] || null;

  // Compute split suggestion if batch exceeds the capacity of the top match
  let splitSuggestion: any = undefined;
  if (qualifiedT2.length >= 2 && bestT2Receiver && bestT2Receiver.receiver.capacityKgNow < batch.quantityKg) {
    const secondBest = qualifiedT2[1];
    const capacityA = bestT2Receiver.receiver.capacityKgNow;
    const remainingNeeded = batch.quantityKg - capacityA;
    const capacityB = Math.min(remainingNeeded, secondBest.receiver.capacityKgNow);

    if (capacityA + capacityB >= batch.quantityKg) {
      splitSuggestion = {
        isRecommended: true,
        receiverA: bestT2Receiver,
        receiverB: secondBest,
        quantityA: capacityA,
        quantityB: capacityB,
        reason: `Batch (${batch.quantityKg} kg) exceeds ${bestT2Receiver.receiver.name}'s current capacity (${capacityA} kg). Splitting across ${bestT2Receiver.receiver.name} (${capacityA} kg) and ${secondBest.receiver.name} (${capacityB} kg) recovers 100% of the food.`,
      };
    }
  }

  // --- TIER EVALUATIONS ---
  // T1: In-House Reuse
  const t1Available = !isUnsafe && Boolean(batch.isReusableInHouse) && H >= logistics.minInHouseSafeHours;
  let t1Reason = '';
  if (isUnsafe) {
    t1Reason = 'Unsafe: never offered as food';
  } else if (!batch.isReusableInHouse) {
    t1Reason = 'Not marked as reusable in-house on food passport';
  } else if (H < logistics.minInHouseSafeHours) {
    t1Reason = `Requires ${logistics.minInHouseSafeHours}h safe life for kitchen prep, only ${H.toFixed(1)}h left`;
  } else {
    t1Reason = batch.reuseIdea ? `Kitchen repurposing ready: "${batch.reuseIdea}"` : 'Repurposing in our kitchen ready';
  }

  // T2: People
  const t2Available = !isUnsafe && qualifiedT2.length > 0;
  let t2Reason = '';
  if (isUnsafe) {
    t2Reason = 'Unsafe: never offered as food';
  } else if (qualifiedT2.length === 0) {
    t2Reason = `No shelters qualify (remaining safe hours ${H.toFixed(1)}h insufficient for transit windows or allergen restrictions)`;
  } else {
    t2Reason = `${qualifiedT2.length} community shelter(s) matched and verified`;
  }

  // T3: Secondary Buyers (Only for Raw/Bulk or Packaged)
  const isEligibleForSecondarySale = batch.category === 'Raw/Bulk' || batch.category === 'Packaged';
  const qualifiedT3 = evaluatedReceivers.filter((r) => r.receiver.tier === 'T3' && r.isQualified);
  const t3Available = !isUnsafe && isEligibleForSecondarySale && qualifiedT3.length > 0;
  
  // Falling-price offer: discount % = 30 + (1 - H/baseSafeHours) * 40, capped at 70
  const baseHours = Math.max(1, spoilage.baseSafeHours);
  const rawDiscount = 30 + (1 - Math.min(1, Math.max(0, H / baseHours))) * 40;
  const secondaryBuyerDiscountPercent = Math.min(70, Math.max(30, Math.round(rawDiscount)));

  let t3Reason = '';
  if (isUnsafe) {
    t3Reason = 'Unsafe: never offered as food';
  } else if (!isEligibleForSecondarySale) {
    t3Reason = 'Cooked food is ineligible for commercial secondary resale';
  } else if (qualifiedT3.length === 0) {
    t3Reason = 'Safe hours insufficient for bulk warehouse transit';
  } else {
    t3Reason = `${qualifiedT3.length} surplus buyer(s) at dynamic ${secondaryBuyerDiscountPercent}% clearance discount`;
  }

  // T4: Animal Feed (when H > 0 and T2/T3 are not available)
  const qualifiedT4 = evaluatedReceivers.filter((r) => r.receiver.tier === 'T4' && r.isQualified);
  const t4Available = !isUnsafe && H > 0 && (!t2Available && !t3Available) && qualifiedT4.length > 0;
  let t4Reason = '';
  if (isUnsafe) {
    t4Reason = 'Unsafe: never offered as food';
  } else if (t2Available || t3Available) {
    t4Reason = 'Higher priority tier (People / Secondary) available';
  } else if (qualifiedT4.length === 0) {
    t4Reason = 'Feed facility transit window exceeded';
  } else {
    t4Reason = 'Eligible for livestock conversion (where permitted by local rules)';
  }

  // T5: Biogas / Compost (Always available; only tier if Unsafe)
  const t5Available = true;
  const t5Reason = isUnsafe
    ? 'Unsafe for consumption: diverted directly to anaerobic digestion / compost'
    : 'Anaerobic digester available as final diversion safeguard';

  // Determine Recommended Tier (highest available priority: T1 -> T2 -> T3 -> T4 -> T5)
  let recommendedTier: CascadeTier = 'T5';
  if (t1Available) {
    recommendedTier = 'T1';
  } else if (t2Available) {
    recommendedTier = 'T2';
  } else if (t3Available) {
    recommendedTier = 'T3';
  } else if (t4Available) {
    recommendedTier = 'T4';
  } else {
    recommendedTier = 'T5';
  }

  const tierEvaluations: Record<CascadeTier, TierEvaluation> = {
    T1: {
      tier: 'T1',
      title: 'T1 In-house reuse',
      subtitle: 'Kitchen repurposing',
      isAvailable: t1Available,
      reason: t1Reason,
      qualifyingCount: t1Available ? 1 : 0,
    },
    T2: {
      tier: 'T2',
      title: 'T2 People (shelter, community kitchen, orphanage)',
      subtitle: 'Shelters, kitchens & orphanages',
      isAvailable: t2Available,
      reason: t2Reason,
      qualifyingCount: qualifiedT2.length,
      topMatch: bestT2Receiver || undefined,
    },
    T3: {
      tier: 'T3',
      title: 'T3 Secondary buyer',
      subtitle: 'Discount clearance',
      isAvailable: t3Available,
      reason: t3Reason,
      qualifyingCount: qualifiedT3.length,
      topMatch: qualifiedT3[0] || undefined,
      secondaryBuyerDiscountPercent,
    },
    T4: {
      tier: 'T4',
      title: 'T4 Animal feed',
      subtitle: 'Livestock conversion',
      isAvailable: t4Available,
      reason: t4Reason,
      qualifyingCount: qualifiedT4.length,
      topMatch: qualifiedT4[0] || undefined,
    },
    T5: {
      tier: 'T5',
      title: 'T5 Biogas/compost',
      subtitle: 'Anaerobic digestion',
      isAvailable: t5Available,
      reason: t5Reason,
      qualifyingCount: 1,
      topMatch: evaluatedReceivers.find((r) => r.receiver.tier === 'T5') || undefined,
    },
  };

  return {
    recommendedTier,
    tierEvaluations,
    rankedT2Matches: qualifiedT2,
    excludedReceivers,
    nearestT2Receiver,
    bestT2Receiver,
    splitSuggestion,
  };
}
