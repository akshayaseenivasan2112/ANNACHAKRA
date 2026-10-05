import React, { useState } from 'react';
import {
  FoodBatch,
  FoodCategory,
  StorageType,
  Allergen,
  PhotoFreshnessResult,
  PhotoRuleSettings,
  VoiceBatchExtraction,
} from '../types/batch';
import {
  PlusCircle,
  Sparkles,
  Utensils,
  Thermometer,
  Scale,
  Calendar,
  Layers,
  ShieldAlert,
  Info,
  CheckCheck,
} from 'lucide-react';
import { PhotoUploadButton } from './PhotoUploadButton';
import { PhotoFreshnessCard } from './PhotoFreshnessCard';
import { VoiceBatchRecorder } from './VoiceBatchRecorder';

interface FoodPassportFormProps {
  onCreateBatch: (batch: FoodBatch) => void;
  onLoadDemoBatch: () => void;
  simulatedTimeMs: number;
  photoRules: PhotoRuleSettings;
}

const ALLERGEN_OPTIONS: Allergen[] = [
  'Peanut',
  'Gluten',
  'Milk',
  'Egg',
  'Soy',
  'Tree nuts',
  'None',
];

export const FoodPassportForm: React.FC<FoodPassportFormProps> = ({
  onCreateBatch,
  onLoadDemoBatch,
  simulatedTimeMs,
  photoRules,
}) => {
  const toDateTimeLocalString = (epochMs: number) => {
    const d = new Date(epochMs);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const [dishName, setDishName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Cooked');
  const [quantityKg, setQuantityKg] = useState<string>('25');
  const [preparedTimeString, setPreparedTimeString] = useState<string>(
    toDateTimeLocalString(simulatedTimeMs)
  );
  const [storageType, setStorageType] = useState<StorageType>('Ambient');
  const [allergens, setAllergens] = useState<Allergen[]>(['None']);
  const [nutritionKcal, setNutritionKcal] = useState<string>('');
  const [initialTempC, setInitialTempC] = useState<string>('25');
  const [notes, setNotes] = useState<string>('');
  const [isReusableInHouse, setIsReusableInHouse] = useState<boolean>(false);
  const [reuseIdea, setReuseIdea] = useState<string>('');

  // Attached Photo Freshness Check
  const [attachedPhoto, setAttachedPhoto] = useState<PhotoFreshnessResult | null>(null);

  // Tracking fields auto-filled by voice
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [hasVoiceEntry, setHasVoiceEntry] = useState<boolean>(false);

  const [formError, setFormError] = useState<string | null>(null);

  const handleStorageTypeChange = (newType: StorageType) => {
    setStorageType(newType);
    if (!autoFilledFields.has('initialTempC')) {
      if (newType === 'Ambient') {
        setInitialTempC('25');
      } else if (newType === 'Chilled') {
        setInitialTempC('4.5');
      } else if (newType === 'Hot-hold') {
        setInitialTempC('65');
      }
    }
  };

  const toggleAllergen = (item: Allergen) => {
    if (item === 'None') {
      setAllergens(['None']);
      return;
    }

    setAllergens((prev) => {
      const filtered = prev.filter((a) => a !== 'None');
      if (filtered.includes(item)) {
        const remaining = filtered.filter((a) => a !== item);
        return remaining.length === 0 ? ['None'] : remaining;
      } else {
        return [...filtered, item];
      }
    });
  };

  const handleSetPreparedTimeToNow = () => {
    setPreparedTimeString(toDateTimeLocalString(simulatedTimeMs));
  };

  const handleSetPreparedTimeOneHourAgo = () => {
    setPreparedTimeString(toDateTimeLocalString(simulatedTimeMs - 3600 * 1000));
  };

  // Handle Voice Note extraction callback
  const handleVoiceExtraction = (extraction: VoiceBatchExtraction) => {
    const newFilled = new Set<string>();

    if (extraction.dish) {
      setDishName(extraction.dish);
      newFilled.add('dishName');
    }

    if (extraction.category) {
      setCategory(extraction.category);
      newFilled.add('category');
    }

    if (extraction.quantity_kg !== null && extraction.quantity_kg > 0) {
      setQuantityKg(String(extraction.quantity_kg));
      newFilled.add('quantityKg');
    }

    if (extraction.temperature_c !== null) {
      setInitialTempC(String(extraction.temperature_c));
      newFilled.add('initialTempC');
    }

    if (extraction.storage) {
      setStorageType(extraction.storage);
      newFilled.add('storageType');
    }

    if (Array.isArray(extraction.allergens) && extraction.allergens.length > 0) {
      // Map extracted strings to Allergen union
      const matchedAllergens: Allergen[] = [];
      extraction.allergens.forEach((algStr) => {
        const lower = algStr.toLowerCase();
        ALLERGEN_OPTIONS.forEach((opt) => {
          if (lower.includes(opt.toLowerCase())) {
            matchedAllergens.push(opt);
          }
        });
      });

      if (matchedAllergens.length > 0) {
        setAllergens(matchedAllergens);
        newFilled.add('allergens');
      }
    }

    setAutoFilledFields(newFilled);
    setHasVoiceEntry(true);
  };

  // Handle Photo Freshness analysis callback
  const handlePhotoAnalyzed = (photoResult: PhotoFreshnessResult) => {
    setAttachedPhoto(photoResult);
    // If food identified and dish name is empty, auto-populate dish name
    if (photoResult.food_identified && !dishName.trim() && photoResult.is_food) {
      setDishName(photoResult.food_identified);
      setAutoFilledFields((prev) => new Set([...prev, 'dishName']));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = dishName.trim();
    if (!trimmedName) {
      setFormError('Please enter a dish name.');
      return;
    }

    const qty = parseFloat(quantityKg);
    if (isNaN(qty) || qty <= 0) {
      setFormError('Please enter a valid quantity in kg (greater than 0).');
      return;
    }

    const temp = parseFloat(initialTempC);
    if (isNaN(temp)) {
      setFormError('Please enter a valid initial storage temperature in °C.');
      return;
    }

    let prepTimestamp = new Date(preparedTimeString).getTime();
    if (isNaN(prepTimestamp)) {
      prepTimestamp = simulatedTimeMs;
    }

    const newBatch: FoodBatch = {
      id: `batch-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      dishName: trimmedName,
      category,
      quantityKg: qty,
      preparedTime: prepTimestamp,
      storageType,
      allergens: allergens.length > 0 ? allergens : ['None'],
      nutritionKcalPer100g: nutritionKcal.trim() ? parseFloat(nutritionKcal) : null,
      initialTempC: temp,
      photoResult: attachedPhoto,
      isReusableInHouse,
      reuseIdea: isReusableInHouse ? reuseIdea.trim() || undefined : undefined,
      readings: [
        {
          id: `reading-init-${Date.now()}`,
          timestamp: prepTimestamp,
          temperatureC: temp,
          note: 'Initial storage reading on creation',
        },
      ],
      notes: notes.trim() || undefined,
      createdAt: simulatedTimeMs,
    };

    onCreateBatch(newBatch);

    // Reset fields
    setDishName('');
    setNotes('');
    setAttachedPhoto(null);
    setIsReusableInHouse(false);
    setReuseIdea('');
    setAutoFilledFields(new Set());
    setHasVoiceEntry(false);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200/90 p-5 sm:p-7 mb-8 transition-shadow hover:shadow-md space-y-6">
      
      {/* Top Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <span className="w-2.5 h-6 bg-[#0F5132] rounded-full inline-block" />
            Food Passport Intake
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Register batches via manual input, multilingual voice, or photo freshness check
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Photo Button on form */}
          <PhotoUploadButton
            onPhotoAnalyzed={handlePhotoAnalyzed}
            buttonText={attachedPhoto ? 'Change photo' : 'Add photo check'}
            variant="secondary"
            currentPhoto={attachedPhoto}
          />

          {/* Load demo batch button */}
          <button
            type="button"
            onClick={onLoadDemoBatch}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 hover:border-amber-400 active:scale-95 transition-all shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-[#D97706]" />
            <span>Load demo batch</span>
          </button>
        </div>
      </div>

      {/* PART B: Voice Entry for Workers */}
      <VoiceBatchRecorder onExtractionSuccess={handleVoiceExtraction} />

      {/* Attached Photo Freshness Inspection Card (if taken) */}
      {attachedPhoto && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
            Attached Visual Freshness Inspection
          </span>
          <PhotoFreshnessCard
            photoResult={attachedPhoto}
            photoRules={photoRules}
            onRemovePhoto={() => setAttachedPhoto(null)}
            compact={true}
          />
        </div>
      )}

      {formError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
          
          {/* Dish Name */}
          <div className="md:col-span-6">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-[#0F5132]" />
                Dish / Food Item Name <span className="text-red-500">*</span>
              </label>
              {autoFilledFields.has('dishName') && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Auto-filled by voice
                </span>
              )}
            </div>
            <input
              type="text"
              value={dishName}
              onChange={(e) => {
                setDishName(e.target.value);
                setAutoFilledFields((prev) => {
                  const s = new Set(prev);
                  s.delete('dishName');
                  return s;
                });
              }}
              placeholder="e.g. Vegetable curry, Dal Tadka, Fresh Paneer"
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#0F5132] ${
                autoFilledFields.has('dishName')
                  ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950 font-bold'
                  : 'bg-gray-50/60 border-gray-300 text-gray-900 focus:bg-white'
              }`}
              required
            />
          </div>

          {/* Category */}
          <div className="md:col-span-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0F5132]" />
                Category <span className="text-red-500">*</span>
              </label>
              {autoFilledFields.has('category') && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                  Voice
                </span>
              )}
            </div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as FoodCategory);
                setAutoFilledFields((prev) => {
                  const s = new Set(prev);
                  s.delete('category');
                  return s;
                });
              }}
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#0F5132] ${
                autoFilledFields.has('category')
                  ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950'
                  : 'bg-gray-50/60 border-gray-300 text-gray-900 focus:bg-white'
              }`}
            >
              <option value="Cooked">Cooked (4h ambient / 48h chill)</option>
              <option value="Raw/Bulk">Raw / Bulk (8h ambient / 72h chill)</option>
              <option value="Packaged">Packaged (168h baseline)</option>
            </select>
          </div>

          {/* Quantity in kg */}
          <div className="md:col-span-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[#0F5132]" />
                Quantity (kg) <span className="text-red-500">*</span>
              </label>
              {autoFilledFields.has('quantityKg') && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                  Voice
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={quantityKg}
                onChange={(e) => {
                  setQuantityKg(e.target.value);
                  setAutoFilledFields((prev) => {
                    const s = new Set(prev);
                    s.delete('quantityKg');
                    return s;
                  });
                }}
                placeholder="40"
                className={`w-full pl-3.5 pr-10 py-2.5 border rounded-xl text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#0F5132] ${
                  autoFilledFields.has('quantityKg')
                    ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950'
                    : 'bg-gray-50/60 border-gray-300 text-gray-900 focus:bg-white'
                }`}
                required
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-gray-400">kg</span>
            </div>
          </div>

          {/* Prepared Time */}
          <div className="md:col-span-5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0F5132]" />
                Prepared Time <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSetPreparedTimeToNow}
                  className="text-[11px] font-semibold text-[#0F5132] hover:underline"
                >
                  Now
                </button>
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={handleSetPreparedTimeOneHourAgo}
                  className="text-[11px] font-semibold text-gray-500 hover:text-gray-800"
                >
                  -1 hr ago
                </button>
              </div>
            </div>
            <input
              type="datetime-local"
              value={preparedTimeString}
              onChange={(e) => setPreparedTimeString(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50/60 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F5132] transition-all font-mono"
              required
            />
          </div>

          {/* Storage Type */}
          <div className="md:col-span-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Storage Type <span className="text-red-500">*</span>
              </label>
              {autoFilledFields.has('storageType') && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                  Voice
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['Ambient', 'Chilled', 'Hot-hold'] as const).map((type) => {
                const isSelected = storageType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleStorageTypeChange(type)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-[#0F5132] text-white border-[#0F5132] shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Initial Temperature */}
          <div className="md:col-span-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-[#0F5132]" />
                Initial Temp (°C) <span className="text-red-500">*</span>
              </label>
              {autoFilledFields.has('initialTempC') && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                  Voice
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={initialTempC}
                onChange={(e) => {
                  setInitialTempC(e.target.value);
                  setAutoFilledFields((prev) => {
                    const s = new Set(prev);
                    s.delete('initialTempC');
                    return s;
                  });
                }}
                placeholder="28"
                className={`w-full pl-3.5 pr-10 py-2.5 border rounded-xl text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#0F5132] ${
                  autoFilledFields.has('initialTempC')
                    ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950'
                    : 'bg-gray-50/60 border-gray-300 text-gray-900 focus:bg-white'
                }`}
                required
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-gray-400">°C</span>
            </div>
          </div>

          {/* Allergens Chips Multi-Select */}
          <div className="md:col-span-8">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Allergens (Select all applicable)
              </label>
              {autoFilledFields.has('allergens') && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                  Voice
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {ALLERGEN_OPTIONS.map((item) => {
                const isSelected = allergens.includes(item);
                const isNone = item === 'None';
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAllergen(item)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      isSelected
                        ? isNone
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold'
                          : 'bg-amber-100 text-amber-900 border-amber-400 font-bold shadow-xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {isSelected && <span className="mr-1">✓</span>}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nutrition kcal (optional) */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center justify-between">
              <span>Nutrition (kcal / 100g)</span>
              <span className="text-[10px] text-gray-400 font-normal uppercase">Optional</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="0"
                value={nutritionKcal}
                onChange={(e) => setNutritionKcal(e.target.value)}
                placeholder="e.g. 115"
                className="w-full pl-3.5 pr-14 py-2.5 bg-gray-50/60 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F5132] transition-all"
              />
              <span className="absolute right-3 top-2.5 text-[11px] font-semibold text-gray-400">kcal/100g</span>
            </div>
          </div>

          {/* EXTRA FIELD: Reusable in our own kitchen & Reuse Idea */}
          <div className="md:col-span-12 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2.5">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="reusableInHouse"
                checked={isReusableInHouse}
                onChange={(e) => setIsReusableInHouse(e.target.checked)}
                className="w-4 h-4 text-[#0F5132] accent-[#0F5132] rounded border-gray-300 cursor-pointer"
              />
              <label htmlFor="reusableInHouse" className="text-xs sm:text-sm font-bold text-gray-800 cursor-pointer">
                Reusable in our own kitchen (e.g. chapati to evening snack)
              </label>
            </div>

            {isReusableInHouse && (
              <div className="pt-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-900 mb-1">
                  Reuse idea (optional)
                </label>
                <input
                  type="text"
                  value={reuseIdea}
                  onChange={(e) => setReuseIdea(e.target.value)}
                  placeholder="e.g. Repurpose vegetable curry into samosa filling or evening soup base"
                  className="w-full px-3.5 py-2 bg-white border border-emerald-300 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                />
              </div>
            )}
          </div>

        </div>

        {/* Submit Bar with Worker Confirmation */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#0F5132] shrink-0" />
            <span>
              {hasVoiceEntry
                ? 'Review auto-filled fields above before confirming batch creation.'
                : 'Clock automatically begins at prepared time with initial temperature.'}
            </span>
          </div>

          <button
            type="submit"
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold shadow-md hover:shadow-lg transition-all ${
              hasVoiceEntry
                ? 'bg-[#166534] hover:bg-[#14532d] ring-2 ring-emerald-300'
                : 'bg-[#0F5132] hover:bg-[#14663f]'
            }`}
          >
            {hasVoiceEntry ? (
              <>
                <CheckCheck className="w-4 h-4 text-emerald-200" />
                <span>Confirm and create batch</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 text-emerald-300" />
                <span>Create batch</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
