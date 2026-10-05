import React from 'react';
import { PhotoFreshnessResult, PhotoRuleSettings } from '../types/batch';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Eye,
  Camera,
  Trash2,
  Info,
  Sparkles,
} from 'lucide-react';

interface PhotoFreshnessCardProps {
  photoResult: PhotoFreshnessResult;
  photoRules: PhotoRuleSettings;
  onRemovePhoto?: () => void;
  onRetakePhoto?: () => void;
  compact?: boolean;
}

export const PhotoFreshnessCard: React.FC<PhotoFreshnessCardProps> = ({
  photoResult,
  photoRules,
  onRemovePhoto,
  onRetakePhoto,
  compact = false,
}) => {
  const {
    thumbnailUrl,
    is_food,
    food_identified,
    freshness_score,
    visible_issues,
    confidence,
    note,
    isManualScore,
  } = photoResult;

  // Non-food detection
  if (!is_food) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-3">
        <div className="flex items-start gap-3">
          <img
            src={thumbnailUrl}
            alt="Uploaded preview"
            className="w-16 h-16 object-cover rounded-xl border border-amber-300 shrink-0"
          />
          <div className="flex-1">
            <div className="flex items-center gap-1.5 font-bold text-sm text-amber-950">
              <AlertTriangle className="w-4 h-4 text-[#D97706]" />
              <span>Non-Food Detected</span>
            </div>
            <p className="text-xs font-semibold text-amber-900 mt-1">
              "This does not look like food. Please retake."
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              The Spoilage Clock remains unaffected by this photo.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-amber-200/80">
          <span className="text-[10px] text-gray-500 italic">
            Decision support only: a human confirms every decision.
          </span>
          <div className="flex items-center gap-2">
            {onRetakePhoto && (
              <button
                type="button"
                onClick={onRetakePhoto}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-950 transition-colors"
              >
                <Camera className="w-3 h-3" />
                <span>Retake</span>
              </button>
            )}
            {onRemovePhoto && (
              <button
                type="button"
                onClick={onRemovePhoto}
                className="p-1 rounded-lg text-amber-800 hover:text-red-700 hover:bg-amber-100 transition-colors"
                title="Remove photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Score color grading:
  // Green (75 or more), Amber (45 to 74), Red (below 45)
  const isGreen = freshness_score >= photoRules.highThreshold;
  const isAmber = freshness_score >= photoRules.lowThreshold && freshness_score < photoRules.highThreshold;
  const isRed = freshness_score < photoRules.lowThreshold;

  const scoreTheme = isGreen
    ? {
        badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        gaugeRing: 'text-emerald-600',
        barColor: 'bg-emerald-600',
        statusLabel: 'Pristine Fresh',
        clockEffect: 'No clock deduction (Score ≥ 75)',
      }
    : isAmber
    ? {
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        gaugeRing: 'text-amber-600',
        barColor: 'bg-amber-600',
        statusLabel: 'Moderate Freshness',
        clockEffect: `Remaining safe hours halved (×${photoRules.moderateFactor})`,
      }
    : {
        badgeBg: 'bg-red-100 text-red-900 border-red-300',
        gaugeRing: 'text-red-600',
        barColor: 'bg-red-600',
        statusLabel: 'Critical Degradation',
        clockEffect: 'Classified Unsafe (Score < 45)',
      };

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isRed
          ? 'bg-red-50/60 border-red-300 ring-1 ring-red-200'
          : isAmber
          ? 'bg-amber-50/50 border-amber-300'
          : 'bg-emerald-50/40 border-emerald-200'
      } ${compact ? 'p-3.5' : 'p-4 sm:p-5'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-black/5 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#0F5132]/10 text-[#0F5132] flex items-center justify-center">
            <Eye className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <span>Photo Freshness Inspection</span>
              {isManualScore && (
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-gray-200 text-gray-700">
                  Manual Slider
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Confidence chip & actions */}
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${
              confidence === 'high'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : confidence === 'medium'
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-gray-100 text-gray-700 border-gray-300'
            }`}
          >
            {confidence} confidence
          </span>

          {onRemovePhoto && (
            <button
              type="button"
              onClick={onRemovePhoto}
              className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Remove photo check"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body: Thumbnail + Gauge + Details */}
      <div className="mt-3.5 flex flex-col sm:flex-row items-start gap-4">
        
        {/* Photo Thumbnail */}
        <div className="relative group shrink-0">
          <img
            src={thumbnailUrl}
            alt={food_identified || 'Food inspection item'}
            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-gray-300 shadow-2xs group-hover:scale-102 transition-transform"
          />
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
            1024px max
          </div>
        </div>

        {/* Score Gauge & Identification */}
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Food Identified
              </span>
              <span className="text-sm sm:text-base font-extrabold text-gray-900">
                {food_identified || 'Perishable batch'}
              </span>
            </div>

            {/* Freshness Score Gauge Display */}
            <div className="flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-xl border border-gray-200/90 shadow-2xs">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Freshness Score</span>
                <span className="text-xs font-semibold text-gray-600">{scoreTheme.statusLabel}</span>
              </div>
              <div
                className={`text-xl sm:text-2xl font-black font-mono px-2 py-0.5 rounded-lg border ${scoreTheme.badgeBg}`}
              >
                {freshness_score}
                <span className="text-xs font-normal opacity-70">/100</span>
              </div>
            </div>
          </div>

          {/* Note from Gemini */}
          {note && (
            <p className="text-xs text-gray-700 italic bg-white/60 p-2 rounded-lg border border-black/5">
              "{note}"
            </p>
          )}

          {/* Visible Issues Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] uppercase font-bold text-gray-500 mr-1">Visible issues:</span>
            {visible_issues && visible_issues.length > 0 ? (
              visible_issues.map((issue, idx) => {
                const isNone = issue.toLowerCase() === 'none';
                return (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 text-xs font-bold rounded-md border ${
                      isNone
                        ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300'
                        : 'bg-red-100 text-red-800 border-red-300'
                    }`}
                  >
                    {isNone ? '✓ None observed' : `⚠ ${issue}`}
                  </span>
                );
              })
            ) : (
              <span className="text-xs text-gray-500">None detected</span>
            )}
          </div>
        </div>

      </div>

      {/* Clock Adjustment Rule Notice */}
      <div className="mt-3.5 pt-3 border-t border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-gray-700 font-medium">
          <Info className="w-3.5 h-3.5 text-[#0F5132] shrink-0" />
          <span>
            <strong>Impact on Spoilage Clock:</strong> {scoreTheme.clockEffect}
          </span>
        </div>
        <span className="text-[10px] text-gray-400">
          Thresholds: {photoRules.highThreshold} / {photoRules.lowThreshold} (illustrative defaults)
        </span>
      </div>

      {/* Mandatory Human Confirmation Line */}
      <div className="mt-2 text-center text-[11px] font-semibold text-gray-500 border-t border-black/5 pt-1.5">
        Decision support only: a human confirms every decision.
      </div>

    </div>
  );
};
