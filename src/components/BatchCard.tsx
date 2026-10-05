import React, { useState } from 'react';
import {
  FoodBatch,
  StorageConfigMap,
  TemperatureReading,
  PhotoRuleSettings,
  PhotoFreshnessResult,
} from '../types/batch';
import {
  calculateBatchSpoilage,
  formatCountdown,
  formatDateTime,
  getStatusTheme,
} from '../utils/spoilage';
import {
  Clock,
  Thermometer,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Snowflake,
  Sun,
  Activity,
  ChevronDown,
  ChevronUp,
  History,
  ShieldAlert,
  Camera,
  Layers,
} from 'lucide-react';
import { PhotoUploadButton } from './PhotoUploadButton';
import { PhotoFreshnessCard } from './PhotoFreshnessCard';

interface BatchCardProps {
  batch: FoodBatch;
  simulatedTimeMs: number;
  configs: StorageConfigMap;
  photoRules: PhotoRuleSettings;
  onAddReading: (batchId: string, reading: TemperatureReading) => void;
  onDeleteReading: (batchId: string, readingId: string) => void;
  onDeleteBatch: (batchId: string) => void;
  onUpdateBatchPhoto: (batchId: string, photo: PhotoFreshnessResult | null) => void;
}

export const BatchCard: React.FC<BatchCardProps> = ({
  batch,
  simulatedTimeMs,
  configs,
  photoRules,
  onAddReading,
  onDeleteReading,
  onDeleteBatch,
  onUpdateBatchPhoto,
}) => {
  const [newTempInput, setNewTempInput] = useState<string>('');
  const [newNoteInput, setNewNoteInput] = useState<string>('');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string | null>(null);

  // Compute Arrhenius spoilage combined with photo freshness rule
  const spoilage = calculateBatchSpoilage(batch, simulatedTimeMs, configs, photoRules);
  const statusTheme = getStatusTheme(spoilage.status);

  // Remaining live countdown string
  const countdownDisplay = formatCountdown(spoilage.projectedRemainingSeconds);

  const handleAddReadingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);

    const temp = parseFloat(newTempInput);
    if (isNaN(temp)) {
      setInputError('Enter a valid temperature in °C.');
      return;
    }

    const reading: TemperatureReading = {
      id: `reading-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: simulatedTimeMs,
      temperatureC: temp,
      note: newNoteInput.trim() || undefined,
    };

    onAddReading(batch.id, reading);
    setNewTempInput('');
    setNewNoteInput('');
  };

  const handleQuickAddTemp = (tempC: number, label: string) => {
    const reading: TemperatureReading = {
      id: `reading-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: simulatedTimeMs,
      temperatureC: tempC,
      note: label,
    };
    onAddReading(batch.id, reading);
  };

  const getStorageIcon = (type: string) => {
    switch (type) {
      case 'Chilled':
        return <Snowflake className="w-3.5 h-3.5 text-blue-500" />;
      case 'Hot-hold':
        return <Flame className="w-3.5 h-3.5 text-orange-500" />;
      default:
        return <Sun className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  return (
    <div
      className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${
        spoilage.status === 'Unsafe: never offer as food'
          ? 'border-gray-400 bg-gray-50/60'
          : spoilage.status === 'Urgent'
          ? 'border-red-300 ring-1 ring-red-200'
          : spoilage.status === 'Use soon'
          ? 'border-amber-300'
          : 'border-emerald-200'
      }`}
    >
      {/* Top Banner / Status Strip */}
      <div className="px-5 pt-4 pb-3 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          {/* Category Chip */}
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-200 text-gray-800 tracking-wide uppercase">
            {batch.category}
          </span>

          {/* Storage Type */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-gray-200 text-gray-700 shadow-2xs">
            {getStorageIcon(batch.storageType)}
            <span>{batch.storageType}</span>
          </span>

          <span className="text-xs text-gray-400 font-mono">
            ID: {batch.id.slice(-6).toUpperCase()}
          </span>
        </div>

        {/* Action Controls: Add photo + Delete batch */}
        <div className="flex items-center gap-2">
          
          {/* Add / Retake Photo Button on batch card */}
          <PhotoUploadButton
            onPhotoAnalyzed={(photo) => onUpdateBatchPhoto(batch.id, photo)}
            buttonText={batch.photoResult ? 'Retake photo' : 'Add photo'}
            variant="compact"
            currentPhoto={batch.photoResult}
          />

          {/* Status Chip */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusTheme.badgeBg} shadow-2xs`}
          >
            {spoilage.status === 'Safe' && <CheckCircle2 className="w-3.5 h-3.5" />}
            {spoilage.status === 'Use soon' && <AlertTriangle className="w-3.5 h-3.5" />}
            {spoilage.status === 'Urgent' && <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />}
            {spoilage.status === 'Unsafe: never offer as food' && <ShieldAlert className="w-3.5 h-3.5" />}
            <span>{spoilage.status}</span>
          </span>

          {/* Delete Batch Button */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Delete batch "${batch.dishName}"?`)) {
                onDeleteBatch(batch.id);
              }
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete this food batch"
            aria-label="Delete batch"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        
        {/* Title and Food Passport Details */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {batch.dishName}
            </h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs sm:text-sm text-gray-600">
            <span className="font-semibold text-gray-800">
              Quantity: <span className="text-[#0F5132] font-bold">{batch.quantityKg} kg</span>
            </span>
            <span className="text-gray-300">•</span>
            <span>
              Prepared: <span className="font-medium text-gray-700">{formatDateTime(batch.preparedTime)}</span>
            </span>
            {batch.nutritionKcalPer100g && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-amber-800 font-medium">
                  {batch.nutritionKcalPer100g} kcal/100g
                </span>
              </>
            )}
            {batch.isReusableInHouse && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Kitchen Reusable {batch.reuseIdea ? `("${batch.reuseIdea}")` : ''}
                </span>
              </>
            )}
            {batch.dispatchOffer && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 border border-amber-300">
                  Offered to: {batch.dispatchOffer.receiverName}
                </span>
              </>
            )}
          </div>

          {/* Allergens Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mr-1">Allergens:</span>
            {batch.allergens && batch.allergens.length > 0 ? (
              batch.allergens.map((alg) => (
                <span
                  key={alg}
                  className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${
                    alg === 'None'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border-amber-200 font-bold'
                  }`}
                >
                  {alg}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500">None specified</span>
            )}
          </div>
        </div>

        {/* Live Spoilage Clock Display Box */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            spoilage.status === 'Unsafe: never offer as food'
              ? 'bg-slate-900 text-white border-slate-700'
              : spoilage.status === 'Urgent'
              ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-300'
              : spoilage.status === 'Use soon'
              ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300'
              : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Clock Big Countdown */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className={`w-4 h-4 ${spoilage.status === 'Unsafe: never offer as food' ? 'text-gray-300' : 'text-gray-700'}`} />
                <span className={`text-xs font-extrabold uppercase tracking-widest ${spoilage.status === 'Unsafe: never offer as food' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Live Safe Countdown
                </span>
                {batch.photoResult && batch.photoResult.is_food && (
                  <span className="text-[10px] px-2 py-0.2 rounded font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Photo Adjusted
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2">
                <div
                  className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-mono tabular-nums ${
                    spoilage.status === 'Unsafe: never offer as food'
                      ? 'text-red-400'
                      : statusTheme.clockColor
                  }`}
                >
                  {countdownDisplay}
                </div>
                <div className="text-xs font-medium opacity-80">
                  {spoilage.isExpired ? 'expired' : 'remaining'}
                </div>
              </div>

              {/* Both numbers display: "Clock hours" and "Adjusted by photo" */}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <div className="flex items-center gap-1 font-semibold">
                  <span className={spoilage.status === 'Unsafe: never offer as food' ? 'text-gray-300' : 'text-gray-600'}>
                    Clock hours:
                  </span>
                  <span className="font-mono font-bold text-gray-900 bg-white/70 px-1.5 py-0.5 rounded border border-black/5">
                    {spoilage.rawSafeHoursLeft.toFixed(2)}h
                  </span>
                </div>

                <div className="flex items-center gap-1 font-semibold">
                  <span className={spoilage.status === 'Unsafe: never offer as food' ? 'text-gray-300' : 'text-gray-600'}>
                    Adjusted by photo:
                  </span>
                  <span
                    className={`font-mono font-bold px-1.5 py-0.5 rounded border ${
                      spoilage.photoAdjustmentApplied
                        ? 'bg-amber-100 text-amber-950 border-amber-300'
                        : 'bg-white/70 text-gray-900 border-black/5'
                    }`}
                  >
                    {batch.photoResult && batch.photoResult.is_food
                      ? `${spoilage.safeHoursLeft.toFixed(2)}h`
                      : '— (no photo)'}
                  </span>
                </div>
              </div>

              {spoilage.photoRuleNote && (
                <p className="text-[11px] text-amber-800 font-medium mt-1">
                  {spoilage.photoRuleNote}
                  <span className="text-gray-400 ml-1">(illustrative defaults)</span>
                </p>
              )}
            </div>

            {/* MKT & Thermal Acceleration Telemetry */}
            <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 text-right">
              {/* Mean Kinetic Temperature */}
              <div className="bg-white/90 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-gray-200/80 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Mean Kinetic Temp</span>
                <span className="text-base sm:text-lg font-extrabold text-[#0F5132] font-mono">
                  {spoilage.meanKineticTempC} °C
                </span>
              </div>

              {/* Rate factor badge */}
              <div className="bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-gray-200/80 shadow-2xs flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#D97706]" />
                <div className="text-left md:text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Arrhenius Rate</span>
                  <span className="text-xs font-bold text-gray-800 font-mono">
                    {spoilage.currentRateFactor.toFixed(2)}x <span className="font-normal text-gray-500">at {spoilage.currentTempC}°C</span>
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Progress bar */}
          <div className="mt-4 pt-3 border-t border-black/10">
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className={spoilage.status === 'Unsafe: never offer as food' ? 'text-gray-300' : 'text-gray-700'}>
                Safe Life Remaining: {spoilage.percentageLeft.toFixed(1)}%
              </span>
              <span className={spoilage.status === 'Unsafe: never offer as food' ? 'text-gray-400' : 'text-gray-500'}>
                Consumed: {spoilage.consumedRefHours.toFixed(2)}h / {spoilage.baseSafeHours}h base
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-black/10 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${statusTheme.progressBg}`}
                style={{ width: `${spoilage.percentageLeft}%` }}
              />
            </div>
          </div>

        </div>

        {/* PART A: Photo Freshness Result Card on Batch */}
        {batch.photoResult && (
          <div className="space-y-1">
            <PhotoFreshnessCard
              photoResult={batch.photoResult}
              photoRules={photoRules}
              onRemovePhoto={() => onUpdateBatchPhoto(batch.id, null)}
              onRetakePhoto={() => {
                // Handled via PhotoUploadButton in card header
              }}
            />
          </div>
        )}

        {/* Temperature Readings & Add Reading Section */}
        <div className="space-y-3 pt-2">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-[#0F5132]" />
              <h4 className="text-sm font-bold text-gray-900">
                Temperature History & Readings
              </h4>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gray-100 text-gray-700">
                {batch.readings?.length || 0}
              </span>
            </div>

            {/* Quick Presets for Demo / Testing */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-gray-400 mr-1">Quick Log:</span>
              <button
                type="button"
                onClick={() => handleQuickAddTemp(4.0, 'Placed in 4°C refrigerator')}
                className="px-2 py-1 text-[11px] font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                title="Log 4°C chilled cold storage"
              >
                + 4°C Chill
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddTemp(25.0, 'Ambient 25°C room temp')}
                className="px-2 py-1 text-[11px] font-semibold rounded-md bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                title="Log 25°C room ambient"
              >
                + 25°C Room
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddTemp(32.0, 'Loading dock spike 32°C')}
                className="px-2 py-1 text-[11px] font-semibold rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                title="Log thermal spike at 32°C"
              >
                + 32°C Spike
              </button>
            </div>
          </div>

          {/* Add Temperature Reading Input Form */}
          <form
            onSubmit={handleAddReadingSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200/80"
          >
            <div className="relative flex-1 sm:max-w-[150px]">
              <input
                type="number"
                step="0.1"
                value={newTempInput}
                onChange={(e) => setNewTempInput(e.target.value)}
                placeholder="e.g. 26.5"
                className="w-full pl-3 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                required
              />
              <span className="absolute right-2.5 top-2 text-xs font-bold text-gray-400">°C</span>
            </div>

            <div className="flex-1">
              <input
                type="text"
                value={newNoteInput}
                onChange={(e) => setNewNoteInput(e.target.value)}
                placeholder="Optional probe note (e.g. In transit, Bay 3)"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0F5132] hover:bg-[#14663f] text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add reading</span>
            </button>
          </form>

          {inputError && (
            <p className="text-xs text-red-600 font-medium">{inputError}</p>
          )}

          {/* Toggle History List Button */}
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full py-1.5 flex items-center justify-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>
              {showHistory ? 'Hide temperature log' : `View ${batch.readings?.length || 0} recorded readings`}
            </span>
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Collapsible Readings Timeline */}
          {showHistory && (
            <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                {batch.readings && batch.readings.length > 0 ? (
                  batch.readings
                    .slice()
                    .reverse()
                    .map((reading) => {
                      const readingTemp = reading.temperatureC;
                      return (
                        <div
                          key={reading.id}
                          className="px-3.5 py-2 flex items-center justify-between text-xs hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-bold ${
                                readingTemp > 30
                                  ? 'bg-red-100 text-red-800'
                                  : readingTemp > 15
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {readingTemp} °C
                            </span>
                            <span className="text-gray-500 font-mono">
                              {formatDateTime(reading.timestamp)}
                            </span>
                            {reading.note && (
                              <span className="text-gray-600 italic">"{reading.note}"</span>
                            )}
                          </div>

                          {batch.readings.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onDeleteReading(batch.id, reading.id)}
                              className="text-gray-400 hover:text-red-500 p-1 rounded"
                              title="Delete this reading"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })
                ) : (
                  <div className="p-3 text-center text-xs text-gray-400">
                    No readings logged yet
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
