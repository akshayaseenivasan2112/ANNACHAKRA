/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FoodBatch,
  StorageConfigMap,
  TemperatureReading,
  PhotoRuleSettings,
  PhotoFreshnessResult,
  LogisticsSettings,
  MatchWeights,
  DonorProfile,
  AppSettings,
  TrustLogEntry,
  HandoverRecord,
} from './types/batch';
import {
  DEFAULT_STORAGE_CONFIGS,
  DEFAULT_PHOTO_RULES,
  calculateBatchSpoilage,
} from './utils/spoilage';
import {
  DEFAULT_LOGISTICS_SETTINGS,
  DEFAULT_MATCH_WEIGHTS,
  DEMO_RECEIVERS,
} from './utils/matchEngine';
import {
  createOfficialDemoBatch,
  getSampleInitialBatches,
} from './utils/demoData';
import {
  DEFAULT_DEMO_SIGNING_KEY,
  getInitialSeedTrustLog,
  createLogEntry,
  computeEntryHash,
} from './utils/cryptoLog';
import { DEFAULT_DONOR_PROFILE, SettingsModal } from './components/SettingsModal';
import { Header } from './components/Header';
import { Tabs, TabId } from './components/Tabs';
import { FoodPassportForm } from './components/FoodPassportForm';
import { BatchCard } from './components/BatchCard';
import { CalculationExplainer } from './components/CalculationExplainer';
import { MatchTab } from './components/MatchTab';
import { HandoverTab } from './components/HandoverTab';
import { TrustLogTab } from './components/TrustLogTab';
import { PlanTab } from './components/PlanTab';
import { FactoryTab } from './components/FactoryTab';
import { ImpactTab } from './components/ImpactTab';
import { HomeTab } from './components/HomeTab';
import { ReadmeTab } from './components/ReadmeTab';
import { GuidedDemoBar, GUIDED_DEMO_STEPS } from './components/GuidedDemoBar';
import {
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Sparkles,
  Thermometer,
  Bot,
  Camera,
  HeartHandshake,
  FileCheck2,
  WifiOff,
} from 'lucide-react';

const LOCAL_STORAGE_BATCHES_KEY = 'annachakra_batches_v4';
const LOCAL_STORAGE_CONFIGS_KEY = 'annachakra_configs_v4';
const LOCAL_STORAGE_PHOTO_RULES_KEY = 'annachakra_photorules_v4';
const LOCAL_STORAGE_LOGISTICS_KEY = 'annachakra_logistics_v4';
const LOCAL_STORAGE_MATCH_WEIGHTS_KEY = 'annachakra_matchweights_v4';
const LOCAL_STORAGE_DONOR_KEY = 'annachakra_donor_v4';
const LOCAL_STORAGE_SETTINGS_KEY = 'annachakra_settings_v4';
const LOCAL_STORAGE_TRUST_LOG_KEY = 'annachakra_trustlog_v4';

const DEFAULT_APP_SETTINGS: AppSettings = {
  storageConfigs: DEFAULT_STORAGE_CONFIGS,
  photoRules: DEFAULT_PHOTO_RULES,
  matchWeights: DEFAULT_MATCH_WEIGHTS,
  logistics: DEFAULT_LOGISTICS_SETTINGS,
  donorProfile: DEFAULT_DONOR_PROFILE,
  alertCostEstimateRupees: 0.15,
  mealServingKg: 0.4,
  co2eFactorKg: 2.5,
  minHandoverHotTempC: 60,
  maxHandoverChilledTempC: 8,
  demoSigningKey: DEFAULT_DEMO_SIGNING_KEY,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('Batches');

  // Time warp simulation state: 1 (real-time), 60 (1 min/sec), 600 (10 min/sec)
  const [timeWarp, setTimeWarp] = useState<number>(1);
  const [simulatedTimeMs, setSimulatedTimeMs] = useState<number>(Date.now());

  // Arrhenius storage config state
  const [configs, setConfigs] = useState<StorageConfigMap>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CONFIGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse configs from localStorage', e);
    }
    return DEFAULT_STORAGE_CONFIGS;
  });

  // Photo Freshness Rules state
  const [photoRules, setPhotoRules] = useState<PhotoRuleSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PHOTO_RULES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse photoRules from localStorage', e);
    }
    return DEFAULT_PHOTO_RULES;
  });

  // Logistics buffer settings
  const [logistics, setLogistics] = useState<LogisticsSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_LOGISTICS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse logistics from localStorage', e);
    }
    return DEFAULT_LOGISTICS_SETTINGS;
  });

  // Match scoring factor weights
  const [matchWeights, setMatchWeights] = useState<MatchWeights>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_MATCH_WEIGHTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse matchWeights from localStorage', e);
    }
    return DEFAULT_MATCH_WEIGHTS;
  });

  // Donor profile & FSSAI state
  const [donorProfile, setDonorProfile] = useState<DonorProfile>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DONOR_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse donor profile from localStorage', e);
    }
    return DEFAULT_DONOR_PROFILE;
  });

  // Global application settings (FSSAI, WhatsApp cost, carbon conversion, etc.)
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse settings from localStorage', e);
    }
    return {
      ...DEFAULT_APP_SETTINGS,
      donorProfile,
      storageConfigs: configs,
      photoRules,
      matchWeights,
      logistics,
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Batches state initialized from localStorage or initial demo set
  const [batches, setBatches] = useState<FoodBatch[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_BATCHES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse batches from localStorage', e);
    }
    return getSampleInitialBatches(Date.now());
  });

  // Cryptographic Trust Log state (SHA-256 Hash Chain)
  const [trustLog, setTrustLog] = useState<TrustLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_TRUST_LOG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse trust log from localStorage', e);
    }
    return [];
  });

  // Initialize seed trust log if empty
  useEffect(() => {
    if (trustLog.length === 0) {
      getInitialSeedTrustLog(settings.demoSigningKey, Date.now() - 3600 * 1000).then((seed) => {
        setTrustLog(seed);
      });
    }
  }, []);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Persistence to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_BATCHES_KEY, JSON.stringify(batches));
    } catch (e) {
      console.error('Failed to save batches to localStorage', e);
    }
  }, [batches]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CONFIGS_KEY, JSON.stringify(configs));
    } catch (e) {
      console.error('Failed to save configs to localStorage', e);
    }
  }, [configs]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PHOTO_RULES_KEY, JSON.stringify(photoRules));
    } catch (e) {
      console.error('Failed to save photoRules to localStorage', e);
    }
  }, [photoRules]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_LOGISTICS_KEY, JSON.stringify(logistics));
    } catch (e) {
      console.error('Failed to save logistics to localStorage', e);
    }
  }, [logistics]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_MATCH_WEIGHTS_KEY, JSON.stringify(matchWeights));
    } catch (e) {
      console.error('Failed to save matchWeights to localStorage', e);
    }
  }, [matchWeights]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_DONOR_KEY, JSON.stringify(donorProfile));
    } catch (e) {
      console.error('Failed to save donorProfile to localStorage', e);
    }
  }, [donorProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_TRUST_LOG_KEY, JSON.stringify(trustLog));
    } catch (e) {
      console.error('Failed to save trustLog to localStorage', e);
    }
  }, [trustLog]);

  // Synchronize composite settings when sub-configs change
  useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      storageConfigs: configs,
      photoRules,
      matchWeights,
      logistics,
      donorProfile,
    }));
  }, [configs, photoRules, matchWeights, logistics, donorProfile]);

  // Clock tick timer: updates every 1000ms real time
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedTimeMs((prev) => prev + 1000 * timeWarp);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeWarp]);

  // Appends verified cryptographic entry to Trust Log
  const appendTrustLog = useCallback(
    async (
      eventType: TrustLogEntry['eventType'],
      actor: TrustLogEntry['actor'],
      batchId: string,
      dishName: string,
      payload: Record<string, any>
    ) => {
      try {
        const newEntry = await createLogEntry(
          trustLog,
          eventType,
          actor,
          batchId,
          dishName,
          payload,
          settings.demoSigningKey,
          simulatedTimeMs
        );
        setTrustLog((prev) => [...prev, newEntry]);
      } catch (err) {
        console.error('Failed to append trust log entry', err);
      }
    },
    [trustLog, settings.demoSigningKey, simulatedTimeMs]
  );

  const handleAdvanceHours = useCallback((hours: number) => {
    setSimulatedTimeMs((prev) => prev + hours * 3600 * 1000);
  }, []);

  const handleTimeWarpChange = useCallback((speed: number) => {
    setTimeWarp(speed);
  }, []);

  const handleReset = useCallback(async () => {
    const now = Date.now();
    setSimulatedTimeMs(now);
    setTimeWarp(1);
    const demoBatches = getSampleInitialBatches(now);
    setBatches(demoBatches);
    const seed = await getInitialSeedTrustLog(settings.demoSigningKey, now - 3600 * 1000);
    setTrustLog(seed);
  }, [settings.demoSigningKey]);

  const handleCreateBatch = useCallback(
    (newBatch: FoodBatch) => {
      setBatches((prev) => [newBatch, ...prev]);
      appendTrustLog(
        'BATCH_CREATED',
        'donor',
        newBatch.id,
        newBatch.dishName,
        {
          quantityKg: newBatch.quantityKg,
          category: newBatch.category,
          storageType: newBatch.storageType,
          initialTempC: newBatch.initialTempC,
          allergens: newBatch.allergens,
          preparedTime: newBatch.preparedTime,
          fssaiNumber: donorProfile.fssaiNumber,
        }
      );
    },
    [appendTrustLog, donorProfile.fssaiNumber]
  );

  const handleLoadDemoBatch = useCallback(() => {
    const demo = createOfficialDemoBatch(simulatedTimeMs);
    setBatches((prev) => [demo, ...prev]);
    appendTrustLog(
      'BATCH_CREATED',
      'donor',
      demo.id,
      demo.dishName,
      {
        quantityKg: demo.quantityKg,
        category: demo.category,
        storageType: demo.storageType,
        initialTempC: demo.initialTempC,
        allergens: demo.allergens,
        preparedTime: demo.preparedTime,
        fssaiNumber: donorProfile.fssaiNumber,
        isDemoSeed: true,
      }
    );
  }, [simulatedTimeMs, appendTrustLog, donorProfile.fssaiNumber]);

  const handleAddReading = useCallback((batchId: string, reading: TemperatureReading) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id !== batchId) return b;
        return {
          ...b,
          readings: [...(b.readings || []), reading],
        };
      })
    );
  }, []);

  const handleDeleteReading = useCallback((batchId: string, readingId: string) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id !== batchId) return b;
        return {
          ...b,
          readings: b.readings.filter((r) => r.id !== readingId),
        };
      })
    );
  }, []);

  const handleDeleteBatch = useCallback((batchId: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== batchId));
  }, []);

  const handleUpdateBatchPhoto = useCallback(
    (batchId: string, photo: PhotoFreshnessResult | null) => {
      setBatches((prev) =>
        prev.map((b) => {
          if (b.id !== batchId) return b;
          return {
            ...b,
            photoResult: photo,
          };
        })
      );
      if (photo) {
        const batch = batches.find((b) => b.id === batchId);
        appendTrustLog(
          'PHOTO_CHECK',
          'system',
          batchId,
          batch?.dishName || 'Food Item',
          {
            freshnessScore: photo.freshness_score,
            confidence: photo.confidence,
            visibleIssues: photo.visible_issues,
            note: photo.note,
            foodIdentified: photo.food_identified,
            isManualScore: !!photo.isManualScore,
          }
        );
      }
    },
    [batches, appendTrustLog]
  );

  const handleUpdateBatchDispatchOffer = useCallback(
    (
      batchId: string,
      offer: {
        receiverId: string;
        receiverName: string;
        status: 'offered' | 'accepted' | 'declined' | 'timeout' | 'handed_over';
        timestamp: number;
        pickupCode?: string;
      } | null
    ) => {
      setBatches((prev) =>
        prev.map((b) => {
          if (b.id !== batchId) return b;
          return {
            ...b,
            dispatchOffer: offer,
          };
        })
      );
      if (offer && offer.status === 'offered') {
        const batch = batches.find((b) => b.id === batchId);
        appendTrustLog(
          'OFFER_SENT',
          'donor',
          batchId,
          batch?.dishName || 'Food Item',
          {
            receiverId: offer.receiverId,
            receiverName: offer.receiverName,
            status: offer.status,
            fssaiNumber: donorProfile.fssaiNumber,
          }
        );
      }
    },
    [batches, appendTrustLog, donorProfile.fssaiNumber]
  );

  // Offer action handlers
  const handleAcceptOffer = useCallback(
    (batchId: string, receiverId: string, pickupCode?: string) => {
      const code = pickupCode || Math.floor(1000 + Math.random() * 9000).toString();
      const receiver = DEMO_RECEIVERS.find((r) => r.id === receiverId);
      const receiverName = receiver?.name || 'Verified NGO';

      setBatches((prev) =>
        prev.map((b) => {
          if (b.id !== batchId) return b;
          return {
            ...b,
            dispatchOffer: {
              receiverId,
              receiverName,
              status: 'accepted',
              timestamp: simulatedTimeMs,
              pickupCode: code,
              acceptedAtTimestamp: simulatedTimeMs,
            },
          };
        })
      );

      const targetBatch = batches.find((b) => b.id === batchId);
      appendTrustLog(
        'OFFER_ACCEPTED',
        'receiver',
        batchId,
        targetBatch?.dishName || 'Food Item',
        {
          receiverId,
          receiverName,
          pickupCodeGenerated: code,
          expectedPickupMinutes: receiver?.driveMinutes || 15,
          timestamp: simulatedTimeMs,
        }
      );
    },
    [batches, simulatedTimeMs, appendTrustLog]
  );

  const handleDeclineOffer = useCallback(
    (batchId: string, receiverId: string, reason: string = 'Capacity full') => {
      const receiver = DEMO_RECEIVERS.find((r) => r.id === receiverId);
      const targetBatch = batches.find((b) => b.id === batchId);

      appendTrustLog(
        'OFFER_DECLINED',
        'receiver',
        batchId,
        targetBatch?.dishName || 'Food Item',
        {
          receiverId,
          receiverName: receiver?.name || 'NGO Partner',
          reason,
          timestamp: simulatedTimeMs,
        }
      );
    },
    [batches, simulatedTimeMs, appendTrustLog]
  );

  const handleTimeoutOffer = useCallback(
    (batchId: string, receiverId: string) => {
      const receiver = DEMO_RECEIVERS.find((r) => r.id === receiverId);
      const targetBatch = batches.find((b) => b.id === batchId);

      appendTrustLog(
        'OFFER_TIMEOUT',
        'system',
        batchId,
        targetBatch?.dishName || 'Food Item',
        {
          receiverId,
          receiverName: receiver?.name || 'NGO Partner',
          autoEscalated: true,
          timestamp: simulatedTimeMs,
        }
      );
    },
    [batches, simulatedTimeMs, appendTrustLog]
  );

  const handleConfirmHandover = useCallback(
    (batchId: string, record: HandoverRecord) => {
      setBatches((prev) =>
        prev.map((b) => {
          if (b.id !== batchId) return b;
          return {
            ...b,
            dispatchOffer: {
              ...(b.dispatchOffer || {
                receiverId: record.receiverId,
                receiverName: record.receiverName,
                timestamp: record.timestamp,
              }),
              status: 'handed_over',
              handoverRecord: record,
            },
          };
        })
      );

      const targetBatch = batches.find((b) => b.id === batchId);
      if (record.isOverride) {
        appendTrustLog(
          'OVERRIDE_RECORDED',
          'donor',
          batchId,
          targetBatch?.dishName || 'Food Item',
          {
            handoverTempC: record.temperatureC,
            overrideReason: record.overrideReason,
            operatorName: donorProfile.contactPerson,
            timestamp: simulatedTimeMs,
          }
        );
      }

      appendTrustLog(
        'HANDOVER_CONFIRMED',
        'donor',
        batchId,
        targetBatch?.dishName || 'Food Item',
        {
          handoverId: record.handoverId,
          receiverId: record.receiverId,
          receiverName: record.receiverName,
          handoverTempC: record.temperatureC,
          pickupCodeUsed: record.pickupCodeUsed,
          isOverride: record.isOverride,
          overrideReason: record.overrideReason || 'Normal within-limit handover',
          confirmedByHuman: true,
          fssaiNumber: donorProfile.fssaiNumber,
          quantityKg: targetBatch?.quantityKg || 0,
          withinSafeWindow: !record.isOverride,
          timestamp: simulatedTimeMs,
        }
      );
    },
    [batches, donorProfile, simulatedTimeMs, appendTrustLog]
  );

  // Trust Log Tamper & Restore simulation
  const handleTamperLog = useCallback(
    (entryIndex: number, field: string, newVal: any) => {
      setTrustLog((prev) =>
        prev.map((entry) => {
          if (entry.index !== entryIndex) return entry;
          return {
            ...entry,
            isTampered: true,
            tamperedField: field,
            originalPayload: entry.originalPayload || { ...entry.payload },
            payload: {
              ...entry.payload,
              [field]: newVal,
            },
          };
        })
      );
    },
    []
  );

  const handleRestoreLog = useCallback(() => {
    setTrustLog((prev) =>
      prev.map((entry) => {
        if (!entry.isTampered) return entry;
        return {
          ...entry,
          payload: entry.originalPayload || entry.payload,
          isTampered: false,
          tamperedField: undefined,
          originalPayload: undefined,
        };
      })
    );
  }, []);

  const handleResetLog = useCallback(async () => {
    const seed = await getInitialSeedTrustLog(settings.demoSigningKey, simulatedTimeMs - 3600 * 1000);
    setTrustLog(seed);
  }, [settings.demoSigningKey, simulatedTimeMs]);

  const handleRouteStockToMatch = useCallback(
    (stockBatch: FoodBatch) => {
      setBatches((prev) => [stockBatch, ...prev]);
      appendTrustLog(
        'BATCH_CREATED',
        'donor',
        stockBatch.id,
        stockBatch.dishName,
        {
          quantityKg: stockBatch.quantityKg,
          category: stockBatch.category,
          source: 'Factory Stock Lot #BF-2026-088',
          note: 'Near-date stock routed to cascade redistribution',
          fssaiNumber: donorProfile.fssaiNumber,
        }
      );
      setActiveTab('Match');
    },
    [appendTrustLog, donorProfile.fssaiNumber]
  );

  const handleStorageTempBreachLog = useCallback(
    (tempC: number) => {
      appendTrustLog(
        'OVERRIDE_RECORDED',
        'system',
        'cold-storage-excursion',
        'Cold-Room Storage Probe',
        {
          event: 'COLD_STORAGE_TEMPERATURE_BREACH',
          measuredTempC: tempC,
          thresholdLimitC: 24.0,
          actionRequired: 'Inspect refrigeration condensing unit and log supervisor override',
          timestamp: simulatedTimeMs,
        }
      );
    },
    [appendTrustLog, simulatedTimeMs]
  );

  // Filtered and sorted batches
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchesSearch =
        !searchQuery.trim() ||
        b.dishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.storageType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.allergens && b.allergens.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase())));

      if (!matchesSearch) return false;

      if (categoryFilter !== 'ALL' && b.category !== categoryFilter) {
        return false;
      }

      if (statusFilter !== 'ALL') {
        const spoilage = calculateBatchSpoilage(b, simulatedTimeMs, configs, photoRules);
        if (spoilage.status !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [batches, searchQuery, categoryFilter, statusFilter, simulatedTimeMs, configs, photoRules]);

  // Overview stats calculation
  const stats = useMemo(() => {
    let totalKg = 0;
    let safeCount = 0;
    let urgentCount = 0;
    let unsafeCount = 0;
    let sumMkt = 0;
    let photoCount = 0;
    let offeredCount = 0;
    let acceptedCount = 0;

    batches.forEach((b) => {
      totalKg += b.quantityKg || 0;
      const res = calculateBatchSpoilage(b, simulatedTimeMs, configs, photoRules);
      sumMkt += res.meanKineticTempC;
      if (b.photoResult) photoCount++;
      if (b.dispatchOffer) offeredCount++;
      if (b.dispatchOffer?.status === 'accepted') acceptedCount++;
      if (res.status === 'Safe') safeCount++;
      else if (res.status === 'Urgent') urgentCount++;
      else if (res.status === 'Unsafe: never offer as food') unsafeCount++;
    });

    const avgMkt = batches.length > 0 ? (sumMkt / batches.length).toFixed(1) : '—';

    return {
      totalKg: Math.round(totalKg),
      totalBatches: batches.length,
      safeCount,
      urgentCount,
      unsafeCount,
      avgMkt,
      photoCount,
      offeredCount,
      acceptedCount,
    };
  }, [batches, simulatedTimeMs, configs, photoRules]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF9] text-[#1E293B]">
      
      {/* Top Header */}
      <Header
        timeWarp={timeWarp}
        onTimeWarpChange={handleTimeWarpChange}
        onReset={handleReset}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onAdvanceHours={handleAdvanceHours}
        simulatedTimeMs={simulatedTimeMs}
      />

      {/* Tabs Navigation */}
      <Tabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        batchCount={batches.length}
        activeHandoverCount={stats.acceptedCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Plan Tab (Predict: Demand Forecasting & Sizing) */}
        {activeTab === 'Plan' && (
          <PlanTab
            onSeedBatchToPassport={handleCreateBatch}
            onSwitchToBatches={() => setActiveTab('Batches')}
          />
        )}

        {/* Batches Tab */}
        {activeTab === 'Batches' && (
          <div className="space-y-6">
            
            {/* Real-time KPI Stats Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span>Tracked Food</span>
                  <Scale className="w-4 h-4 text-[#0F5132]" />
                </div>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono">
                    {stats.totalKg}
                  </span>
                  <span className="text-xs font-bold text-gray-400">kg across {stats.totalBatches} batches</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span>Active Safe</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">
                    {stats.safeCount}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600">&gt;50% safe life</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span>Urgent Action</span>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-red-600 font-mono">
                    {stats.urgentCount + stats.unsafeCount}
                  </span>
                  <span className="text-xs font-semibold text-red-500">
                    {stats.unsafeCount > 0 ? `(${stats.unsafeCount} unsafe)` : 'need dispatch'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span>Ready for Pickup</span>
                  <FileCheck2 className="w-4 h-4 text-[#D97706]" />
                </div>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#D97706] font-mono">
                    {stats.acceptedCount}
                  </span>
                  <span className="text-xs font-bold text-gray-400">waiting at desk</span>
                </div>
              </div>
            </div>

            {/* Time Warp Notice */}
            {timeWarp > 1 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-900 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D97706] shrink-0" />
                  <span>
                    <strong>Time Warp Active ({timeWarp}x):</strong> Every real second simulates{' '}
                    {timeWarp === 60 ? '1 minute' : '10 minutes'}. Watch countdown timers deplete in fast motion!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTimeWarp(1)}
                  className="px-2.5 py-1 text-xs font-bold bg-[#D97706] text-white rounded-lg hover:bg-amber-700 transition-colors shrink-0"
                >
                  Return to 1x Real Time
                </button>
              </div>
            )}

            {/* Food Passport Intake Form with Voice & Photo Freshness Check */}
            <FoodPassportForm
              onCreateBatch={handleCreateBatch}
              onLoadDemoBatch={handleLoadDemoBatch}
              simulatedTimeMs={simulatedTimeMs}
              photoRules={photoRules}
            />

            {/* Formula & Vision Rules Explainer (Collapsible) */}
            <CalculationExplainer />

            {/* Batches Header with Search & Filter */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-gray-900">Food Passports</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-200 text-gray-700">
                    {filteredBatches.length}
                  </span>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search dish, category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-1.5 text-xs bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white rounded-xl border border-gray-200 font-semibold"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Safe">Safe</option>
                    <option value="Use soon">Use soon</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Unsafe: never offer as food">Unsafe</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white rounded-xl border border-gray-200 font-semibold"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Cooked">Cooked</option>
                    <option value="Raw/Bulk">Raw / Bulk</option>
                    <option value="Packaged">Packaged</option>
                  </select>
                </div>
              </div>

              {/* Batches Grid */}
              {filteredBatches.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                  {filteredBatches.map((batch) => (
                    <BatchCard
                      key={batch.id}
                      batch={batch}
                      simulatedTimeMs={simulatedTimeMs}
                      configs={configs}
                      photoRules={photoRules}
                      onAddReading={handleAddReading}
                      onDeleteReading={handleDeleteReading}
                      onDeleteBatch={handleDeleteBatch}
                      onUpdateBatchPhoto={handleUpdateBatchPhoto}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-3xl border border-gray-200">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
                    <Filter className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-gray-800">No matching food batches</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    Try adjusting your search or status filter, or load the official demo batch to see the Spoilage Clock in action.
                  </p>
                  <button
                    type="button"
                    onClick={handleLoadDemoBatch}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>Load Demo Batch ("Vegetable curry")</span>
                  </button>
                </div>
              )}

            </div>

          </div>
        )}

        {/* Match Tab (Live Cascade Redistribution Engine & WhatsApp Alert) */}
        {activeTab === 'Match' && (
          <MatchTab
            batches={batches}
            simulatedTimeMs={simulatedTimeMs}
            configs={configs}
            photoRules={photoRules}
            donorProfile={donorProfile}
            matchWeights={matchWeights}
            logistics={logistics}
            onUpdateBatchDispatchOffer={handleUpdateBatchDispatchOffer}
            onAcceptOffer={handleAcceptOffer}
            onDeclineOffer={handleDeclineOffer}
            onTimeoutOffer={handleTimeoutOffer}
            onSwitchToBatches={() => setActiveTab('Batches')}
            onSwitchToHandover={() => setActiveTab('Handover')}
            onSwitchToTrustLog={() => setActiveTab('Trust Log')}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {/* Handover Tab (Dispatch Desk, 4-digit code, Core Temp Verification & Receipt) */}
        {activeTab === 'Handover' && (
          <HandoverTab
            batches={batches}
            donorProfile={donorProfile}
            settings={settings}
            simulatedTimeMs={simulatedTimeMs}
            trustLog={trustLog}
            onConfirmHandover={handleConfirmHandover}
            onAcceptOffer={handleAcceptOffer}
            onDeclineOffer={handleDeclineOffer}
            onSwitchToBatches={() => setActiveTab('Batches')}
            onSwitchToMatch={() => setActiveTab('Match')}
          />
        )}

        {/* Trust Log Tab (Prove: Cryptographic SHA-256 Hash Chain & Trust Score) */}
        {activeTab === 'Trust Log' && (
          <TrustLogTab
            trustLog={trustLog}
            donorProfile={donorProfile}
            batches={batches}
            onTamperLog={handleTamperLog}
            onRestoreLog={handleRestoreLog}
            onResetLog={handleResetLog}
            demoSigningKey={settings.demoSigningKey}
          />
        )}

        {/* Factory Tab (Learn: Line Telemetry & Anomaly Detection) */}
        {activeTab === 'Factory' && (
          <FactoryTab
            onRouteStockToMatch={handleRouteStockToMatch}
            onJumpToBatchPlanner={() => setActiveTab('Plan')}
            onStorageTempBreachLog={handleStorageTempBreachLog}
          />
        )}

        {/* Impact Tab (Prove: BRSR ESG Sustainability Analytics) */}
        {activeTab === 'Impact' && (
          <ImpactTab
            batches={batches}
            donorProfile={donorProfile}
            trustLog={trustLog}
            simulatedTimeMs={simulatedTimeMs}
          />
        )}

      </main>

      {/* Footer with required Gemini prototype note */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-6 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#0F5132]">AnnaChakra</span>
            <span>•</span>
            <span>Food Safety & Dynamic Spoilage Intelligence</span>
          </div>

          <div className="flex items-center gap-2 font-medium">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#0F5132] border border-emerald-200 font-semibold text-[11px]">
              <Bot className="w-3.5 h-3.5 text-[#D97706]" />
              Powered by Gemini (prototype)
            </span>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <span className="text-gray-400 text-[11px] hidden sm:inline">
              Arrhenius Kinetics & Mean Kinetic Temperature (MKT)
            </span>
          </div>
        </div>
      </footer>

      {/* Settings Modal (Arrhenius configs, photo vision rules, donor profile + FSSAI check, logistics) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        configs={configs}
        photoRules={photoRules}
        logistics={logistics}
        matchWeights={matchWeights}
        donorProfile={donorProfile}
        settings={settings}
        onSaveAllSettings={(newConfigs, newPhotoRules, newLogistics, newMatchWeights, newDonorProfile, newSettings) => {
          setConfigs(newConfigs);
          setPhotoRules(newPhotoRules);
          setLogistics(newLogistics);
          setMatchWeights(newMatchWeights);
          setDonorProfile(newDonorProfile);
          setSettings(newSettings);
        }}
        onResetConfigs={() => {
          setConfigs(DEFAULT_STORAGE_CONFIGS);
          setPhotoRules(DEFAULT_PHOTO_RULES);
          setLogistics(DEFAULT_LOGISTICS_SETTINGS);
          setMatchWeights(DEFAULT_MATCH_WEIGHTS);
          setDonorProfile(DEFAULT_DONOR_PROFILE);
          setSettings(DEFAULT_APP_SETTINGS);
        }}
      />

    </div>
  );
}
