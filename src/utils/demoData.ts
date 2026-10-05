import { FoodBatch } from '../types/batch';

const SAMPLE_PANEER_SVG_URL =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23f3f4f6"/><rect x="30" y="30" width="60" height="60" rx="8" fill="%23fffbeb" stroke="%23e5e7eb" stroke-width="2"/><rect x="110" y="35" width="60" height="60" rx="8" fill="%23fef3c7" stroke="%23e5e7eb" stroke-width="2"/><rect x="65" y="105" width="70" height="70" rx="8" fill="%23ffffff" stroke="%23e5e7eb" stroke-width="2"/><text x="100" y="190" font-family="sans-serif" font-size="11" font-weight="bold" fill="%234b5563" text-anchor="middle">Fresh Paneer Batch</text></svg>';

/**
 * Creates the official specified demo batch:
 * "Vegetable curry", Cooked, 40 kg, Ambient, 28 °C, prepared 1 hour ago, allergen: None.
 */
export function createOfficialDemoBatch(currentEpochMs: number = Date.now()): FoodBatch {
  const oneHourAgo = currentEpochMs - 60 * 60 * 1000;
  const thirtyMinsAgo = currentEpochMs - 30 * 60 * 1000;

  return {
    id: `batch-demo-${Date.now()}`,
    dishName: 'Vegetable curry',
    category: 'Cooked',
    quantityKg: 40,
    preparedTime: oneHourAgo,
    storageType: 'Ambient',
    allergens: ['None'],
    nutritionKcalPer100g: 115,
    initialTempC: 28,
    readings: [
      {
        id: `reading-1-${Date.now()}`,
        timestamp: oneHourAgo,
        temperatureC: 28,
        note: 'Freshly portioned into distribution bins',
      },
      {
        id: `reading-2-${Date.now()}`,
        timestamp: thirtyMinsAgo,
        temperatureC: 29.5,
        note: 'Staged in ambient dispatch bay',
      },
    ],
    notes: 'Mild aromatic lentil and seasonal vegetable curry prepared for community meal service.',
    createdAt: oneHourAgo,
  };
}

/**
 * Additional sample batches with one photo-inspected sample
 */
export function getSampleInitialBatches(currentEpochMs: number = Date.now()): FoodBatch[] {
  const officialDemo = createOfficialDemoBatch(currentEpochMs);

  const twoHoursAgo = currentEpochMs - 2 * 60 * 60 * 1000;
  const chilledBatch: FoodBatch = {
    id: 'batch-chilled-paneer',
    dishName: 'Fresh Paneer Cubes (Cold Chain)',
    category: 'Cooked',
    quantityKg: 25,
    preparedTime: twoHoursAgo,
    storageType: 'Chilled',
    allergens: ['Milk'],
    nutritionKcalPer100g: 265,
    initialTempC: 4.5,
    photoResult: {
      id: 'photo-sample-paneer',
      thumbnailUrl: SAMPLE_PANEER_SVG_URL,
      is_food: true,
      food_identified: 'Fresh Paneer Cubes',
      freshness_score: 88,
      visible_issues: ['none'],
      confidence: 'high',
      note: 'Firm texture with clean cut edges and no surface discolouration or moisture pooling.',
      timestamp: currentEpochMs - 45 * 60 * 1000,
    },
    readings: [
      {
        id: 'reading-chilled-1',
        timestamp: twoHoursAgo,
        temperatureC: 4.5,
        note: 'Transferred to walk-in cold room',
      },
      {
        id: 'reading-chilled-2',
        timestamp: currentEpochMs - 45 * 60 * 1000,
        temperatureC: 4.8,
        note: 'Regular IoT probe log',
      },
    ],
    notes: 'Pasteurized dairy paneer sealed in food-grade insulated totes.',
    createdAt: twoHoursAgo,
  };

  const hotHoldBatch: FoodBatch = {
    id: 'batch-hot-sambar',
    dishName: 'Lentil Sambar (Hot-Hold)',
    category: 'Cooked',
    quantityKg: 60,
    preparedTime: currentEpochMs - 3.5 * 60 * 60 * 1000,
    storageType: 'Hot-hold',
    allergens: ['None'],
    nutritionKcalPer100g: 88,
    initialTempC: 64,
    readings: [
      {
        id: 'reading-hot-1',
        timestamp: currentEpochMs - 3.5 * 60 * 60 * 1000,
        temperatureC: 64,
        note: 'Kettle dispatch at serving temperature',
      },
      {
        id: 'reading-hot-2',
        timestamp: currentEpochMs - 1.5 * 60 * 60 * 1000,
        temperatureC: 61.5,
        note: 'Thermal insulated transport vessel',
      },
    ],
    notes: 'Hot-hold catering vessel scheduled for midday lunch distribution.',
    createdAt: currentEpochMs - 3.5 * 60 * 60 * 1000,
  };

  return [officialDemo, chilledBatch, hotHoldBatch];
}
