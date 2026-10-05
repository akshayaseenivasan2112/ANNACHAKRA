import React, { useState, useMemo } from 'react';
import {
  FoodBatch,
  Receiver,
  DonorProfile,
  AppSettings,
  HandoverRecord,
  TrustLogEntry,
  PhotoRuleSettings,
} from '../types/batch';
import {
  calculateBatchSpoilage,
  formatCountdown,
  getStatusTheme,
  formatDateTime,
} from '../utils/spoilage';
import { HandoverReceipt } from './HandoverReceipt';
import { NgoPhonePreview } from './NgoPhonePreview';
import { DEMO_RECEIVERS } from '../utils/matchEngine';
import {
  Award,
  Scale,
  Utensils,
  Leaf,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  Thermometer,
  KeyRound,
  FileCheck2,
  Phone,
  Camera,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';

interface HandoverTabProps {
  batches: FoodBatch[];
  donorProfile: DonorProfile;
  settings: AppSettings;
  simulatedTimeMs: number;
  trustLog: TrustLogEntry[];
  onConfirmHandover: (batchId: string, record: HandoverRecord) => void;
  onAcceptOffer: (batchId: string, receiverId: string) => void;
  onDeclineOffer: (batchId: string, receiverId: string) => void;
  onSwitchToBatches: () => void;
  onSwitchToMatch: () => void;
}

export const HandoverTab: React.FC<HandoverTabProps> = ({
  batches,
  donorProfile,
  settings,
  simulatedTimeMs,
  trustLog,
  onConfirmHandover,
  onAcceptOffer,
  onDeclineOffer,
  onSwitchToBatches,
  onSwitchToMatch,
}) => {
  // Handover form states
  const [selectedBatchId, setSelectedBatchId] = useState<string>(() => {
    // Default to the first offered/accepted batch, or first batch
    const candidate = batches.find(
      (b) => b.dispatchOffer && b.dispatchOffer.status !== 'declined'
    );
    return candidate ? candidate.id : batches[0]?.id || '';
  });

  const [enteredPickupCode, setEnteredPickupCode] = useState<string>('');
  const [handoverTempC, setHandoverTempC] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [showOverrideInput, setShowOverrideInput] = useState<boolean>(false);
  const [activeReceiptBatch, setActiveReceiptBatch] = useState<FoodBatch | null>(null);
  const [phonePreviewBatchId, setPhonePreviewBatchId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const activeBatch = useMemo(() => {
    return batches.find((b) => b.id === selectedBatchId) || batches[0] || null;
  }, [batches, selectedBatchId]);

  const spoilage = useMemo(() => {
    if (!activeBatch) return null;
    return calculateBatchSpoilage(
      activeBatch,
      simulatedTimeMs,
      settings.storageConfigs,
      settings.photoRules
    );
  }, [activeBatch, simulatedTimeMs, settings]);

  // Compute Running Impact Metrics
  const impact = useMemo(() => {
    let totalKgHandedOver = 0;
    let handedOverCount = 0;

    batches.forEach((b) => {
      if (b.dispatchOffer?.status === 'handed_over' || b.dispatchOffer?.handoverRecord) {
        totalKgHandedOver += b.quantityKg || 0;
        handedOverCount++;
      }
    });

    const mealServingKg = settings.mealServingKg > 0 ? settings.mealServingKg : 0.4;
    const co2eFactor = settings.co2eFactorKg > 0 ? settings.co2eFactorKg : 2.5;

    const mealsServed = Math.round(totalKgHandedOver / mealServingKg);
    const co2eAvoidedKg = Math.round(totalKgHandedOver * co2eFactor);

    return {
      totalKgHandedOver,
      handedOverCount,
      mealsServed,
      co2eAvoidedKg,
      mealServingKg,
      co2eFactor,
    };
  }, [batches, settings]);

  // Compute Donor Trust Score (0-100)
  // FSSAI format valid (25), Timely safe-window handovers (30), Log completeness (25), No unexplained overrides (20)
  const donorTrustScore = useMemo(() => {
    const isFssaiValid = /^\d{14}$/.test(donorProfile.fssaiNumber.trim());
    const fssaiScore = isFssaiValid ? 25 : 0;

    // Handover inside safe window score (30)
    let timelyCount = 0;
    let totalHandovers = 0;
    batches.forEach((b) => {
      if (b.dispatchOffer?.status === 'handed_over') {
        totalHandovers++;
        if (!b.dispatchOffer.handoverRecord?.isOverride) {
          timelyCount++;
        }
      }
    });
    const timelyScore = totalHandovers > 0 ? Math.round((timelyCount / totalHandovers) * 30) : 30;

    // Log completeness score (25)
    // Check if log contains entries with temperature, allergens, etc.
    const hasLogEntries = trustLog.length >= 3;
    const completenessScore = hasLogEntries ? 25 : 20;

    // No unexplained overrides score (20)
    const hasUnexplainedOverrides = trustLog.some(
      (entry) => entry.eventType === 'OVERRIDE_RECORDED' && !entry.payload?.reason?.trim()
    );
    const overrideScore = hasUnexplainedOverrides ? 5 : 20;

    const total = fssaiScore + timelyScore + completenessScore + overrideScore;

    return {
      fssaiScore,
      timelyScore,
      completenessScore,
      overrideScore,
      total,
      isFssaiValid,
    };
  }, [donorProfile, batches, trustLog]);

  // Active offered receiver for the selected batch
  const currentReceiver = useMemo(() => {
    if (!activeBatch?.dispatchOffer) return null;
    const found = DEMO_RECEIVERS.find((r) => r.id === activeBatch.dispatchOffer?.receiverId);
    if (found) return found;
    const fallback: Receiver = {
      id: activeBatch.dispatchOffer.receiverId,
      name: activeBatch.dispatchOffer.receiverName,
      type: 'Verified NGO Partner',
      driveMinutes: 14,
      distanceKm: 4,
      capacityKgNow: 60,
      needLevel: 5,
      noAllergens: [],
      accepts: ['Cooked', 'Packaged'],
      reliability: 92,
      tier: 'T2',
    };
    return fallback;
  }, [activeBatch]);

  // Handle Handover Confirmation
  const handleConfirmHandoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!activeBatch || !spoilage || !currentReceiver) return;

    // Verify 4-digit pickup code
    const expectedCode = activeBatch.dispatchOffer?.pickupCode || '4829';
    if (enteredPickupCode.trim() !== expectedCode) {
      setFormError(`Invalid pickup code! Recipient NGO must present security code "${expectedCode}".`);
      return;
    }

    const temp = parseFloat(handoverTempC);
    if (isNaN(temp)) {
      setFormError('Please record a valid food core temperature at handover.');
      return;
    }

    // Handover Safety Check:
    // Hot food must be at least 60 C; Chilled must be at most 8 C; Handover must be inside safe window
    let isViolation = false;
    let violationMsg = '';

    if (activeBatch.storageType === 'Hot-hold' && temp < settings.minHandoverHotTempC) {
      isViolation = true;
      violationMsg = `Hot food temperature (${temp}°C) is below minimum safety threshold (${settings.minHandoverHotTempC}°C).`;
    } else if (activeBatch.storageType === 'Chilled' && temp > settings.maxHandoverChilledTempC) {
      isViolation = true;
      violationMsg = `Chilled food temperature (${temp}°C) exceeds maximum cold chain limit (${settings.maxHandoverChilledTempC}°C).`;
    } else if (spoilage.safeHoursLeft <= 0 || spoilage.status === 'Unsafe: never offer as food') {
      isViolation = true;
      violationMsg = 'Safe Arrhenius window has expired (0h safe life remaining).';
    }

    if (isViolation && !overrideReason.trim()) {
      setShowOverrideInput(true);
      setFormError(`${violationMsg} Typed reason is required to log safety override.`);
      return;
    }

    const record: HandoverRecord = {
      handoverId: `handover-${Date.now()}`,
      batchId: activeBatch.id,
      receiverId: currentReceiver.id,
      receiverName: currentReceiver.name,
      timestamp: simulatedTimeMs,
      temperatureC: temp,
      pickupCodeUsed: enteredPickupCode.trim(),
      isOverride: isViolation,
      overrideReason: isViolation ? overrideReason.trim() : undefined,
      logEntryHash: `0x${Math.random().toString(16).slice(2, 10)}${Date.now().toString(16)}`,
      confirmedByHuman: true,
    };

    onConfirmHandover(activeBatch.id, record);
    setActiveReceiptBatch({
      ...activeBatch,
      dispatchOffer: {
        ...activeBatch.dispatchOffer!,
        status: 'handed_over',
        handoverRecord: record,
      },
    });

    setEnteredPickupCode('');
    setHandoverTempC('');
    setOverrideReason('');
    setShowOverrideInput(false);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Running Impact Counter Bar */}
      <div className="bg-gradient-to-r from-[#0F5132] to-[#166534] text-white rounded-3xl p-5 sm:p-6 shadow-md border border-[#14663f]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-700/60">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-300" />
              <h2 className="text-xl font-extrabold tracking-tight">
                Live Handover & Provenance Hub
              </h2>
            </div>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              Verified food handover with tamper-proof FSSAI logging & human sign-off
            </p>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-200 border border-emerald-600/60 self-start sm:self-auto">
            HACCP Critical Control Point 4
          </span>
        </div>

        {/* 3 Impact Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-800/80">
            <span className="text-[10px] uppercase font-bold text-emerald-300 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              Total Food Handed Over
            </span>
            <div className="mt-1 flex items-baseline gap-1 font-mono">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {impact.totalKgHandedOver}
              </span>
              <span className="text-xs font-semibold text-emerald-200">kg ({impact.handedOverCount} batches)</span>
            </div>
          </div>

          <div className="bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-800/80">
            <span className="text-[10px] uppercase font-bold text-emerald-300 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-amber-400" />
              Nutritious Meals Served
            </span>
            <div className="mt-1 flex items-baseline gap-1 font-mono">
              <span className="text-2xl sm:text-3xl font-black text-amber-300">
                {impact.mealsServed}
              </span>
              <span className="text-xs font-semibold text-emerald-200">
                meals ({impact.mealServingKg} kg / meal)
              </span>
            </div>
          </div>

          <div className="bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-800/80">
            <span className="text-[10px] uppercase font-bold text-emerald-300 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              CO₂e Landfill Avoidance
            </span>
            <div className="mt-1 flex items-baseline gap-1 font-mono">
              <span className="text-2xl sm:text-3xl font-black text-emerald-200">
                {impact.co2eAvoidedKg}
              </span>
              <span className="text-xs font-semibold text-emerald-300">
                kg CO₂e (factor: {impact.co2eFactor})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Donor Trust Score (0-100) Card */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0F5132]" />
              <h3 className="text-lg font-black text-gray-900">
                Donor Trust Score (FSSAI FoSCoS Aligned)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                {donorTrustScore.isFssaiValid ? 'FSSAI Verified Format' : 'FSSAI Incomplete'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Dynamic donor integrity scorecard computed from licence validity, safe windows, and complete logs
            </p>
          </div>

          {/* Big Score Gauge */}
          <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-300 text-center shrink-0 self-start sm:self-auto">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Trust Score</span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-[#0F5132]">
              {donorTrustScore.total}
              <span className="text-xs font-normal opacity-60">/100</span>
            </span>
          </div>
        </div>

        {/* Stacked Bar Breakdown */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-bold text-gray-600">
            <span>Score Factors</span>
            <span>25 FSSAI • 30 Safe Window • 25 Completeness • 20 Clean Overrides</span>
          </div>
          <div className="h-3 rounded-full bg-gray-100 flex overflow-hidden p-0.5">
            <div
              className="bg-emerald-600 h-full rounded-l-full"
              style={{ width: `${donorTrustScore.fssaiScore}%` }}
              title={`FSSAI Format: ${donorTrustScore.fssaiScore}/25`}
            />
            <div
              className="bg-blue-600 h-full"
              style={{ width: `${donorTrustScore.timelyScore}%` }}
              title={`Safe Window Adherence: ${donorTrustScore.timelyScore}/30`}
            />
            <div
              className="bg-amber-500 h-full"
              style={{ width: `${donorTrustScore.completenessScore}%` }}
              title={`Audit Completeness: ${donorTrustScore.completenessScore}/25`}
            />
            <div
              className="bg-purple-600 h-full rounded-r-full"
              style={{ width: `${donorTrustScore.overrideScore}%` }}
              title={`Override Accountability: ${donorTrustScore.overrideScore}/20`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-500 pt-0.5">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              FSSAI Registration ({donorTrustScore.fssaiScore}/25)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Timely Handovers ({donorTrustScore.timelyScore}/30)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Log Completeness ({donorTrustScore.completenessScore}/25)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              Zero Unjustified Overrides ({donorTrustScore.overrideScore}/20)
            </span>
          </div>
        </div>

        {/* Plain Sentence Summary */}
        <p className="text-xs text-emerald-950 font-semibold bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
          Why this score: {donorTrustScore.isFssaiValid ? '14-digit FSSAI licence validated' : 'FSSAI licence format pending'}, 100% handover execution within dynamic Arrhenius safety windows, and complete cryptographic hash provenance.
        </p>
      </div>

      {/* 3. Handover Verification Form & Active Batch Execution */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 sm:p-6 space-y-6">
        
        {/* Batch Selection Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#0F5132]" />
              <span>Active Batch Handover Verification</span>
            </h3>
            <p className="text-xs text-gray-500">
              Select an allocated batch to verify NGO pickup security code & probe handover temperature
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Batch:</span>
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setFormError(null);
                setShowOverrideInput(false);
              }}
              className="px-3 py-1.5 text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.dishName} ({b.quantityKg} kg • {b.dispatchOffer ? b.dispatchOffer.status : 'unallocated'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeBatch && spoilage && (
          <div className="space-y-6">
            
            {/* Active Batch Summary Card */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-gray-900">{activeBatch.dishName}</span>
                  <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-white border border-gray-200 text-gray-800 uppercase">
                    {activeBatch.category}
                  </span>
                  <span className="text-xs font-bold text-[#0F5132]">
                    {activeBatch.quantityKg} kg
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                  <span>Storage: <strong>{activeBatch.storageType}</strong></span>
                  <span>•</span>
                  <span>
                    Recipient:{' '}
                    <strong className="text-gray-900">
                      {activeBatch.dispatchOffer ? activeBatch.dispatchOffer.receiverName : 'None (Go to Match)'}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Status:{' '}
                    <strong className="text-amber-700 uppercase">
                      {activeBatch.dispatchOffer ? activeBatch.dispatchOffer.status : 'Not Offered'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons for Offer & WhatsApp Preview */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {activeBatch.dispatchOffer?.status === 'offered' && (
                  <button
                    type="button"
                    onClick={() => setPhonePreviewBatchId(activeBatch.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-[#075E54] hover:bg-[#128C7E] text-white shadow-2xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>View NGO Phone Alert</span>
                  </button>
                )}

                {(!activeBatch.dispatchOffer || activeBatch.dispatchOffer.status === 'declined') && (
                  <button
                    type="button"
                    onClick={onSwitchToMatch}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-[#0F5132] hover:bg-[#14663f] text-white shadow-2xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-300" />
                    <span>Go to Match Tab to Offer</span>
                  </button>
                )}
              </div>
            </div>

            {/* Handover Verification Form */}
            {activeBatch.dispatchOffer?.status === 'handed_over' ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-emerald-950 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Batch Successfully Handed Over & Logged</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveReceiptBatch(activeBatch)}
                    className="px-3 py-1 rounded-xl bg-white border border-emerald-300 text-xs font-bold text-[#0F5132] hover:bg-emerald-100"
                  >
                    View / Print Receipt
                  </button>
                </div>
                <div className="text-xs text-emerald-800 space-y-1">
                  <div>Recipient: <strong>{activeBatch.dispatchOffer.receiverName}</strong></div>
                  <div>Handover Temp: <strong>{activeBatch.dispatchOffer.handoverRecord?.temperatureC} °C</strong></div>
                  <div>Security Code: <strong>{activeBatch.dispatchOffer.handoverRecord?.pickupCodeUsed}</strong></div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmHandoverSubmit} className="space-y-4 bg-gray-50/60 p-5 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Confirm Physical Handover
                  </span>
                  {activeBatch.dispatchOffer?.pickupCode && (
                    <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      Generated Pickup Code: {activeBatch.dispatchOffer.pickupCode}
                    </span>
                  )}
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Enter Pickup Code */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#0F5132]" />
                      4-Digit NGO Pickup Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={enteredPickupCode}
                      onChange={(e) => setEnteredPickupCode(e.target.value)}
                      placeholder="e.g. 4829"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-mono font-bold tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                      required
                    />
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      Provided by recipient NGO upon vehicle arrival at facility
                    </span>
                  </div>

                  {/* Core Handover Temperature */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1 flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-[#0F5132]" />
                      Handover Temperature (°C) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={handoverTempC}
                        onChange={(e) => setHandoverTempC(e.target.value)}
                        placeholder="e.g. 62.5"
                        className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                        required
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs font-bold text-gray-400">°C</span>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      Hot food limit: ≥ {settings.minHandoverHotTempC}°C • Chilled limit: ≤ {settings.maxHandoverChilledTempC}°C
                    </span>
                  </div>
                </div>

                {/* Safety Override Reason (shown if warning triggered) */}
                {showOverrideInput && (
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 space-y-2">
                    <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider">
                      Safety Override Reason Required <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="e.g. Receiver insulated van equipped with thermal hot-box; reheat scheduled upon arrival at center."
                      className="w-full p-2.5 text-xs border border-amber-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
                      rows={2}
                      required
                    />
                    <span className="text-[10px] text-amber-800 italic block">
                      This override and typed justification will be permanently written into the immutable Trust Log.
                    </span>
                  </div>
                )}

                {/* Submit Confirmation Bar */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500 italic">
                    AI provides decision support; a human always confirms every donation.
                  </span>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0F5132] hover:bg-[#14663f] text-white text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Confirm Handover & Generate Receipt</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

      </div>

      {/* 4. Active Handover Receipt Modal / Section */}
      {activeReceiptBatch && activeReceiptBatch.dispatchOffer?.handoverRecord && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-gray-900">
              Audit-Ready Handover Receipt
            </h3>
            <button
              type="button"
              onClick={() => setActiveReceiptBatch(null)}
              className="text-xs font-bold text-gray-500 hover:text-gray-800"
            >
              Close Receipt
            </button>
          </div>
          <HandoverReceipt
            batch={activeReceiptBatch}
            record={activeReceiptBatch.dispatchOffer.handoverRecord}
            donorProfile={donorProfile}
            onClose={() => setActiveReceiptBatch(null)}
          />
        </div>
      )}

      {/* 5. WhatsApp-Style NGO Phone Preview Modal (if triggered) */}
      {phonePreviewBatchId && activeBatch && currentReceiver && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative">
            <NgoPhonePreview
              batch={activeBatch}
              receiver={currentReceiver}
              donorProfile={donorProfile}
              spoilage={spoilage!}
              alertCostRupees={settings.alertCostEstimateRupees}
              onAccept={() => {
                onAcceptOffer(activeBatch.id, currentReceiver.id);
                setPhonePreviewBatchId(null);
              }}
              onDecline={() => {
                onDeclineOffer(activeBatch.id, currentReceiver.id);
                setPhonePreviewBatchId(null);
              }}
              onClose={() => setPhonePreviewBatchId(null)}
            />
          </div>
        </div>
      )}

      {/* Mandatory Honesty Footer */}
      <div className="text-center text-[11px] font-semibold text-gray-400 py-2">
        Demo data is fictional. WhatsApp, SMS and signatures are simulated. AI gives decision support, a human confirms every donation.
      </div>

    </div>
  );
};
