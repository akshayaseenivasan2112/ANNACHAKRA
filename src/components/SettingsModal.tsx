import React, { useState } from 'react';
import {
  StorageConfigMap,
  PhotoRuleSettings,
  LogisticsSettings,
  MatchWeights,
  DonorProfile,
  DonorType,
  AppSettings,
} from '../types/batch';
import { DEFAULT_STORAGE_CONFIGS, DEFAULT_PHOTO_RULES } from '../utils/spoilage';
import {
  DEFAULT_LOGISTICS_SETTINGS,
  DEFAULT_MATCH_WEIGHTS,
} from '../utils/matchEngine';
import { DEFAULT_DEMO_SIGNING_KEY } from '../utils/cryptoLog';
import {
  X,
  Sliders,
  RotateCcw,
  Check,
  Info,
  Camera,
  Truck,
  Building2,
  ShieldCheck,
  ShieldAlert,
  Key,
  DollarSign,
  Award,
} from 'lucide-react';

export const DEFAULT_DONOR_PROFILE: DonorProfile = {
  name: 'Ananta Central Kitchen (SIH 2026)',
  type: 'Canteen',
  fssaiNumber: '10020043000123',
  address: 'Hubli Innovation Complex, Sector 4',
  contactPerson: 'Head Chef Anand',
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  configs: StorageConfigMap;
  photoRules: PhotoRuleSettings;
  logistics: LogisticsSettings;
  matchWeights: MatchWeights;
  donorProfile: DonorProfile;
  settings: AppSettings;
  onSaveAllSettings: (
    newConfigs: StorageConfigMap,
    newPhotoRules: PhotoRuleSettings,
    newLogistics: LogisticsSettings,
    newMatchWeights: MatchWeights,
    newDonorProfile: DonorProfile,
    newSettings: AppSettings
  ) => void;
  onResetConfigs: () => void;
  onResetAllDemoData?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  configs,
  photoRules,
  logistics,
  matchWeights,
  donorProfile,
  settings,
  onSaveAllSettings,
  onResetConfigs,
  onResetAllDemoData,
}) => {
  const [localConfigs, setLocalConfigs] = useState<StorageConfigMap>(configs);
  const [localPhotoRules, setLocalPhotoRules] = useState<PhotoRuleSettings>(photoRules);
  const [localLogistics, setLocalLogistics] = useState<LogisticsSettings>(logistics);
  const [localMatchWeights, setLocalMatchWeights] = useState<MatchWeights>(matchWeights);
  const [localDonorProfile, setLocalDonorProfile] = useState<DonorProfile>(donorProfile);
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  if (!isOpen) return null;

  // 14-digit FSSAI format validation: exactly 14 digits
  const isFssaiValid = /^\d{14}$/.test(localDonorProfile.fssaiNumber.trim());

  const handleUpdateDonor = (field: keyof DonorProfile, value: string) => {
    setLocalDonorProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    onSaveAllSettings(
      localConfigs,
      localPhotoRules,
      localLogistics,
      localMatchWeights,
      localDonorProfile,
      localSettings
    );
    onClose();
  };

  const handleResetToDefaults = () => {
    setLocalConfigs(DEFAULT_STORAGE_CONFIGS);
    setLocalPhotoRules(DEFAULT_PHOTO_RULES);
    setLocalLogistics(DEFAULT_LOGISTICS_SETTINGS);
    setLocalMatchWeights(DEFAULT_MATCH_WEIGHTS);
    setLocalDonorProfile(DEFAULT_DONOR_PROFILE);
    onResetConfigs();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4.5 bg-[#0F5132] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="text-lg font-bold">AnnaChakra Configuration Hub</h3>
              <p className="text-xs text-emerald-100/90">
                Donor identity, FSSAI compliance, Arrhenius kinetics, and WhatsApp alert gateways
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-6">
          
          {/* SECTION 1: Donor Profile + FSSAI Check */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#0F5132]" />
                Donor Profile & FSSAI FoSCoS Verification
              </h4>
              {isFssaiValid ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  FSSAI number format valid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  Must be exactly 14 digits
                </span>
              )}
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-3.5 text-xs text-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Donor Name */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Donor Entity Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={localDonorProfile.name}
                    onChange={(e) => handleUpdateDonor('name', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-[#0F5132]"
                  />
                </div>

                {/* Donor Type */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Donor Facility Type
                  </label>
                  <select
                    value={localDonorProfile.type}
                    onChange={(e) => handleUpdateDonor('type', e.target.value as DonorType)}
                    className="w-full px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-[#0F5132]"
                  >
                    <option value="Canteen">Canteen</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Hospital">Hospital</option>
                    <option value="Caterer">Caterer</option>
                    <option value="Food factory">Food factory</option>
                  </select>
                </div>

                {/* FSSAI Registration Number (14 Digits) */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                      <span>FSSAI Licence / Registration Number (14 digits)</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-gray-400">
                      {localDonorProfile.fssaiNumber.length}/14 digits
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={14}
                    value={localDonorProfile.fssaiNumber}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      handleUpdateDonor('fssaiNumber', clean);
                    }}
                    placeholder="e.g. 10020043000123"
                    className={`w-full px-3 py-2 text-xs font-mono font-bold border rounded-xl bg-white tracking-widest ${
                      isFssaiValid
                        ? 'border-emerald-400 text-emerald-950 focus:ring-2 focus:ring-emerald-500'
                        : 'border-red-400 text-red-950 focus:ring-2 focus:ring-red-500'
                    }`}
                  />
                  <p className="text-[10px] text-gray-500 mt-1 italic">
                    Format check only. Registry verification (FSSAI FoSCoS) is planned for the pilot.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Handover Limits & Alert Feasibility */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#0F5132]" />
              Handover Safety Thresholds & Feasibility
            </h4>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Min Hot Handover (°C)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={localSettings.minHandoverHotTempC}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        minHandoverHotTempC: Number(e.target.value),
                      }))
                    }
                    className="w-full px-2.5 py-1 text-xs font-bold border border-gray-300 rounded-lg bg-white"
                  />
                  <span className="absolute right-2 top-1 text-[11px] text-gray-400 font-bold">°C</span>
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5 block">HACCP minimum 60°C</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Max Chilled Handover (°C)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={localSettings.maxHandoverChilledTempC}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        maxHandoverChilledTempC: Number(e.target.value),
                      }))
                    }
                    className="w-full px-2.5 py-1 text-xs font-bold border border-gray-300 rounded-lg bg-white"
                  />
                  <span className="absolute right-2 top-1 text-[11px] text-gray-400 font-bold">°C</span>
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5 block">Cold chain max 8°C</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Alert Cost Estimate (₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={localSettings.alertCostEstimateRupees}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        alertCostEstimateRupees: Number(e.target.value),
                      }))
                    }
                    className="w-full px-2.5 py-1 text-xs font-bold border border-gray-300 rounded-lg bg-white"
                  />
                  <span className="absolute right-2 top-1 text-[11px] text-gray-400 font-bold">₹</span>
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5 block">WhatsApp / SMS rate</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Meal Serving Size (kg)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={localSettings.mealServingKg}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      mealServingKg: Number(e.target.value),
                    }))
                  }
                  className="w-full px-2.5 py-1 text-xs font-bold border border-gray-300 rounded-lg bg-white"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">Default 0.4 kg/meal</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  CO₂e Avoidance Factor
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={localSettings.co2eFactorKg}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      co2eFactorKg: Number(e.target.value),
                    }))
                  }
                  className="w-full px-2.5 py-1 text-xs font-bold border border-gray-300 rounded-lg bg-white"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">kg CO₂e per kg food</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Demo HMAC Signing Key
                </label>
                <input
                  type="text"
                  value={localSettings.demoSigningKey}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      demoSigningKey: e.target.value,
                    }))
                  }
                  className="w-full px-2.5 py-1 text-xs font-mono font-bold border border-gray-300 rounded-lg bg-white"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  Demo signing key. Pilot uses per-organisation digital signatures.
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: Logistics Buffers */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#0F5132]" />
              Redistribution Logistics Buffers
            </h4>

            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Pickup Buffer (hours)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={localLogistics.pickupBufferHours}
                  onChange={(e) =>
                    setLocalLogistics((prev) => ({
                      ...prev,
                      pickupBufferHours: Number(e.target.value),
                    }))
                  }
                  className="w-full px-2.5 py-1 text-xs font-bold border border-gray-300 rounded-lg bg-white font-mono"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Default: 0.5h (30 min)</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Serving Window (hours)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={localLogistics.servingWindowHours}
                  onChange={(e) =>
                    setLocalLogistics((prev) => ({
                      ...prev,
                      servingWindowHours: Number(e.target.value),
                    }))
                  }
                  className="w-full px-2.5 py-1 text-xs font-bold border border-gray-300 rounded-lg bg-white font-mono"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Default: 1.0h (60 min)</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Min In-House Safe (T1)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={localLogistics.minInHouseSafeHours}
                  onChange={(e) =>
                    setLocalLogistics((prev) => ({
                      ...prev,
                      minInHouseSafeHours: Number(e.target.value),
                    }))
                  }
                  className="w-full px-2.5 py-1 text-xs font-bold border border-gray-300 rounded-lg bg-white font-mono"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Default: 2.0h</span>
              </div>
            </div>
          </div>

          {/* Reset All Demo Data Danger Card */}
          <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-red-950 block">Reset All Demo Data</span>
              <p className="text-[11px] text-red-800/80 mt-0.5">
                Flushes all saved batches, photo tests, and ledger logs from browser storage and reloads pristine demo seed data.
              </p>
            </div>
            {onResetAllDemoData && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to reset all demo data and reload the application?')) {
                    onResetAllDemoData();
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset all demo data</span>
              </button>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#0F5132] hover:bg-[#14663f] rounded-xl shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Save & Apply</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
