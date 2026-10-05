/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AnnaChakra Trust Log Cryptographic Engine (Web Crypto API)
 * 
 * Implements tamper-evident SHA-256 hash chaining and HMAC-SHA-256
 * digital signatures for food safety provenance and FSSAI audit trails.
 */

import { TrustLogEntry } from '../types/batch';

export const DEFAULT_DEMO_SIGNING_KEY = 'ANNACHAKRA_SIH26234_ANANTA_SECRET_KEY';

/**
 * Converts ArrayBuffer to lowercase hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  let hexString = '';
  for (let i = 0; i < byteArray.length; i++) {
    hexString += byteArray[i].toString(16).padStart(2, '0');
  }
  return hexString;
}

/**
 * Computes canonical SHA-256 hash of log entry contents:
 * index + timestamp + eventType + actor + canonicalPayload + previousHash
 */
export async function computeEntryHash(
  index: number,
  timestamp: number,
  eventType: string,
  actor: string,
  payload: Record<string, any>,
  previousHash: string
): Promise<string> {
  // Sort payload keys for deterministic canonical JSON stringification
  const canonicalPayloadString = JSON.stringify(payload, Object.keys(payload).sort());
  const message = `${index}|${timestamp}|${eventType}|${actor}|${canonicalPayloadString}|${previousHash}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

/**
 * Computes HMAC-SHA-256 signature using the demo signing key
 */
export async function computeHmacSignature(
  hash: string,
  keyString: string = DEFAULT_DEMO_SIGNING_KEY
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyString);
  const messageData = encoder.encode(hash);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return bufferToHex(signatureBuffer);
}

/**
 * Creates and appends a verified cryptographic log entry to an existing chain
 */
export async function createLogEntry(
  existingChain: TrustLogEntry[],
  eventType: TrustLogEntry['eventType'],
  actor: TrustLogEntry['actor'],
  batchId: string,
  dishName: string,
  payload: Record<string, any>,
  signingKey: string = DEFAULT_DEMO_SIGNING_KEY,
  customTimestamp?: number
): Promise<TrustLogEntry> {
  const index = existingChain.length;
  const timestamp = customTimestamp || Date.now();
  const previousHash = index === 0 ? 'GENESIS' : existingChain[index - 1].hash;

  const hash = await computeEntryHash(
    index,
    timestamp,
    eventType,
    actor,
    payload,
    previousHash
  );

  const signature = await computeHmacSignature(hash, signingKey);

  return {
    index,
    timestamp,
    eventType,
    actor,
    batchId,
    dishName,
    payload,
    previousHash,
    hash,
    signature,
  };
}

export interface VerificationResult {
  isValid: boolean;
  brokenAtIndex: number | null;
  reason?: string;
  totalEntries: number;
}

/**
 * Recomputes and verifies the complete cryptographic hash chain from Genesis to tip
 */
export async function verifyTrustChain(
  chain: TrustLogEntry[]
): Promise<VerificationResult> {
  if (chain.length === 0) {
    return { isValid: true, brokenAtIndex: null, totalEntries: 0 };
  }

  for (let i = 0; i < chain.length; i++) {
    const entry = chain[i];

    // Check index sequencing
    if (entry.index !== i) {
      return {
        isValid: false,
        brokenAtIndex: i,
        reason: `Index mismatch: entry claims index #${entry.index} but is at position #${i}.`,
        totalEntries: chain.length,
      };
    }

    // Check previousHash link
    const expectedPrev = i === 0 ? 'GENESIS' : chain[i - 1].hash;
    if (entry.previousHash !== expectedPrev) {
      return {
        isValid: false,
        brokenAtIndex: i,
        reason: `Hash pointer broken: previousHash does not match hash of entry #${i - 1}.`,
        totalEntries: chain.length,
      };
    }

    // Recompute payload hash
    const recomputedHash = await computeEntryHash(
      entry.index,
      entry.timestamp,
      entry.eventType,
      entry.actor,
      entry.payload,
      entry.previousHash
    );

    if (recomputedHash !== entry.hash) {
      return {
        isValid: false,
        brokenAtIndex: i,
        reason: `Cryptographic hash mismatch at entry #${i}! Record payload was altered after hash generation.`,
        totalEntries: chain.length,
      };
    }
  }

  return {
    isValid: true,
    brokenAtIndex: null,
    totalEntries: chain.length,
  };
}

/**
 * Creates seed demo trust log entries for initial presentation
 */
export async function getInitialSeedTrustLog(
  signingKey: string = DEFAULT_DEMO_SIGNING_KEY,
  baseTime: number = Date.now() - 3600 * 1000
): Promise<TrustLogEntry[]> {
  const chain: TrustLogEntry[] = [];

  // Entry #0: Genesis batch creation
  const e0 = await createLogEntry(
    chain,
    'BATCH_CREATED',
    'donor',
    'batch-seed-001',
    'Vegetable curry',
    {
      quantityKg: 40,
      category: 'Cooked',
      storageType: 'Ambient',
      initialTempC: 28,
      allergens: ['None'],
      preparedTime: baseTime,
      fssaiNumber: '10020043000123',
    },
    signingKey,
    baseTime
  );
  chain.push(e0);

  // Entry #1: Photo check
  const e1 = await createLogEntry(
    chain,
    'PHOTO_CHECK',
    'system',
    'batch-seed-001',
    'Vegetable curry',
    {
      freshnessScore: 82,
      confidence: 'high',
      visibleIssues: ['none'],
      note: 'Verified fresh with consistent texture and steam sheen.',
    },
    signingKey,
    baseTime + 15 * 60 * 1000
  );
  chain.push(e1);

  // Entry #2: Paneer cold-chain batch created
  const e2 = await createLogEntry(
    chain,
    'BATCH_CREATED',
    'donor',
    'batch-seed-002',
    'Fresh Paneer Cubes (Cold Chain)',
    {
      quantityKg: 25,
      category: 'Cooked',
      storageType: 'Chilled',
      initialTempC: 4.5,
      allergens: ['Milk'],
      preparedTime: baseTime - 3600 * 1000,
      fssaiNumber: '10020043000123',
    },
    signingKey,
    baseTime + 20 * 60 * 1000
  );
  chain.push(e2);

  // Entry #3: Previous successful handover
  const e3 = await createLogEntry(
    chain,
    'HANDOVER_CONFIRMED',
    'donor',
    'batch-seed-002',
    'Fresh Paneer Cubes (Cold Chain)',
    {
      receiverName: 'Demo Shelter B',
      pickupCodeUsed: '3819',
      handoverTempC: 5.2,
      quantityKg: 25,
      operatorName: 'Chef Rajesh',
      withinSafeWindow: true,
      confirmedByHuman: true,
    },
    signingKey,
    baseTime + 45 * 60 * 1000
  );
  chain.push(e3);

  return chain;
}
