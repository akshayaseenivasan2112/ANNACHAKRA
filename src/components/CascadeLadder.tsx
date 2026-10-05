import React from 'react';
import { CascadeTier, TierEvaluation } from '../types/batch';
import {
  UtensilsCrossed,
  HeartHandshake,
  ShoppingBag,
  Bone,
  Recycle,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
} from 'lucide-react';

interface CascadeLadderProps {
  recommendedTier: CascadeTier;
  tierEvaluations: Record<CascadeTier, TierEvaluation>;
  onSelectTier?: (tier: CascadeTier) => void;
  selectedTier?: CascadeTier;
}

export const CascadeLadder: React.FC<CascadeLadderProps> = ({
  recommendedTier,
  tierEvaluations,
  onSelectTier,
  selectedTier,
}) => {
  const tiersOrder: CascadeTier[] = ['T1', 'T2', 'T3', 'T4', 'T5'];

  const getTierIcon = (tier: CascadeTier) => {
    switch (tier) {
      case 'T1':
        return UtensilsCrossed;
      case 'T2':
        return HeartHandshake;
      case 'T3':
        return ShoppingBag;
      case 'T4':
        return Bone;
      case 'T5':
        return Recycle;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-gray-500">
            5-Step Hierarchy Cascade Ladder
          </span>
          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
            Evaluates Live Every Second
          </span>
        </div>
        <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
          Higher recovery tiers prioritize human nutrition before diversion
        </span>
      </div>

      {/* Horizontal 5-Step Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
        {tiersOrder.map((tierKey, index) => {
          const evalItem = tierEvaluations[tierKey];
          const isRecommended = recommendedTier === tierKey;
          const isSelected = selectedTier === tierKey || (!selectedTier && isRecommended);
          const isAvailable = evalItem.isAvailable;
          const Icon = getTierIcon(tierKey);

          return (
            <button
              key={tierKey}
              type="button"
              onClick={() => onSelectTier?.(tierKey)}
              className={`relative p-3.5 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between ${
                isRecommended
                  ? 'bg-gradient-to-b from-emerald-50/90 to-amber-50/70 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md transform sm:-translate-y-1'
                  : isAvailable
                  ? 'bg-white border-emerald-200 hover:border-emerald-300 shadow-2xs hover:shadow-xs'
                  : 'bg-gray-50/70 border-gray-200/90 opacity-60'
              }`}
            >
              {/* Recommended Badge on Top */}
              {isRecommended && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#0F5132] text-amber-300 text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <span>Best Choice</span>
                </div>
              )}

              <div>
                {/* Step indicator & icon */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-md ${
                      isRecommended
                        ? 'bg-[#0F5132] text-white'
                        : isAvailable
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    STEP {index + 1}
                  </span>

                  <Icon
                    className={`w-4 h-4 ${
                      isRecommended
                        ? 'text-[#0F5132]'
                        : isAvailable
                        ? 'text-emerald-700'
                        : 'text-gray-400'
                    }`}
                  />
                </div>

                {/* Title */}
                <h4
                  className={`text-xs font-black tracking-tight ${
                    isRecommended
                      ? 'text-emerald-950 font-extrabold'
                      : isAvailable
                      ? 'text-gray-900'
                      : 'text-gray-500 line-through'
                  }`}
                >
                  {evalItem.title}
                </h4>

                <p
                  className={`text-[11px] font-medium leading-tight mt-0.5 ${
                    isRecommended ? 'text-emerald-800' : 'text-gray-500'
                  }`}
                >
                  {evalItem.subtitle}
                </p>
              </div>

              {/* Status / Reason Footer */}
              <div className="mt-3 pt-2 border-t border-black/5">
                {isAvailable ? (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      {tierKey === 'T3' && evalItem.secondaryBuyerDiscountPercent
                        ? `${evalItem.secondaryBuyerDiscountPercent}% Discount Available`
                        : `${evalItem.qualifyingCount} Qualified`}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-1 text-[10px] font-semibold text-gray-400">
                    <AlertOctagon className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-tight">{evalItem.reason}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
