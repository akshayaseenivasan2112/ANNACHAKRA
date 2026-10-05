import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Calculator, Thermometer, AlertCircle, Camera } from 'lucide-react';
import { ARRHENIUS_DELTA_H, GAS_CONSTANT_R, DELTA_H_OVER_R } from '../utils/spoilage';

export const CalculationExplainer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden mb-8">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4.5 flex items-center justify-between bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0F5132]/10 text-[#0F5132] flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span>How the Spoilage Clock is calculated</span>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                Arrhenius Model, MKT & Vision
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Time-at-temperature Arrhenius kinetics combined with Gemini multimodal freshness checks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#0F5132]">
          <span>{isOpen ? 'Collapse' : 'Explain formula & rules'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 sm:p-7 border-t border-gray-200/80 bg-white space-y-6 text-sm text-gray-700">
          
          {/* Plain words overview */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-[#0F5132]" />
              In Plain Words
            </h4>
            <p className="leading-relaxed text-gray-600 text-xs sm:text-sm">
              Perishable food spoils through <span className="font-semibold text-gray-900">cumulative thermal energy</span> and microbiological activity. 
              One hour at a warm 28 °C ambient kitchen counter consumes significantly more shelf-life than one hour inside a 4 °C walk-in chiller.
            </p>
            <p className="leading-relaxed text-gray-600 text-xs sm:text-sm">
              AnnaChakra computes discrete temperature intervals, calculates the <span className="font-semibold text-gray-900">Arrhenius rate acceleration (f)</span>, deducts elapsed reference hours from the batch budget, and validates the result against real-world <span className="font-semibold text-gray-900">Gemini photo inspections</span>.
            </p>
          </div>

          {/* Mathematical formulation & Vision Rules */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Box 1: Arrhenius Rate Factor */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wide block">
                1. Arrhenius Factor (f)
              </span>
              <div className="p-2.5 bg-white rounded-lg border border-gray-200/90 font-mono text-xs text-gray-900 text-center font-bold">
                f = exp[ -(ΔH/R) · (1/T_K - 1/T_ref_K) ]
              </div>
              <ul className="text-xs text-gray-600 space-y-1 pt-1">
                <li>• <strong className="text-gray-800">ΔH (Activation energy):</strong> 83.144 kJ/mol</li>
                <li>• <strong className="text-gray-800">R:</strong> 0.008314 kJ/(mol · K)</li>
                <li>• <strong className="text-gray-800">T_K, T_ref_K:</strong> In Kelvin (°C + 273.15)</li>
                <li>• Above reference: <span className="font-semibold text-amber-700">f &gt; 1.0</span> (spoilage accelerates).</li>
              </ul>
            </div>

            {/* Box 2: Mean Kinetic Temperature (MKT) */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wide block">
                2. Mean Kinetic Temp (MKT)
              </span>
              <div className="p-2.5 bg-white rounded-lg border border-gray-200/90 font-mono text-xs text-gray-900 text-center font-bold">
                T_MKT = (ΔH/R) / [ -ln( Σ Δt·e^(-ΔH/RT) / Σ Δt ) ]
              </div>
              <ul className="text-xs text-gray-600 space-y-1 pt-1">
                <li>• <strong className="text-gray-800">USP Standard Formula:</strong> Isothermal equivalent for entire historical journey.</li>
                <li>• <strong className="text-gray-800">Penalizes heat spikes:</strong> Captures exponential biological decay.</li>
              </ul>
            </div>

            {/* Box 3: Multimodal Photo Freshness Rules */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wide block flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#D97706]" />
                3. Photo Freshness Rules
              </span>
              <ul className="text-xs text-amber-900 space-y-1 pt-0.5">
                <li>• <strong className="text-emerald-800">Score ≥ 75:</strong> No clock change (verified pristine fresh).</li>
                <li>• <strong className="text-amber-800">Score 45 to 74:</strong> Safe hours multiplied by 0.5 (scaled down).</li>
                <li>• <strong className="text-red-700">Score &lt; 45:</strong> Status = "Unsafe: never offer as food".</li>
                <li>• <strong className="text-gray-600">Non-food:</strong> No effect on clock.</li>
              </ul>
              <div className="text-[10px] text-amber-800 font-semibold italic pt-1 border-t border-amber-200">
                Decision support only: a human confirms every decision.
              </div>
            </div>

          </div>

          {/* Reference Baselines Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-[#D97706]" />
              Default Category Reference Baselines (Configurable in Settings)
            </h4>
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 text-gray-700 font-bold uppercase border-b border-gray-200">
                  <tr>
                    <th className="px-3.5 py-2">Category</th>
                    <th className="px-3.5 py-2">Storage</th>
                    <th className="px-3.5 py-2">Reference Temp</th>
                    <th className="px-3.5 py-2">Base Safe Budget</th>
                    <th className="px-3.5 py-2">Photo Score Adjustment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  <tr className="hover:bg-gray-50">
                    <td className="px-3.5 py-2 font-bold text-gray-900">Cooked</td>
                    <td className="px-3.5 py-2">Ambient</td>
                    <td className="px-3.5 py-2 font-mono">25.0 °C</td>
                    <td className="px-3.5 py-2 font-mono text-[#0F5132] font-bold">4.0 hours</td>
                    <td className="px-3.5 py-2 text-gray-600">Score 45–74 scales clock by 0.5x; &lt;45 unsafe</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-3.5 py-2 font-bold text-gray-900">Cooked</td>
                    <td className="px-3.5 py-2">Chilled</td>
                    <td className="px-3.5 py-2 font-mono">5.0 °C</td>
                    <td className="px-3.5 py-2 font-mono text-[#0F5132] font-bold">48.0 hours</td>
                    <td className="px-3.5 py-2 text-gray-600">Visual check detects mould / syneresis early</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-3.5 py-2 font-bold text-gray-900">Cooked</td>
                    <td className="px-3.5 py-2">Hot-hold</td>
                    <td className="px-3.5 py-2 font-mono">60.0 °C</td>
                    <td className="px-3.5 py-2 font-mono text-[#0F5132] font-bold">6.0 hours</td>
                    <td className="px-3.5 py-2 text-gray-600">Monitors surface drying and crusting</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-3.5 py-2 font-bold text-gray-900">Raw / Bulk</td>
                    <td className="px-3.5 py-2">Ambient</td>
                    <td className="px-3.5 py-2 font-mono">25.0 °C</td>
                    <td className="px-3.5 py-2 font-mono text-[#0F5132] font-bold">8.0 hours</td>
                    <td className="px-3.5 py-2 text-gray-600">Detects wilting, bruising, enzymatic browning</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-3.5 py-2 font-bold text-gray-900">Raw / Bulk</td>
                    <td className="px-3.5 py-2">Chilled</td>
                    <td className="px-3.5 py-2 font-mono">5.0 °C</td>
                    <td className="px-3.5 py-2 font-mono text-[#0F5132] font-bold">72.0 hours</td>
                    <td className="px-3.5 py-2 text-gray-600">Cold chain preservation monitoring</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-3.5 py-2 font-bold text-gray-900">Packaged</td>
                    <td className="px-3.5 py-2">Ambient</td>
                    <td className="px-3.5 py-2 font-mono">25.0 °C</td>
                    <td className="px-3.5 py-2 font-mono text-[#0F5132] font-bold">168.0 hours (7d)</td>
                    <td className="px-3.5 py-2 text-gray-600">Seal integrity and label verification</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Safety Thresholds */}
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Status Classification Rules:</span>{' '}
              <span className="font-semibold text-emerald-800">Safe:</span> &gt; 50% safe life left •{' '}
              <span className="font-semibold text-amber-800">Use soon:</span> 20% to 50% left •{' '}
              <span className="font-semibold text-red-700">Urgent:</span> &lt; 20% left •{' '}
              <span className="font-bold text-slate-800">Unsafe: never offer as food:</span> 0 safe hours or photo score &lt; 45.
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
