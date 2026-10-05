export type FoodCategory = 'Cooked' | 'Raw/Bulk' | 'Packaged';

export type StorageType = 'Ambient' | 'Chilled' | 'Hot-hold';

export type Allergen =
  | 'Peanut'
  | 'Gluten'
  | 'Milk'
  | 'Egg'
  | 'Soy'
  | 'Tree nuts'
  | 'None';

export interface TemperatureReading {
  id: string;
  timestamp: number; // epoch ms
  temperatureC: number;
  note?: string;
}

export interface PhotoFreshnessResult {
  id: string;
  thumbnailUrl: string; // Data URL for display
  is_food: boolean;
  food_identified: string;
  freshness_score: number; // 0-100
  visible_issues: string[]; // e.g. ["mould", "wilting", "discolouration", "none"]
  confidence: 'low' | 'medium' | 'high';
  note: string;
  timestamp: number;
  isManualScore?: boolean;
}

export interface PlateWasteResult {
  id: string;
  thumbnailUrl: string;
  is_tray: boolean;
  waste_percentage: number; // 0-100
  main_leftover_item: string;
  confidence: 'low' | 'medium' | 'high';
  note: string;
  timestamp: number;
  isManualEstimate?: boolean;
}

export interface DispatchOffer {
  receiverId: string;
  receiverName: string;
  status: 'offered' | 'accepted' | 'declined' | 'timeout' | 'handed_over';
  timestamp: number;
  pickupCode?: string; // 4-digit code
  offeredAtTimestamp?: number;
  acceptedAtTimestamp?: number;
  handoverRecord?: HandoverRecord;
}

export interface HandoverRecord {
  handoverId: string;
  batchId: string;
  receiverId: string;
  receiverName: string;
  timestamp: number;
  temperatureC: number;
  pickupCodeUsed: string;
  isOverride: boolean;
  overrideReason?: string;
  photoUrl?: string;
  logEntryHash: string;
  confirmedByHuman: boolean;
}

export interface FoodBatch {
  id: string;
  dishName: string;
  category: FoodCategory;
  quantityKg: number;
  preparedTime: number; // epoch ms
  storageType: StorageType;
  allergens: Allergen[];
  nutritionKcalPer100g?: number | null;
  initialTempC: number;
  readings: TemperatureReading[];
  photoResult?: PhotoFreshnessResult | null;
  // Extra fields for in-house reuse & dispatch workflow
  isReusableInHouse?: boolean;
  reuseIdea?: string;
  dispatchOffer?: DispatchOffer | null;
  notes?: string;
  createdAt: number;
}

export type SpoilageStatus =
  | 'Safe'
  | 'Use soon'
  | 'Urgent'
  | 'Unsafe: never offer as food';

export interface PhotoRuleSettings {
  highThreshold: number; // default 75 (>= 75: no change)
  lowThreshold: number; // default 45 (45-74: safe hours multiplied by factor)
  moderateFactor: number; // default 0.5
}

export interface SpoilageCalculationResult {
  baseSafeHours: number;
  referenceTempC: number;
  consumedRefHours: number;
  rawSafeHoursLeft: number; // Before photo adjustment (Clock hours)
  safeHoursLeft: number; // Adjusted by photo
  percentageLeft: number;
  status: SpoilageStatus;
  currentTempC: number;
  currentRateFactor: number;
  projectedRemainingSeconds: number;
  isExpired: boolean;
  meanKineticTempC: number;
  totalElapsedHours: number;
  photoAdjustmentApplied: boolean;
  photoRuleNote?: string;
  intervals: Array<{
    durationHours: number;
    tempC: number;
    rateFactor: number;
    consumedHours: number;
  }>;
}

export interface StorageConfigItem {
  category: FoodCategory;
  storageType: StorageType;
  baseSafeHours: number;
  referenceTempC: number;
  description: string;
}

export type StorageConfigMap = Record<string, StorageConfigItem>;

export interface VoiceBatchExtraction {
  transcript: string;
  language: string;
  dish: string;
  category: FoodCategory | null;
  quantity_kg: number | null;
  temperature_c: number | null;
  storage: StorageType | null;
  allergens: string[];
}

// -------------------------------------------------------------
// CASCADE MATCH ENGINE & RECEIVERS DATA TYPES
// -------------------------------------------------------------

export type CascadeTier = 'T1' | 'T2' | 'T3' | 'T4' | 'T5';

export interface Receiver {
  id: string;
  name: string;
  type: string;
  driveMinutes: number;
  distanceKm: number;
  capacityKgNow: number;
  needLevel: number; // 1 to 5 scale
  noAllergens: Allergen[]; // List of allergens strictly forbidden
  accepts: FoodCategory[]; // List of categories accepted: Cooked, Raw/Bulk, Packaged
  reliability: number; // 0 to 100
  tier: 'T2' | 'T3' | 'T4' | 'T5';
  contactPerson?: string;
  address?: string;
  phone?: string;
}

export interface MatchScoreBreakdown {
  timeSlackRaw: number; // 0 to 1
  capacityFitRaw: number; // 0 to 1
  needLevelRaw: number; // 0 to 1
  reliabilityRaw: number; // 0 to 1
  roadTimeRaw: number; // 0 to 1
  timeSlackWeighted: number;
  capacityFitWeighted: number;
  needLevelWeighted: number;
  reliabilityWeighted: number;
  roadTimeWeighted: number;
  totalScore: number; // 0 to 100
}

export interface ReceiverMatchResult {
  receiver: Receiver;
  isQualified: boolean;
  disqualificationReason?: string;
  hoursNeeded: number;
  timeSlackHours: number;
  score: MatchScoreBreakdown;
  whyThisOne: string;
  isNearest: boolean;
}

export interface TierEvaluation {
  tier: CascadeTier;
  title: string;
  subtitle: string;
  isAvailable: boolean;
  reason: string;
  qualifyingCount: number;
  topMatch?: ReceiverMatchResult;
  secondaryBuyerDiscountPercent?: number;
}

export interface MatchWeights {
  timeSlack: number; // default 25
  capacityFit: number; // default 20
  needLevel: number; // default 20
  reliability: number; // default 20
  roadTime: number; // default 15
}

export interface LogisticsSettings {
  pickupBufferHours: number; // default 0.5 (30 mins)
  servingWindowHours: number; // default 1.0 (60 mins)
  minInHouseSafeHours: number; // default 2.0 (120 mins)
}

// -------------------------------------------------------------
// DONOR PROFILE & TRUST LOG TYPES
// -------------------------------------------------------------

export type DonorType =
  | 'Canteen'
  | 'Hostel'
  | 'Hospital'
  | 'Caterer'
  | 'Food factory';

export interface DonorProfile {
  name: string;
  type: DonorType;
  fssaiNumber: string; // 14 digits
  address: string;
  contactPerson: string;
}

export interface TrustLogEntry {
  index: number;
  timestamp: number;
  eventType:
    | 'BATCH_CREATED'
    | 'PHOTO_CHECK'
    | 'OFFER_SENT'
    | 'OFFER_ACCEPTED'
    | 'OFFER_DECLINED'
    | 'OFFER_TIMEOUT'
    | 'OVERRIDE_RECORDED'
    | 'HANDOVER_CONFIRMED'
    | 'RECEIVER_CONFIRMED';
  actor: 'donor' | 'receiver' | 'system';
  batchId: string;
  dishName: string;
  payload: Record<string, any>;
  previousHash: string;
  hash: string;
  signature: string; // HMAC-SHA-256
  isTampered?: boolean;
  tamperedField?: string;
  originalPayload?: Record<string, any>;
}

export interface AppSettings {
  storageConfigs: StorageConfigMap;
  photoRules: PhotoRuleSettings;
  matchWeights: MatchWeights;
  logistics: LogisticsSettings;
  donorProfile: DonorProfile;
  alertCostEstimateRupees: number; // default 0.15
  mealServingKg: number; // default 0.4 kg per meal
  co2eFactorKg: number; // default 2.5 kg CO2e / kg
  minHandoverHotTempC: number; // default 60 C
  maxHandoverChilledTempC: number; // default 8 C
  demoSigningKey: string;
}
