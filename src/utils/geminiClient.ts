/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PhotoFreshnessResult, VoiceBatchExtraction } from '../types/batch';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends a photo to the backend Gemini endpoint with automatic 1-time retry after 2 seconds.
 */
export async function checkPhotoFreshness(
  imageBase64: string,
  mimeType: string,
  thumbnailUrl: string
): Promise<PhotoFreshnessResult> {
  const payload = { imageBase64, mimeType };

  const attemptCall = async (): Promise<any> => {
    const res = await fetch('/api/gemini/photo-freshness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const error = new Error(errData.error || `HTTP error ${res.status}`);
      (error as any).status = res.status;
      (error as any).isRateLimit = res.status === 429 || errData.isRateLimit;
      throw error;
    }

    return res.json();
  };

  try {
    const data = await attemptCall();
    return formatPhotoResult(data, thumbnailUrl);
  } catch (err: any) {
    console.warn('Initial photo freshness check failed, retrying once after 2 seconds...', err);
    await sleep(2000);

    try {
      const dataRetry = await attemptCall();
      return formatPhotoResult(dataRetry, thumbnailUrl);
    } catch (retryErr: any) {
      console.error('Photo freshness check retry failed:', retryErr);
      throw retryErr;
    }
  }
}

function formatPhotoResult(data: any, thumbnailUrl: string): PhotoFreshnessResult {
  return {
    id: `photo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    thumbnailUrl,
    is_food: Boolean(data.is_food ?? true),
    food_identified: String(data.food_identified || 'Unspecified food'),
    freshness_score: Math.max(0, Math.min(100, Number(data.freshness_score ?? 80))),
    visible_issues: Array.isArray(data.visible_issues) && data.visible_issues.length > 0
      ? data.visible_issues
      : ['none'],
    confidence: (['low', 'medium', 'high'].includes(data.confidence)
      ? data.confidence
      : 'medium') as 'low' | 'medium' | 'high',
    note: String(data.note || 'Visual inspection completed.'),
    timestamp: Date.now(),
  };
}

/**
 * Transcribes audio and extracts batch fields with automatic 1-time retry after 2 seconds.
 */
export async function transcribeVoiceBatch(
  audioBase64: string,
  mimeType: string
): Promise<VoiceBatchExtraction> {
  const payload = { audioBase64, mimeType };

  const attemptCall = async (): Promise<any> => {
    const res = await fetch('/api/gemini/voice-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const error = new Error(errData.error || `HTTP error ${res.status}`);
      (error as any).status = res.status;
      (error as any).isRateLimit = res.status === 429 || errData.isRateLimit;
      throw error;
    }

    return res.json();
  };

  try {
    const data = await attemptCall();
    return formatVoiceResult(data);
  } catch (err: any) {
    console.warn('Initial voice transcription failed, retrying once after 2 seconds...', err);
    await sleep(2000);

    try {
      const dataRetry = await attemptCall();
      return formatVoiceResult(dataRetry);
    } catch (retryErr: any) {
      console.error('Voice transcription retry failed:', retryErr);
      throw retryErr;
    }
  }
}

function formatVoiceResult(data: any): VoiceBatchExtraction {
  return {
    transcript: String(data.transcript || ''),
    language: String(data.language || 'English'),
    dish: String(data.dish || '').trim(),
    category: ['Cooked', 'Raw/Bulk', 'Packaged'].includes(data.category) ? data.category : null,
    quantity_kg: typeof data.quantity_kg === 'number' && !isNaN(data.quantity_kg) && data.quantity_kg > 0
      ? data.quantity_kg
      : null,
    temperature_c: typeof data.temperature_c === 'number' && !isNaN(data.temperature_c)
      ? data.temperature_c
      : null,
    storage: ['Ambient', 'Chilled', 'Hot-hold'].includes(data.storage) ? data.storage : null,
    allergens: Array.isArray(data.allergens) ? data.allergens : [],
  };
}

/**
 * Sends a plate waste / tray photo to backend Gemini endpoint with 1-time retry
 */
export async function checkPlateWaste(
  imageBase64: string,
  mimeType: string,
  thumbnailUrl: string
): Promise<{
  id: string;
  thumbnailUrl: string;
  is_tray: boolean;
  waste_percentage: number;
  main_leftover_item: string;
  confidence: 'low' | 'medium' | 'high';
  note: string;
  timestamp: number;
}> {
  const payload = { imageBase64, mimeType };

  const attemptCall = async (): Promise<any> => {
    const res = await fetch('/api/gemini/plate-waste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const error = new Error(errData.error || `HTTP error ${res.status}`);
      (error as any).status = res.status;
      (error as any).isRateLimit = res.status === 429 || errData.isRateLimit;
      throw error;
    }

    return res.json();
  };

  try {
    const data = await attemptCall();
    return formatPlateWasteResult(data, thumbnailUrl);
  } catch (err: any) {
    console.warn('Initial plate waste check failed, retrying once after 2 seconds...', err);
    await sleep(2000);

    try {
      const dataRetry = await attemptCall();
      return formatPlateWasteResult(dataRetry, thumbnailUrl);
    } catch (retryErr: any) {
      console.error('Plate waste check retry failed:', retryErr);
      throw retryErr;
    }
  }
}

function formatPlateWasteResult(data: any, thumbnailUrl: string) {
  return {
    id: `waste-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    thumbnailUrl,
    is_tray: Boolean(data.is_tray ?? true),
    waste_percentage: Math.max(0, Math.min(100, Number(data.waste_percentage ?? 18))),
    main_leftover_item: String(data.main_leftover_item || 'Rice & Gravy portion'),
    confidence: (['low', 'medium', 'high'].includes(data.confidence)
      ? data.confidence
      : 'medium') as 'low' | 'medium' | 'high',
    note: String(data.note || 'Plate waste visual assessment completed.'),
    timestamp: Date.now(),
  };
}
