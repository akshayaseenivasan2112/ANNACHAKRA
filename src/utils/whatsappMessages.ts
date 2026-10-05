/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AnnaChakra WhatsApp & SMS Alert Dispatch Formatter
 * 
 * Formats app-less alerts in English, Hindi, and Tamil for verified NGO receivers.
 */

import { FoodBatch, Receiver, SpoilageCalculationResult } from '../types/batch';
import { formatDateTime } from './spoilage';

export type AlertLanguage = 'en' | 'hi' | 'ta';

export function formatSafeUntilTime(batch: FoodBatch, spoilage: SpoilageCalculationResult): string {
  const safeUntilMs = Date.now() + Math.max(0, spoilage.safeHoursLeft) * 3600 * 1000;
  return formatDateTime(safeUntilMs);
}

/**
 * Builds the exact localized alert text for the receiver in English, Hindi, or Tamil
 */
export function generateWhatsAppMessage(
  donorName: string,
  batch: FoodBatch,
  receiver: Receiver,
  spoilage: SpoilageCalculationResult,
  language: AlertLanguage = 'en'
): string {
  const food = batch.dishName;
  const qty = batch.quantityKg;
  const category = batch.category;
  const allergens = batch.allergens && batch.allergens.length > 0
    ? batch.allergens.join(', ')
    : 'None';
  const prepTime = formatDateTime(batch.preparedTime);
  const currentTemp = spoilage.currentTempC;
  const safeUntil = formatSafeUntilTime(batch, spoilage);
  const dist = receiver.distanceKm;
  const minutes = receiver.driveMinutes;

  switch (language) {
    case 'hi':
      return `*अन्नचक्र खाद्य चेतावनी* (AnnaChakra Alert)\n\n` +
        `*${donorName}* के पास *${qty} kg* *${food}* (${category}) उपलब्ध है।\n` +
        `• एलर्जी कारक: ${allergens}\n` +
        `• तैयार समय: ${prepTime}\n` +
        `• पैकिंग तापमान: ${currentTemp} °C\n` +
        `• उपभोग हेतु सुरक्षित: ${safeUntil} तक\n` +
        `• पिकअप दूरी: ${dist} km, लगभग ${minutes} मिनट।\n\n` +
        `स्वीकार करने हेतु *1* (ACCEPT) या अस्वीकार हेतु *2* (DECLINE) का उत्तर दें।\n` +
        `_कृपया 15 मिनट के भीतर उत्तर दें।_`;

    case 'ta':
      return `*அன்னசக்ரா உணவு எச்சரிக்கை* (AnnaChakra Alert)\n\n` +
        `*${donorName}*-இடம் *${qty} kg* *${food}* (${category}) உள்ளது.\n` +
        `• ஒவ்வாமை (Allergens): ${allergens}\n` +
        `• சமைத்த நேரம்: ${prepTime}\n` +
        `• பேக்கிங் வெப்பநிலை: ${currentTemp} °C\n` +
        `• பரிமாற பாதுகாப்பான நேரம்: ${safeUntil}\n` +
        `• தொலைவு: ${dist} km, சுமார் ${minutes} நிமிடங்கள்.\n\n` +
        `ஏற்க *1* (ACCEPT) அல்லது நிராகரிக்க *2* (DECLINE) என பதிலளிக்கவும்.\n` +
        `_தயவுசெய்து 15 நிமிடங்களுக்குள் பதிலளிக்கவும்._`;

    case 'en':
    default:
      return `*AnnaChakra Food Safety Alert*\n\n` +
        `*${donorName}* has *${qty} kg* of *${food}* (${category}).\n` +
        `• Allergens: ${allergens}\n` +
        `• Prepared: ${prepTime}\n` +
        `• Temperature at packing: ${currentTemp} °C\n` +
        `• Safe to serve until: ${safeUntil}\n` +
        `• Pickup distance: ${dist} km, about ${minutes} min.\n\n` +
        `Reply *1* to ACCEPT or *2* to DECLINE.\n` +
        `_Please reply within 15 minutes._`;
  }
}

/**
 * Builds real wa.me link for direct browser/mobile opening
 */
export function buildWhatsAppWebLink(messageText: string, phoneNumber?: string): string {
  const cleanPhone = (phoneNumber || '').replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(messageText);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}
