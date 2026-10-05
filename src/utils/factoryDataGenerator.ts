/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AnnaChakra Factory Processing-Unit Monitoring & Anomaly Engine (Learn)
 * 
 * Implements 14-day hourly telemetry simulation for a 10,000 packets/day biscuit plant,
 * statistical 3-sigma control chart anomaly detection, and actionable anomaly feed cards.
 */

import {
  HourlyFactoryRecord,
  AnomalyCard,
  ControlChartPoint,
  FactoryLiveSensorState,
} from '../types/planAndFactory';

/**
 * Generates 14 days of hourly line records (14 * 24 = 336 hours) with injected anomalies
 */
export function generateSyntheticFactoryLineData(referenceEpochMs: number = Date.now()): {
  records: HourlyFactoryRecord[];
  anomalies: AnomalyCard[];
} {
  const records: HourlyFactoryRecord[] = [];
  const oneHourMs = 3600 * 1000;
  const totalHours = 14 * 24; // 336 hours
  const startEpoch = referenceEpochMs - totalHours * oneHourMs;

  for (let h = 0; h < totalHours; h++) {
    const recordEpoch = startEpoch + h * oneHourMs;
    const dateObj = new Date(recordEpoch);
    const dateStr = dateObj.toISOString().slice(0, 10);
    const hour = dateObj.getHours();
    const dayIndex = Math.floor(h / 24); // 0 to 13
    const shift: 1 | 2 | 3 = hour >= 6 && hour < 14 ? 1 : hour >= 14 && hour < 22 ? 2 : 3;

    // Normal baseline parameters
    let lineSpeed = 500 + Math.round(Math.sin(h * 0.4) * 15); // packets/hr
    let flourIn = 125; // kg
    let flourUsed = 124 + Math.round(Math.cos(h * 0.3) * 1.5);
    let packetsOut = Math.round(flourUsed * 4); // ~500 packets (250g each)
    let powerKwh = 28 + Math.round(Math.sin(h * 0.2) * 2.5);
    let downtimeMinutes = Math.floor(Math.random() * 4); // 0-3 mins normal

    let isAnomaly = false;
    let anomalyType: HourlyFactoryRecord['anomalyType'] = undefined;
    let anomalyNote: string | undefined = undefined;

    // INJECTED ANOMALY 1: Day 11, hour 10 & 11 -> Packer speed drops to 300 pkts/hr (-40%)
    if (dayIndex === 11 && (hour === 10 || hour === 11)) {
      lineSpeed = 300;
      packetsOut = 300;
      downtimeMinutes = 22;
      isAnomaly = true;
      anomalyType = 'Downtime';
      anomalyNote = 'Packer speed dropped from 500 to 300 packets/hr (-40%) for 2 hours due to heating element jam.';
    }

    // INJECTED ANOMALY 2: Day 9, shift 2 (hour 16) -> Flour loss ~100 kg above normal (kneader spill)
    if (dayIndex === 9 && hour === 16) {
      flourIn = 230;
      flourUsed = 125; // 105 kg unaccounted loss!
      isAnomaly = true;
      anomalyType = 'Raw-material loss';
      anomalyNote = 'Flour loss 105 kg above normal shift threshold. Pneumatic valve hopper leakage.';
    }

    // INJECTED ANOMALY 3: Day 7, night shift (hour 2 & 3) -> Line idle but energy spike (48 kWh vs 12 kWh)
    if (dayIndex === 7 && (hour === 2 || hour === 3)) {
      lineSpeed = 0;
      packetsOut = 0;
      powerKwh = 48; // Idle power spike!
      downtimeMinutes = 60;
      isAnomaly = true;
      anomalyType = 'Energy waste';
      anomalyNote = 'Tunnel oven heaters left running at 48 kWh during scheduled sanitation pause.';
    }

    // INJECTED ANOMALY 4: Day 4, hour 14 -> Overproduction vs forecast
    if (dayIndex === 4 && hour === 14) {
      lineSpeed = 610;
      packetsOut = 620;
      isAnomaly = true;
      anomalyType = 'Overproduction';
      anomalyNote = 'Shift output exceeded daily quota by +24% (11,800 packets vs 9,500 planned).';
    }

    records.push({
      id: `h-rec-${h}`,
      timestamp: recordEpoch,
      dateStr,
      hour,
      shift,
      lineSpeedPacketsPerHour: lineSpeed,
      flourInKg: flourIn,
      flourUsedKg: flourUsed,
      packetsOut,
      powerKwh,
      downtimeMinutes,
      isAnomaly,
      anomalyType,
      anomalyNote,
    });
  }

  // Pre-seed official Anomaly Cards as specified in prompt
  const anomalies: AnomalyCard[] = [
    {
      id: 'anom-1',
      dateStr: records[11 * 24 + 10]?.dateStr || '2026-10-02',
      hourStr: '10:00 - 12:00 (Day 11)',
      type: 'Downtime',
      headline: 'Packer Line Speed Dropped to 300 pkts/hr (-40%)',
      description: 'Packer line dropped from 500 to 300 packets/hr (-40%) for 2 h. About 400 packets not produced.',
      estimatedLossRupees: 8000,
      estimatedLossKg: 100,
      suggestedAction: 'Check heating jaw thermocouple & recalibrate servo tension on pouch feed roller.',
      severity: 'warning',
    },
    {
      id: 'anom-2',
      dateStr: records[9 * 24 + 16]?.dateStr || '2026-09-30',
      hourStr: '16:00 Shift 2 (Day 9)',
      type: 'Raw-material loss',
      headline: 'Flour Loss 105 kg Above Shift Threshold',
      description: 'Hopper intake scale recorded 230 kg flour in with only 125 kg fed to dough kneader. 105 kg loss.',
      estimatedLossRupees: 3675, // @ Rs 35/kg flour
      estimatedLossKg: 105,
      suggestedAction: 'Inspect rotary airlock valve gasket and suction filter sleeve for tears.',
      severity: 'critical',
    },
    {
      id: 'anom-3',
      dateStr: records[7 * 24 + 2]?.dateStr || '2026-09-28',
      hourStr: '02:00 - 04:00 Night Shift (Day 7)',
      type: 'Energy waste',
      headline: 'Idle Energy Spike: 48 kWh during Scheduled Pause',
      description: 'Conveyor line was fully stopped for sanitization, but tunnel oven preheaters drew 48 kWh (4x normal idle 12 kWh).',
      estimatedLossRupees: 2880, // @ Rs 8/kWh
      estimatedLossKg: 0,
      suggestedAction: 'Automate idle thermostat setback via PLC contactor trigger after 15 min stoppage.',
      severity: 'warning',
    },
    {
      id: 'anom-4',
      dateStr: records[4 * 24 + 14]?.dateStr || '2026-09-25',
      hourStr: '14:00 (Day 4)',
      type: 'Overproduction',
      headline: 'Overproduction vs Demand Quota (+24%)',
      description: 'Line produced 11,800 packets against a forecasted distributor quota of 9,500 packets (+2,300 surplus packets).',
      estimatedLossRupees: 18400,
      estimatedLossKg: 575,
      suggestedAction: 'Connect batch planner directly to packing line PLC counter to auto-throttle upon reaching quota.',
      severity: 'warning',
    },
    {
      id: 'anom-5',
      dateStr: 'Active Today',
      hourStr: 'Lot #BF-2026-088',
      type: 'Near-date stock',
      headline: 'Stock Lot #BF-2026-088 Nearing Best-Before Date (48h left)',
      description: '350 kg of Premium Glucose & Butter Biscuits in cold warehouse approaching secondary distribution threshold.',
      estimatedLossRupees: 24500,
      estimatedLossKg: 350,
      suggestedAction: 'Route immediately via Cascade Redistribution (secondary buyer T3 discount or NGO donation T2).',
      severity: 'critical',
      stockPayload: {
        lotNumber: 'Lot #BF-2026-088',
        productName: 'Glucose & Butter Biscuits (350 kg)',
        quantityKg: 350,
        category: 'Packaged',
        bestBeforeHours: 48,
      },
    },
  ];

  return { records, anomalies };
}

/**
 * Computes statistical 3-sigma control chart points for packing line speed
 */
export function computeControlChartPoints(records: HourlyFactoryRecord[]): ControlChartPoint[] {
  // Let's sample the last 48 hours for high-contrast readable chart
  const recentRecords = records.slice(-48);
  const values = recentRecords.map((r) => r.lineSpeedPacketsPerHour);

  // Mean
  const mean = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  // Standard deviation
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const upperControlLimit = Math.round(mean + 3 * stdDev);
  const lowerControlLimit = Math.max(0, Math.round(mean - 3 * stdDev));

  return recentRecords.map((r, idx) => {
    const val = r.lineSpeedPacketsPerHour;
    // Anomaly if beyond 3 sigma or explicit downtime
    const isAnomaly = val < lowerControlLimit || val > upperControlLimit || r.isAnomaly || false;

    return {
      index: idx,
      label: `H${r.hour}:00`,
      value: val,
      mean,
      upperControlLimit,
      lowerControlLimit,
      isAnomaly,
      anomalyType: r.anomalyType,
    };
  });
}

/**
 * Simulated live sensor telemetry generator that fluctuates slightly every few seconds
 */
export function getSimulatedSensorState(previous?: FactoryLiveSensorState): FactoryLiveSensorState {
  const baseTemp = 19.4;
  const baseSpeed = 502;
  const basePower = 27.8;
  const baseFlour = 4180;

  const tempJitter = (Math.random() - 0.48) * 0.4;
  const speedJitter = Math.round((Math.random() - 0.5) * 8);
  const powerJitter = (Math.random() - 0.5) * 1.2;
  const flourJitter = -Math.round(Math.random() * 2);

  const storageTempC = Math.round((previous ? previous.storageTempC + tempJitter : baseTemp) * 10) / 10;
  const lineSpeed = Math.max(0, (previous ? previous.lineSpeedPacketsPerHour + speedJitter : baseSpeed));
  const powerDraw = Math.round((previous ? previous.powerDrawKw + powerJitter : basePower) * 10) / 10;
  const flourStock = Math.max(1000, (previous ? previous.flourStockKg + flourJitter : baseFlour));

  return {
    storageTempC: Math.min(27.5, Math.max(16.0, storageTempC)),
    storageHumidityPercent: 52 + Math.round((Math.random() - 0.5) * 2),
    lineSpeedPacketsPerHour: lineSpeed,
    machineStatus: lineSpeed < 350 ? 'Speed Throttled' : 'Normal Running',
    powerDrawKw: powerDraw,
    flourStockKg: flourStock,
    activeLotId: 'LOT-2026-OCT-094',
    lastUpdated: Date.now(),
  };
}
