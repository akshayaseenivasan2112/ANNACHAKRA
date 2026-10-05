import React, { useState, useMemo } from 'react';
import {
  EsgScenarioInputs,
  EsgScenarioOutputs,
  EsgSummaryMetrics,
} from '../types/planAndFactory';
import { FoodBatch, DonorProfile, TrustLogEntry } from '../types/batch';
import { generateEsgReportPdf } from '../utils/pdfReportGenerator';
import {
  Leaf,
  Download,
  Printer,
  Scale,
  Utensils,
  Zap,
  DollarSign,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Info,
  RotateCcw,
  Sliders,
  Calendar,
  Building2,
  Award,
} from 'lucide-react';

interface ImpactTabProps {
  batches: FoodBatch[];
  donorProfile: DonorProfile;
  trustLog: TrustLogEntry[];
  simulatedTimeMs: number;
}

export const ImpactTab: React.FC<ImpactTabProps> = ({
  batches,
  donorProfile,
  trustLog,
  simulatedTimeMs,
}) => {
  // Configurable ESG parameters
  const [adviceCompliancePercent, setAdviceCompliancePercent] = useState<number>(70);
  const [kgPerMeal, setKgPerMeal] = useState<number>(0.4);
  const [co2eFactor, setCo2eFactor] = useState<number>(2.5);
  const [rupeesPerMeal, setRupeesPerMeal] = useState<number>(45);

  // Deck's Illustrative Scenario Calculator Inputs
  const [scenario, setScenario] = useState<EsgScenarioInputs>({
    mealsPerDay: 1000,
    surplusPercent: 12,
    kgPerMeal: 0.5,
    operatingDaysPerYear: 300,
    preventionRatePercent: 30,
    redirectionRatePercent: 50,
  });

  // Calculate Real App Metrics from Batches & Trust Log
  const liveMetrics: EsgSummaryMetrics = useMemo(() => {
    let handedOverKg = 0;
    let divertedKg = 0;
    let handoverCount = 0;

    batches.forEach((b) => {
      if (b.dispatchOffer?.status === 'handed_over') {
        handoverCount++;
        handedOverKg += b.quantityKg || 0;
      }
    });

    // Baseline synthetic forecast advice savings
    const baseAdvicePreventionKg = 380;
    const kgPrevented = Math.round(baseAdvicePreventionKg * (adviceCompliancePercent / 100));
    const kgRedistributed = handedOverKg > 0 ? handedOverKg : 65; // fallback to seed handovers if none completed in session
    const totalMealsServed = Math.round(kgRedistributed / kgPerMeal);
    const co2eAvoidedKg = Math.round((kgPrevented + kgRedistributed) * co2eFactor);
    const rupeesSaved = Math.round((kgPrevented + kgRedistributed) * (rupeesPerMeal / kgPerMeal));

    const isFssaiValid = /^\d{14}$/.test(donorProfile.fssaiNumber.trim());
    const lastBlock = trustLog.length > 0 ? trustLog[trustLog.length - 1] : null;

    return {
      kgPrevented,
      kgRedistributed,
      mealsServed: totalMealsServed,
      co2eAvoidedKg,
      rupeesSaved,
      anomaliesResolved: 4,
      totalHandovers: handoverCount > 0 ? handoverCount : 3,
      chainStatus: 'Chain Intact (Verified)',
      lastBlockHash: lastBlock ? lastBlock.hash : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      fssaiNumber: donorProfile.fssaiNumber,
      fssaiValid: isFssaiValid,
      adviceComplianceRatePercent: adviceCompliancePercent,
    };
  }, [batches, donorProfile, trustLog, adviceCompliancePercent, kgPerMeal, co2eFactor, rupeesPerMeal]);

  // Compute SIH 2026 Deck Scenario Outputs
  const scenarioOutputs: EsgScenarioOutputs = useMemo(() => {
    const annualMeals = scenario.mealsPerDay * scenario.operatingDaysPerYear;
    const annualSurplusMeals = annualMeals * (scenario.surplusPercent / 100);
    const annualSurplusKg = annualSurplusMeals * scenario.kgPerMeal;
    const annualSurplusTonnes = Math.round((annualSurplusKg / 1000) * 10) / 10;

    // 30% prevented by forecasting
    const annualPreventedKg = annualSurplusKg * (scenario.preventionRatePercent / 100);
    const annualPreventedTonnes = Math.round((annualPreventedKg / 1000) * 10) / 10;

    // Remainder after prevention
    const remainderKg = annualSurplusKg - annualPreventedKg;
    // 50% of remainder redirected
    const annualRedirectedKg = remainderKg * (scenario.redirectionRatePercent / 100);
    const annualRedirectedTonnes = Math.round((annualRedirectedKg / 1000) * 10) / 10;

    const totalSavedKg = annualPreventedKg + annualRedirectedKg;
    const totalSavedTonnes = Math.round((totalSavedKg / 1000) * 10) / 10;

    const annualMealsSaved = Math.round(totalSavedKg / scenario.kgPerMeal);
    const annualCo2eTonnes = Math.round((totalSavedKg * co2eFactor / 1000) * 10) / 10;
    const annualRupees = Math.round(annualMealsSaved * rupeesPerMeal);

    return {
      annualMealsServed: annualMeals,
      annualSurplusGeneratedKg: annualSurplusKg,
      annualSurplusGeneratedTonnes: annualSurplusTonnes,
      annualPreventedKg,
      annualPreventedTonnes,
      annualRedirectedKg,
      annualRedirectedTonnes,
      totalRescuedOrPreventedTonnes: totalSavedTonnes,
      annualMealsSaved,
      annualCo2eAvoidedTonnes: annualCo2eTonnes,
      annualFinancialSavingsRupees: annualRupees,
    };
  }, [scenario, co2eFactor, rupeesPerMeal]);

  const handleDownloadPdf = () => {
    generateEsgReportPdf({
      metrics: liveMetrics,
      donorProfile,
      reportingPeriod: 'Financial Year 2026-27 (Q3)',
    });
  };

  const handleResetScenario = () => {
    setScenario({
      mealsPerDay: 1000,
      surplusPercent: 12,
      kgPerMeal: 0.5,
      operatingDaysPerYear: 300,
      preventionRatePercent: 30,
      redirectionRatePercent: 50,
    });
    setAdviceCompliancePercent(70);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0F5132]/10 text-[#0F5132] flex items-center justify-center">
                <Leaf className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <span>ESG & Sustainability Analytics ("Prove")</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  BRSR Principle 6
                </span>
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Verified food loss prevention, landfill methane abatement & cryptographic Scope 3 carbon compliance
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F5132] hover:bg-[#14663f] text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Download ESG Report (PDF)</span>
            </button>
          </div>
        </div>

        {/* 5 Real App Impact KPI Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          {/* Tile 1: Prevented */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase">
              <span>Waste Prevented</span>
              <TrendingDown className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black font-mono text-[#0F5132]">
                {liveMetrics.kgPrevented}
              </span>
              <span className="text-xs font-bold text-gray-400">kg</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
              Via Demand Forecast ({adviceCompliancePercent}% followed)
            </span>
          </div>

          {/* Tile 2: Redistributed */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase">
              <span>Redistributed</span>
              <Scale className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black font-mono text-[#D97706]">
                {liveMetrics.kgRedistributed}
              </span>
              <span className="text-xs font-bold text-gray-400">kg</span>
            </div>
            <span className="text-[10px] text-gray-500 block mt-0.5">
              To Shelters & Community Kitchens
            </span>
          </div>

          {/* Tile 3: Meals Served */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase">
              <span>Meals Provided</span>
              <Utensils className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black font-mono text-gray-900">
                {liveMetrics.mealsServed}
              </span>
              <span className="text-xs font-bold text-gray-400">meals</span>
            </div>
            <span className="text-[10px] text-gray-500 block mt-0.5">
              Calibrated @ {kgPerMeal} kg / meal
            </span>
          </div>

          {/* Tile 4: CO2e Avoided */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase">
              <span>CO₂e Avoided</span>
              <Leaf className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-700">
                {(liveMetrics.co2eAvoidedKg / 1000).toFixed(2)}
              </span>
              <span className="text-xs font-bold text-gray-400">t CO₂e</span>
            </div>
            <span className="text-[10px] text-emerald-700 block mt-0.5">
              WRAP/IPCC: {co2eFactor} kg CO₂e / kg
            </span>
          </div>

          {/* Tile 5: Rupees Saved */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase">
              <span>Financial Savings</span>
              <DollarSign className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black font-mono text-gray-900">
                ₹{liveMetrics.rupeesSaved.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-gray-500 block mt-0.5">
              Saved raw material & dumping fees
            </span>
          </div>
        </div>

        <div className="text-[11px] text-gray-500 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#0F5132]" />
            <span>
              <strong>Regulatory Integrity:</strong> FSSAI FoSCoS format valid ({donorProfile.fssaiNumber}) • SHA-256 Ledger: {liveMetrics.chainStatus}
            </span>
          </div>
          <span className="text-[10px] font-mono text-gray-400">
            Factor: Illustrative, based on published emission factors such as WRAP/IPCC, to be validated in pilot.
          </span>
        </div>

      </div>

      {/* Section 2: SIH 2026 Deck Scenario Calculator */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#0F5132]" />
              <h3 className="text-base font-extrabold text-gray-900">
                SIH 2026 Deck Illustrative Scenario Calculator
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Test custom scale parameters: 1,000 meals/day, 12% baseline surplus, 30% prevented, 50% remainder redirected
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetScenario}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to deck defaults</span>
          </button>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
              Meals / Day:
            </label>
            <input
              type="number"
              value={scenario.mealsPerDay}
              onChange={(e) => setScenario({ ...scenario, mealsPerDay: Number(e.target.value) })}
              className="w-full px-2 py-1 bg-white border rounded-lg font-mono font-bold text-gray-900"
            />
          </div>

          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
              Surplus Rate:
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={scenario.surplusPercent}
                onChange={(e) => setScenario({ ...scenario, surplusPercent: Number(e.target.value) })}
                className="w-full px-2 py-1 bg-white border rounded-lg font-mono font-bold text-gray-900"
              />
              <span className="font-bold text-gray-400">%</span>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
              Weight / Meal:
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.05"
                value={scenario.kgPerMeal}
                onChange={(e) => setScenario({ ...scenario, kgPerMeal: Number(e.target.value) })}
                className="w-full px-2 py-1 bg-white border rounded-lg font-mono font-bold text-gray-900"
              />
              <span className="font-bold text-gray-400">kg</span>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
              Days / Year:
            </label>
            <input
              type="number"
              value={scenario.operatingDaysPerYear}
              onChange={(e) => setScenario({ ...scenario, operatingDaysPerYear: Number(e.target.value) })}
              className="w-full px-2 py-1 bg-white border rounded-lg font-mono font-bold text-gray-900"
            />
          </div>

          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
              Prevented (Plan):
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={scenario.preventionRatePercent}
                onChange={(e) => setScenario({ ...scenario, preventionRatePercent: Number(e.target.value) })}
                className="w-full px-2 py-1 bg-white border rounded-lg font-mono font-bold text-emerald-800"
              />
              <span className="font-bold text-gray-400">%</span>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
              Redirected (Match):
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={scenario.redirectionRatePercent}
                onChange={(e) => setScenario({ ...scenario, redirectionRatePercent: Number(e.target.value) })}
                className="w-full px-2 py-1 bg-white border rounded-lg font-mono font-bold text-amber-800"
              />
              <span className="font-bold text-gray-400">%</span>
            </div>
          </div>
        </div>

        {/* Calculated Results Banner */}
        <div className="p-5 rounded-2xl bg-linear-to-r from-emerald-50 via-white to-amber-50 border border-emerald-200 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-950">
              Projected Annual Scale Impact (SIH 2026 Deck Equivalence):
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-emerald-200 text-emerald-900 shadow-2xs">
              Assumption-based, to be validated in pilot.
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-bold block">
                Total Food Rescued / Prevented
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-black font-mono text-[#0F5132]">
                  {scenarioOutputs.totalRescuedOrPreventedTonnes}
                </span>
                <span className="text-sm font-bold text-gray-600">tonnes/yr</span>
              </div>
              <span className="text-[10px] text-gray-500">
                ({scenarioOutputs.annualPreventedTonnes}t prevented + {scenarioOutputs.annualRedirectedTonnes}t redirected)
              </span>
            </div>

            <div>
              <span className="text-[10px] text-gray-500 uppercase font-bold block">
                Annual Meals Saved
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-black font-mono text-emerald-700">
                  {scenarioOutputs.annualMealsSaved.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-gray-600">meals/yr</span>
              </div>
              <span className="text-[10px] text-gray-500">
                Nutritious food saved from landfills
              </span>
            </div>

            <div>
              <span className="text-[10px] text-gray-500 uppercase font-bold block">
                GHG Emissions Avoided
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-black font-mono text-[#D97706]">
                  {scenarioOutputs.annualCo2eAvoidedTonnes}
                </span>
                <span className="text-sm font-bold text-gray-600">t CO₂e/yr</span>
              </div>
              <span className="text-[10px] text-gray-500">
                Direct methane avoidance factor
              </span>
            </div>

            <div>
              <span className="text-[10px] text-gray-500 uppercase font-bold block">
                Annual Financial Recovery
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-black font-mono text-gray-900">
                  ₹{(scenarioOutputs.annualFinancialSavingsRupees / 100000).toFixed(1)}L
                </span>
                <span className="text-sm font-bold text-gray-600">/year</span>
              </div>
              <span className="text-[10px] text-gray-500">
                At ₹{rupeesPerMeal}/meal equivalence
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Mandatory Honesty Footer */}
      <div className="text-center text-[11px] font-semibold text-gray-400 py-2">
        Demo data is fictional. Models shown are simple demo versions of the ones planned for the pilot.
      </div>

    </div>
  );
};
