import React, { useState, useMemo } from 'react';
import {
  FoodBatch,
  Receiver,
  CascadeTier,
  MatchWeights,
  LogisticsSettings,
  StorageConfigMap,
  PhotoRuleSettings,
  ReceiverMatchResult,
  DonorProfile,
} from '../types/batch';
import {
  calculateBatchSpoilage,
  formatCountdown,
  getStatusTheme,
} from '../utils/spoilage';
import {
  DEMO_RECEIVERS,
  DEFAULT_MATCH_WEIGHTS,
  DEFAULT_LOGISTICS_SETTINGS,
  evaluateCascadeEngine,
} from '../utils/matchEngine';
import { CascadeLadder } from './CascadeLadder';
import { NgoPhonePreview } from './NgoPhonePreview';
import { RouteMap } from './RouteMap';
import {
  Clock,
  Compass,
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Split,
  ShieldAlert,
  Send,
  XCircle,
  Truck,
  Sparkles,
  Info,
  Scale,
  Percent,
  KeyRound,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface MatchTabProps {
  batches: FoodBatch[];
  simulatedTimeMs: number;
  configs: StorageConfigMap;
  photoRules: PhotoRuleSettings;
  donorProfile: DonorProfile;
  matchWeights?: MatchWeights;
  logistics?: LogisticsSettings;
  onUpdateBatchDispatchOffer: (
    batchId: string,
    offer: {
      receiverId: string;
      receiverName: string;
      status: 'offered' | 'accepted' | 'declined' | 'timeout' | 'handed_over';
      timestamp: number;
      pickupCode?: string;
    } | null
  ) => void;
  onAcceptOffer?: (batchId: string, receiverId: string, pickupCode: string) => void;
  onDeclineOffer?: (batchId: string, receiverId: string, reason: string) => void;
  onTimeoutOffer?: (batchId: string, receiverId: string) => void;
  onSwitchToBatches: () => void;
  onSwitchToHandover?: (batchId: string) => void;
  onSwitchToTrustLog?: (entryIndex?: number) => void;
  onOpenSettings?: () => void;
  onLoadDemoBatch?: () => void;
}

export const MatchTab: React.FC<MatchTabProps> = ({
  batches,
  simulatedTimeMs,
  configs,
  photoRules,
  donorProfile,
  matchWeights = DEFAULT_MATCH_WEIGHTS,
  logistics = DEFAULT_LOGISTICS_SETTINGS,
  onUpdateBatchDispatchOffer,
  onAcceptOffer,
  onDeclineOffer,
  onTimeoutOffer,
  onSwitchToBatches,
  onSwitchToHandover,
  onSwitchToTrustLog,
  onOpenSettings,
  onLoadDemoBatch,
}) => {
  // Selected batch for matching
  const [selectedBatchId, setSelectedBatchId] = useState<string>(() => {
    return batches[0]?.id || '';
  });

  // Selected cascade tier view (defaults to recommended tier)
  const [viewTier, setViewTier] = useState<CascadeTier | null>(null);

  // Compare with nearest-only toggle
  const [compareNearest, setCompareNearest] = useState<boolean>(true);

  // Excluded receivers list collapse state
  const [showExcluded, setShowExcluded] = useState<boolean>(false);

  // Weight sliders drawer / panel state
  const [showWeightSliders, setShowWeightSliders] = useState<boolean>(false);
  const [localWeights, setLocalWeights] = useState<MatchWeights>(matchWeights);

  // WhatsApp-style NGO phone alert preview state
  const [activePhoneAlertReceiver, setActivePhoneAlertReceiver] = useState<Receiver | null>(null);

  // Current batch object
  const activeBatch = useMemo(() => {
    return batches.find((b) => b.id === selectedBatchId) || batches[0] || null;
  }, [batches, selectedBatchId]);

  // Real-time recalculation of Spoilage Clock for active batch
  const spoilage = useMemo(() => {
    if (!activeBatch) return null;
    return calculateBatchSpoilage(activeBatch, simulatedTimeMs, configs, photoRules);
  }, [activeBatch, simulatedTimeMs, configs, photoRules]);

  // Cascade evaluation recalculated live every second
  const cascade = useMemo(() => {
    if (!activeBatch || !spoilage) return null;
    return evaluateCascadeEngine(activeBatch, spoilage, DEMO_RECEIVERS, logistics, localWeights);
  }, [activeBatch, spoilage, logistics, localWeights]);

  // 14-digit FSSAI validation: exactly 14 digits
  const isFssaiValid = /^\d{14}$/.test(donorProfile?.fssaiNumber?.trim() || '');

  // Handlers for Dispatch Offer buttons
  const handleOfferToReceiver = (receiver: Receiver) => {
    if (!activeBatch) return;
    if (!isFssaiValid) return;

    onUpdateBatchDispatchOffer(activeBatch.id, {
      receiverId: receiver.id,
      receiverName: receiver.name,
      status: 'offered',
      timestamp: simulatedTimeMs,
    });
    setActivePhoneAlertReceiver(receiver);
  };

  const handleSimulateDecline = () => {
    if (!activeBatch || !cascade) return;
    // Current offered receiver or top receiver declines -> pick the next best
    const currentOfferId = activeBatch.dispatchOffer?.receiverId;
    const remainingCandidates = cascade.rankedT2Matches.filter(
      (m) => m.receiver.id !== currentOfferId
    );

    if (remainingCandidates.length > 0) {
      const nextBest = remainingCandidates[0].receiver;
      if (onDeclineOffer && currentOfferId) {
        onDeclineOffer(activeBatch.id, currentOfferId, 'Capacity full');
      }
      onUpdateBatchDispatchOffer(activeBatch.id, {
        receiverId: nextBest.id,
        receiverName: nextBest.name,
        status: 'offered',
        timestamp: simulatedTimeMs,
      });
    } else {
      if (onDeclineOffer && currentOfferId) {
        onDeclineOffer(activeBatch.id, currentOfferId, 'Capacity full');
      }
      onUpdateBatchDispatchOffer(activeBatch.id, null);
    }
  };

  const handleResetOffer = () => {
    if (!activeBatch) return;
    onUpdateBatchDispatchOffer(activeBatch.id, null);
  };

  if (!activeBatch || !spoilage || !cascade) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto text-amber-700">
          <Sparkles className="w-6 h-6 text-[#D97706]" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-gray-900">No batches yet. Load the demo batch.</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Load the official Vegetable curry batch (40 kg) to evaluate cascade redistribution, multi-factor matching, and dispatch alerts.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          {onLoadDemoBatch ? (
            <button
              type="button"
              onClick={onLoadDemoBatch}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold rounded-xl bg-[#0F5132] text-white hover:bg-[#14663f] shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Load demo batch</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSwitchToBatches}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold rounded-xl bg-[#0F5132] text-white hover:bg-[#14663f] shadow-sm transition-all cursor-pointer"
            >
              <span>Go to Batches Tab</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const effectiveTier = viewTier || cascade.recommendedTier;
  const statusTheme = getStatusTheme(spoilage.status);
  const countdown = formatCountdown(spoilage.projectedRemainingSeconds);

  return (
    <div className="space-y-6">

      {/* Offer Accepted Banner if already accepted */}
      {activeBatch.dispatchOffer?.status === 'accepted' && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                <span>Offer Accepted by {activeBatch.dispatchOffer.receiverName}!</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200 text-emerald-950 font-bold">
                  Code: {activeBatch.dispatchOffer.pickupCode || '4821'}
                </span>
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Driver is on the way. Present the 4-digit code at the Handover Desk, record food temperature, and issue official receipt.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {onSwitchToHandover && (
              <button
                type="button"
                onClick={() => onSwitchToHandover(activeBatch.id)}
                className="px-4 py-2 bg-[#0F5132] hover:bg-[#14663f] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
              >
                <span>Go to Handover Desk</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
              </button>
            )}
            {onSwitchToTrustLog && (
              <button
                type="button"
                onClick={() => onSwitchToTrustLog()}
                className="px-3 py-2 bg-white hover:bg-emerald-100 text-[#0F5132] border border-emerald-300 font-bold text-xs rounded-xl shadow-2xs transition-all"
              >
                View in Trust Log
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Top Batch Selector & Live Clock Strip */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        
        {/* Banner with Fictional Data Note */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0F5132]/10 text-[#0F5132] flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
                <span>Cascade Match Engine</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Fictional demo data
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                Arrhenius-calibrated surplus redistribution routing beyond simple distance
              </p>
            </div>
          </div>

          {/* Batch Selector Dropdown */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Select Batch:</span>
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setViewTier(null);
              }}
              className="px-3 py-1.5 text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#0F5132]"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.dishName} ({b.quantityKg} kg • {b.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Batch Passport Telemetry Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-gray-50/70 p-4 rounded-2xl border border-gray-200/80">
          
          {/* Dish & Quantity */}
          <div className="md:col-span-4 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-gray-900">{activeBatch.dishName}</span>
              <span className="px-2 py-0.2 text-[10px] font-bold rounded bg-gray-200 text-gray-800 uppercase">
                {activeBatch.category}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
              <span>Qty: <strong className="text-gray-900">{activeBatch.quantityKg} kg</strong></span>
              <span>•</span>
              <span>Storage: <strong className="text-gray-900">{activeBatch.storageType}</strong></span>
              {activeBatch.isReusableInHouse && (
                <>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold bg-emerald-100/70 px-1.5 py-0.2 rounded">
                    Kitchen Reusable
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Clock Countdown */}
          <div className="md:col-span-5 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white border border-gray-200 shadow-2xs">
              <Clock className="w-5 h-5 text-[#0F5132]" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black font-mono tabular-nums ${statusTheme.clockColor}`}>
                  {countdown}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusTheme.badgeBg}`}>
                  {spoilage.status}
                </span>
              </div>
              <div className="text-[11px] text-gray-500 font-medium">
                Safe hours left: <strong className="text-gray-800">{spoilage.safeHoursLeft.toFixed(2)}h</strong>
                {spoilage.photoAdjustmentApplied && (
                  <span className="text-amber-800 ml-1">(photo adjusted)</span>
                )}
              </div>
            </div>
          </div>

          {/* Dispatch Status */}
          <div className="md:col-span-3 text-right">
            {activeBatch.dispatchOffer ? (
              <div className="inline-block p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-left shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                    <Send className="w-3 h-3 text-emerald-600" />
                    Offered to Receiver
                  </span>
                  <button
                    type="button"
                    onClick={handleResetOffer}
                    className="text-[10px] text-gray-400 hover:text-red-600 font-semibold"
                    title="Clear current offer"
                  >
                    Reset
                  </button>
                </div>
                <div className="text-xs font-black text-emerald-950 mt-0.5 truncate">
                  {activeBatch.dispatchOffer.receiverName}
                </div>
              </div>
            ) : (
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Unallocated • Ready to Match
              </div>
            )}
          </div>

        </div>

        {/* 5-Step Horizontal Cascade Ladder */}
        <CascadeLadder
          recommendedTier={cascade.recommendedTier}
          tierEvaluations={cascade.tierEvaluations}
          onSelectTier={(tier) => setViewTier(tier)}
          selectedTier={effectiveTier}
        />

      </div>

      {/* Tier Details Section */}
      <div className="space-y-6">
        
        {/* TIER T1 VIEW: In-House Kitchen Reuse */}
        {effectiveTier === 'T1' && (
          <div className="bg-white rounded-3xl border-2 border-emerald-500 p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#0F5132] block">
                  Recommended Tier 1
                </span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-0.5">
                  In-House Kitchen Repurposing
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  The batch retains ample shelf-life ({spoilage.safeHoursLeft.toFixed(1)}h remaining ≥ {logistics.minInHouseSafeHours}h threshold) and was tagged for internal kitchen reuse.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-extrabold border border-emerald-300 shrink-0">
                Lowest Carbon Impact
              </span>
            </div>

            {activeBatch.reuseIdea && (
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Chef's Repurposing Note</span>
                <p className="text-sm font-bold text-emerald-950 mt-0.5 italic">
                  "{activeBatch.reuseIdea}"
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-500">
                Conserves 100% of transport emissions and food prep resources.
              </span>
              <button
                type="button"
                onClick={() => handleOfferToReceiver({
                  id: 'internal-kitchen',
                  name: 'In-House Kitchen Station',
                  type: 'Internal Repurposing',
                  driveMinutes: 0,
                  distanceKm: 0,
                  capacityKgNow: activeBatch.quantityKg,
                  needLevel: 5,
                  noAllergens: [],
                  accepts: ['Cooked', 'Raw/Bulk', 'Packaged'],
                  reliability: 100,
                  tier: 'T2',
                })}
                className="px-5 py-2.5 rounded-xl bg-[#0F5132] hover:bg-[#14663f] text-white text-xs font-bold shadow-md transition-all"
              >
                Log Internal Kitchen Repurposing
              </button>
            </div>
          </div>
        )}

        {/* TIER T2 VIEW: People (Ranked Shelters & Community Kitchens) */}
        {effectiveTier === 'T2' && (
          <div className="space-y-5">
            
            {/* Action Bar & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-[#0F5132]" />
                  <span>Tier 2: People Redistribution Matching</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#0F5132]/10 text-[#0F5132]">
                    {cascade.rankedT2Matches.length} qualified
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ranked by time slack, capacity fit, need level, reliability, and transit proximity
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Toggle Compare Nearest */}
                <button
                  type="button"
                  onClick={() => setCompareNearest(!compareNearest)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                    compareNearest
                      ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {compareNearest ? 'Hide Nearest Comparison' : 'Compare with Nearest-Only'}
                </button>

                {/* Weights Sliders Toggle */}
                <button
                  type="button"
                  onClick={() => setShowWeightSliders(!showWeightSliders)}
                  className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors"
                  title="Adjust match scoring weights"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Match Weights Sliders (Collapsible) */}
            {showWeightSliders && (
              <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#0F5132]" />
                    Match Factor Weights (Default: 25 / 20 / 20 / 20 / 15)
                  </span>
                  <button
                    type="button"
                    onClick={() => setLocalWeights(DEFAULT_MATCH_WEIGHTS)}
                    className="text-[11px] font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset weights
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
                  {(
                    [
                      { key: 'timeSlack', label: 'Time Slack', val: localWeights.timeSlack },
                      { key: 'capacityFit', label: 'Capacity Fit', val: localWeights.capacityFit },
                      { key: 'needLevel', label: 'Need Level', val: localWeights.needLevel },
                      { key: 'reliability', label: 'Reliability', val: localWeights.reliability },
                      { key: 'roadTime', label: 'Road Time', val: localWeights.roadTime },
                    ] as const
                  ).map((item) => (
                    <div key={item.key} className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                      <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                        <span>{item.label}</span>
                        <span className="font-mono text-[#0F5132]">{item.val}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={item.val}
                        onChange={(e) =>
                          setLocalWeights((prev) => ({
                            ...prev,
                            [item.key]: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-[#0F5132] cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Split Suggestion Card (if batch exceeds single receiver capacity) */}
            {cascade.splitSuggestion?.isRecommended && (
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <Split className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
                      Capacity Split Suggested
                    </span>
                    <p className="text-xs font-medium text-amber-900 mt-0.5">
                      {cascade.splitSuggestion.reason}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (cascade.splitSuggestion) {
                      handleOfferToReceiver(cascade.splitSuggestion.receiverA.receiver);
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-[#D97706] hover:bg-amber-700 text-white rounded-xl shadow-2xs whitespace-nowrap shrink-0"
                >
                  Offer Split Allocation
                </button>
              </div>
            )}

            {/* Compare with Nearest-Only Side-by-Side Box */}
            {compareNearest && cascade.nearestT2Receiver && cascade.bestT2Receiver && (
              <div className="bg-gradient-to-br from-amber-50/60 to-white rounded-3xl border border-amber-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#D97706]" />
                    Why Distance Alone Fails: Side-by-Side Comparison
                  </span>
                  <span className="text-[10px] font-bold text-gray-500">
                    AnnaChakra Multi-Variable Algorithm
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  
                  {/* Nearest Receiver Card (e.g. Shelter A) */}
                  <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2 opacity-85">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                        Nearest by Distance Only
                      </span>
                      <span className="font-mono text-xs font-bold text-gray-500">
                        Score: {cascade.nearestT2Receiver.score.totalScore}/100
                      </span>
                    </div>

                    <div className="text-sm font-bold text-gray-800">
                      {cascade.nearestT2Receiver.receiver.name}
                    </div>

                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Distance: <strong>{cascade.nearestT2Receiver.receiver.distanceKm} km</strong> ({cascade.nearestT2Receiver.receiver.driveMinutes} min)</div>
                      <div>Capacity: <strong className="text-red-600">{cascade.nearestT2Receiver.receiver.capacityKgNow} kg</strong> (needs {activeBatch.quantityKg} kg)</div>
                      <div>Reliability: <strong>{cascade.nearestT2Receiver.receiver.reliability}%</strong> • Need: {cascade.nearestT2Receiver.receiver.needLevel}/5</div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 text-[11px] font-bold text-red-700">
                      Why nearest loses: Capacity only {cascade.nearestT2Receiver.receiver.capacityKgNow} kg for a {activeBatch.quantityKg} kg batch (cannot absorb batch in one run) & lower reliability ({cascade.nearestT2Receiver.receiver.reliability}% vs {cascade.bestT2Receiver.receiver.reliability}%).
                    </div>
                  </div>

                  {/* Best Match Receiver Card (e.g. Shelter B) */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border-2 border-emerald-500 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#0F5132] text-amber-300">
                        Best by AnnaChakra Match Score
                      </span>
                      <span className="font-mono text-sm font-black text-[#0F5132]">
                        Score: {cascade.bestT2Receiver.score.totalScore}/100
                      </span>
                    </div>

                    <div className="text-base font-black text-gray-900">
                      {cascade.bestT2Receiver.receiver.name}
                    </div>

                    <div className="text-xs text-gray-700 space-y-1">
                      <div>Distance: <strong>{cascade.bestT2Receiver.receiver.distanceKm} km</strong> ({cascade.bestT2Receiver.receiver.driveMinutes} min away)</div>
                      <div>Capacity: <strong className="text-emerald-700">{cascade.bestT2Receiver.receiver.capacityKgNow} kg</strong> (easily absorbs full {activeBatch.quantityKg} kg)</div>
                      <div>Reliability: <strong className="text-emerald-700">{cascade.bestT2Receiver.receiver.reliability}%</strong> • Need: <strong>{cascade.bestT2Receiver.receiver.needLevel}/5 (Acute)</strong></div>
                    </div>

                    <div className="pt-2 border-t border-emerald-200 text-[11px] font-bold text-emerald-950">
                      Why it wins: Perfect capacity fit, acute hunger need, 92% verified on-time collection, and safe travel margin.
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Top Match Showcase Card with Offer / Decline Simulation Buttons */}
            {cascade.bestT2Receiver && (
              <div className="bg-white rounded-3xl border-2 border-[#0F5132] p-5 sm:p-6 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#0F5132] text-amber-300 text-[10px] font-black uppercase tracking-wider">
                        Rank #1 Best Match
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        {cascade.bestT2Receiver.receiver.type}
                      </span>
                    </div>
                    <h4 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
                      {cascade.bestT2Receiver.receiver.name}
                    </h4>
                    <p className="text-xs font-semibold text-[#0F5132] mt-0.5">
                      "{cascade.bestT2Receiver.whyThisOne}"
                    </p>
                  </div>

                  {/* Big Total Score Badge */}
                  <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-300 text-center shrink-0">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">Match Score</span>
                    <span className="text-2xl sm:text-3xl font-black font-mono text-[#0F5132]">
                      {cascade.bestT2Receiver.score.totalScore}
                      <span className="text-xs font-normal opacity-60">/100</span>
                    </span>
                  </div>
                </div>

                {/* Score Breakdown Stacked Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-bold text-gray-600">
                    <span>Score Contribution Breakdown</span>
                    <span>100% Normalized</span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 flex overflow-hidden p-0.5">
                    <div
                      className="bg-emerald-600 h-full rounded-l-full"
                      style={{ width: `${cascade.bestT2Receiver.score.timeSlackWeighted}%` }}
                      title={`Time Slack: +${cascade.bestT2Receiver.score.timeSlackWeighted}`}
                    />
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${cascade.bestT2Receiver.score.capacityFitWeighted}%` }}
                      title={`Capacity Fit: +${cascade.bestT2Receiver.score.capacityFitWeighted}`}
                    />
                    <div
                      className="bg-rose-500 h-full"
                      style={{ width: `${cascade.bestT2Receiver.score.needLevelWeighted}%` }}
                      title={`Need Level: +${cascade.bestT2Receiver.score.needLevelWeighted}`}
                    />
                    <div
                      className="bg-blue-600 h-full"
                      style={{ width: `${cascade.bestT2Receiver.score.reliabilityWeighted}%` }}
                      title={`Reliability: +${cascade.bestT2Receiver.score.reliabilityWeighted}`}
                    />
                    <div
                      className="bg-purple-600 h-full rounded-r-full"
                      style={{ width: `${cascade.bestT2Receiver.score.roadTimeWeighted}%` }}
                      title={`Road Proximity: +${cascade.bestT2Receiver.score.roadTimeWeighted}`}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-500 pt-0.5">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                      Time Slack ({cascade.bestT2Receiver.score.timeSlackWeighted}pts)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                      Capacity ({cascade.bestT2Receiver.score.capacityFitWeighted}pts)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                      Need ({cascade.bestT2Receiver.score.needLevelWeighted}pts)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                      Reliability ({cascade.bestT2Receiver.score.reliabilityWeighted}pts)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-600 inline-block" />
                      Road Time ({cascade.bestT2Receiver.score.roadTimeWeighted}pts)
                    </span>
                  </div>
                </div>

                {/* Dispatch Offer Action Buttons */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  {!isFssaiValid && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="block font-bold">FSSAI Licence Required to Offer Food:</strong>
                        <span>
                          Your FSSAI licence/registration number is missing or invalid (must be exactly 14 digits). Format check only. Registry verification (FSSAI FoSCoS) is planned for the pilot. A donor without a valid number cannot dispatch food to partner NGOs.
                        </span>
                        {onOpenSettings && (
                          <button
                            type="button"
                            onClick={onOpenSettings}
                            className="mt-1.5 block text-xs font-bold text-red-900 underline hover:text-red-700"
                          >
                            Open Settings → Configure 14-Digit FSSAI
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-[#0F5132]" />
                      <span>
                        Travel: <strong>{cascade.bestT2Receiver.receiver.driveMinutes} min</strong> ({cascade.bestT2Receiver.receiver.distanceKm} km) • Total Window: <strong>{cascade.bestT2Receiver.hoursNeeded.toFixed(1)}h</strong>
                      </span>
                      {isFssaiValid && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 ml-2">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          FSSAI {donorProfile.fssaiNumber}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <button
                        type="button"
                        disabled={!isFssaiValid}
                        onClick={() => handleOfferToReceiver(cascade.bestT2Receiver!.receiver)}
                        className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all ${
                          isFssaiValid
                            ? 'bg-[#0F5132] hover:bg-[#14663f] text-white active:scale-95'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                        }`}
                        title={isFssaiValid ? 'Send WhatsApp Alert to NGO' : 'Enter 14-digit FSSAI number in Settings first'}
                      >
                        <Send className="w-3.5 h-3.5 text-amber-300" />
                        <span>Offer to top match</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSimulateDecline}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl transition-colors shadow-2xs"
                        title="Simulate decline and fallback to next best match"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>Simulate decline</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ranked T2 Receivers Table */}
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-gray-700">
                  All Qualified T2 Receivers ({cascade.rankedT2Matches.length})
                </span>
                <span className="text-[10px] text-gray-500 font-medium">
                  Ranked by combined match score
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100/70 text-gray-600 font-bold uppercase border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2.5">Rank & Facility</th>
                      <th className="px-4 py-2.5">Score</th>
                      <th className="px-4 py-2.5">Distance / ETA</th>
                      <th className="px-4 py-2.5">Capacity</th>
                      <th className="px-4 py-2.5">Hunger Need</th>
                      <th className="px-4 py-2.5">Reliability</th>
                      <th className="px-4 py-2.5 text-right">Dispatch Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cascade.rankedT2Matches.map((m, idx) => {
                      const isTop = idx === 0;
                      const isCurrentOffer = activeBatch.dispatchOffer?.receiverId === m.receiver.id;

                      return (
                        <tr
                          key={m.receiver.id}
                          className={`hover:bg-gray-50 transition-colors ${
                            isCurrentOffer ? 'bg-emerald-50/70' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                                  isTop ? 'bg-[#0F5132] text-white' : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <div>
                                <span className="font-bold text-gray-900 block">{m.receiver.name}</span>
                                <span className="text-[10px] text-gray-500">{m.receiver.type}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 font-mono font-black text-sm text-[#0F5132]">
                            {m.score.totalScore}
                            <span className="text-[10px] font-normal text-gray-400">/100</span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-semibold text-gray-900">{m.receiver.distanceKm} km</span>
                            <span className="text-gray-400 block text-[10px]">{m.receiver.driveMinutes} min drive</span>
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`font-bold ${
                                m.receiver.capacityKgNow >= activeBatch.quantityKg
                                  ? 'text-emerald-700'
                                  : 'text-amber-700'
                              }`}
                            >
                              {m.receiver.capacityKgNow} kg
                            </span>
                            <span className="text-gray-400 block text-[10px]">
                              {m.receiver.capacityKgNow >= activeBatch.quantityKg ? 'Full batch' : 'Partial'}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-bold text-gray-800">{m.receiver.needLevel} / 5</span>
                            <span className="text-gray-400 block text-[10px]">Priority level</span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-bold text-emerald-700">{m.receiver.reliability}%</span>
                            <span className="text-gray-400 block text-[10px]">On-time history</span>
                          </td>

                          <td className="px-4 py-3 text-right">
                            {isCurrentOffer ? (
                              <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-[11px] font-bold border border-emerald-300">
                                Offered ✓
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOfferToReceiver(m.receiver)}
                                className="px-3 py-1 bg-gray-100 hover:bg-[#0F5132] text-gray-800 hover:text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                Offer
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TIER T3 VIEW: Secondary Buyers (Discount Wholesale) */}
        {effectiveTier === 'T3' && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-800 block">
                  Tier 3: Secondary Commercial Resale
                </span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-0.5">
                  Surplus Secondary Buyer Clearance
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Dynamic falling-price discount based on remaining safe hours vs base safe hours.
                </p>
              </div>

              {/* Dynamic Falling Discount Badge */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-300 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-800 block">Dynamic Clearance Discount</span>
                <span className="text-2xl font-black font-mono text-amber-950">
                  {cascade.tierEvaluations.T3.secondaryBuyerDiscountPercent}% OFF
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Formula: discount % = 30 + (1 - H/baseSafeHours) * 40, capped at 70%.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {DEMO_RECEIVERS.filter((r) => r.tier === 'T3').map((buyer) => (
                <div key={buyer.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex justify-between items-center">
                  <div>
                    <h5 className="font-bold text-gray-900">{buyer.name}</h5>
                    <span className="text-xs text-gray-500">{buyer.type} • {buyer.distanceKm} km ({buyer.driveMinutes} min)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOfferToReceiver(buyer)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0F5132] text-white text-xs font-bold hover:bg-[#14663f]"
                  >
                    Send Offer
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TIER T4 VIEW: Animal Feed */}
        {effectiveTier === 'T4' && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-800 block">
                Tier 4: Animal Feed Upcycling
              </span>
              <h3 className="text-xl font-extrabold text-gray-900 mt-0.5">
                Livestock & Poultry Feed Conversion
              </h3>
              <p className="text-xs text-amber-900 font-semibold mt-1">
                Note: Where permitted by local veterinary and biosecurity regulations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEMO_RECEIVERS.filter((r) => r.tier === 'T4').map((feed) => (
                <div key={feed.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex justify-between items-center">
                  <div>
                    <h5 className="font-bold text-gray-900">{feed.name}</h5>
                    <span className="text-xs text-gray-500">{feed.type} • {feed.distanceKm} km</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOfferToReceiver(feed)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0F5132] text-white text-xs font-bold"
                  >
                    Dispatch to Feed
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TIER T5 VIEW: Biogas & Compost */}
        {effectiveTier === 'T5' && (
          <div className="bg-white rounded-3xl border-2 border-slate-700 p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-red-600 block">
                  Tier 5: Anaerobic Digestion & Compost
                </span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-0.5">
                  Biogas Plant & Organics Diversion
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {spoilage.status === 'Unsafe: never offer as food' || spoilage.safeHoursLeft <= 0
                    ? 'Unsafe: never offer as food. Microbial threshold exceeded. Immediate safe diversion to clean energy biogas.'
                    : 'Final diversion tier to prevent landfill methane emissions.'}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold">
                100% Landfill Diversion
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h5 className="font-bold text-gray-900">Demo Biogas Plant G</h5>
                <span className="text-xs text-gray-500">Municipal Organics Digester • 13 km (40 min) • 1,000 kg capacity</span>
              </div>
              <button
                type="button"
                onClick={() => handleOfferToReceiver(DEMO_RECEIVERS.find((r) => r.tier === 'T5')!)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold"
              >
                Dispatch to Biogas
              </button>
            </div>
          </div>
        )}

        {/* Pooled Multi-Stop Route Map */}
        <RouteMap />

        {/* Collapsible Excluded Receivers List */}
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setShowExcluded(!showExcluded)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700">
                Excluded Receivers & Safety Gate Rules ({cascade.excludedReceivers.length})
              </span>
              <span className="text-[10px] text-gray-400">
                (strict allergen checks, category mismatch, or transit deficits)
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
              <span>{showExcluded ? 'Hide' : 'Show reasons'}</span>
              {showExcluded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showExcluded && (
            <div className="p-5 border-t border-gray-100 space-y-2.5 bg-gray-50/50">
              {cascade.excludedReceivers.length > 0 ? (
                cascade.excludedReceivers.map((item) => (
                  <div
                    key={item.receiver.id}
                    className="p-3 rounded-xl bg-white border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-gray-900">{item.receiver.name}</span>
                      <span className="text-gray-400 text-[11px] ml-2">({item.receiver.type})</span>
                      <p className="text-[11px] text-red-600 font-medium mt-0.5">
                        {item.disqualificationReason}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 shrink-0 self-start sm:self-center">
                      Excluded
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-400 p-2">No receivers currently excluded.</div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* WhatsApp-Style NGO Phone Preview Modal */}
      {activePhoneAlertReceiver && activeBatch && spoilage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative">
            <NgoPhonePreview
              batch={activeBatch}
              receiver={activePhoneAlertReceiver}
              donorProfile={donorProfile}
              spoilage={spoilage}
              onAccept={(rec, pickupCode) => {
                if (onAcceptOffer) {
                  onAcceptOffer(activeBatch.id, rec.id, pickupCode);
                } else {
                  onUpdateBatchDispatchOffer(activeBatch.id, {
                    receiverId: rec.id,
                    receiverName: rec.name,
                    status: 'accepted',
                    pickupCode,
                    timestamp: simulatedTimeMs,
                  });
                }
              }}
              onDecline={(rec, reason) => {
                if (onDeclineOffer) {
                  onDeclineOffer(activeBatch.id, rec.id, reason);
                } else {
                  handleSimulateDecline();
                }
                setActivePhoneAlertReceiver(null);
              }}
              onTimeout={(rec) => {
                if (onTimeoutOffer) {
                  onTimeoutOffer(activeBatch.id, rec.id);
                } else {
                  handleSimulateDecline();
                }
                setActivePhoneAlertReceiver(null);
              }}
              onGoToHandover={(batchId) => {
                setActivePhoneAlertReceiver(null);
                if (onSwitchToHandover) {
                  onSwitchToHandover(batchId);
                }
              }}
              onClose={() => setActivePhoneAlertReceiver(null)}
            />
          </div>
        </div>
      )}

    </div>
  );
};
