import React, { useState, useMemo, useRef } from 'react';
import {
  DailyCanteenRecord,
  DayForecast,
  ForecastAdviceCard,
} from '../types/planAndFactory';
import {
  generateSyntheticCanteenHistory,
  generateSevenDayForecast,
  calculateMape,
  generateAdviceCards,
} from '../utils/planDataGenerator';
import { downscaleImage } from '../utils/imageHelper';
import { checkPlateWaste } from '../utils/geminiClient';
import { FoodBatch } from '../types/batch';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Calendar,
  CloudRain,
  Sun,
  Sparkles,
  TrendingDown,
  Camera,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Utensils,
  Layers,
  ArrowRight,
  Info,
  RotateCcw,
  Factory,
  ChevronRight,
  Check,
  Percent,
} from 'lucide-react';

interface PlanTabProps {
  onSeedBatchToPassport?: (batch: FoodBatch) => void;
  onSwitchToBatches?: () => void;
}

export const PlanTab: React.FC<PlanTabProps> = ({
  onSeedBatchToPassport,
  onSwitchToBatches,
}) => {
  // 8 weeks of daily history
  const [history, setHistory] = useState<DailyCanteenRecord[]>(() =>
    generateSyntheticCanteenHistory()
  );

  // Tomorrow simulation controls
  const [tomorrowAttendance, setTomorrowAttendance] = useState<number>(950);
  const [tomorrowHoliday, setTomorrowHoliday] = useState<boolean>(false);
  const [tomorrowRain, setTomorrowRain] = useState<boolean>(true);

  // Batch planner state
  const [plannerMode, setPlannerMode] = useState<'canteen' | 'factory'>('canteen');
  const [plannedQuantity, setPlannedQuantity] = useState<number>(1100);

  // Plate waste photo check state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzingWaste, setIsAnalyzingWaste] = useState<boolean>(false);
  const [wasteError, setWasteError] = useState<string | null>(null);
  const [manualWasteSliderOpen, setManualWasteSliderOpen] = useState<boolean>(false);
  const [manualWasteValue, setManualWasteValue] = useState<number>(20);
  const [latestWasteResult, setLatestWasteResult] = useState<{
    thumbnailUrl?: string;
    waste_percentage: number;
    main_leftover_item: string;
    note: string;
    isManual?: boolean;
  } | null>(null);

  // Calculate 7-day forecast based on history & tomorrow overrides
  const forecasts = useMemo(() => {
    return generateSevenDayForecast(history, {
      expectedAttendance: tomorrowAttendance,
      isHoliday: tomorrowHoliday,
      isRain: tomorrowRain,
    });
  }, [history, tomorrowAttendance, tomorrowHoliday, tomorrowRain]);

  // Advice cards
  const adviceCards = useMemo(() => {
    return generateAdviceCards(forecasts);
  }, [forecasts]);

  // Honest MAPE computation on the last 14 days
  const mapeScore = useMemo(() => {
    return calculateMape(history);
  }, [history]);

  // Recharts Chart Dataset: last 14 days actual/forecast + next 7 days forecast with confidence band
  const chartData = useMemo(() => {
    const last14 = history.slice(-14);
    const data: Array<{
      date: string;
      label: string;
      actual?: number;
      forecast?: number;
      lowerBand?: number;
      upperBand?: number;
      isFuture: boolean;
      eventNote?: string;
    }> = [];

    // Historical 14 days
    last14.forEach((h) => {
      data.push({
        date: h.date,
        label: `${h.dayOfWeek.slice(0, 3)} ${h.date.slice(5)}`,
        actual: h.mealsEaten,
        forecast: h.forecastMeals,
        isFuture: false,
        eventNote: h.holidayFlag ? 'Holiday' : h.rainFlag ? 'Rain' : undefined,
      });
    });

    // 7 Future Days
    forecasts.forEach((f) => {
      data.push({
        date: f.date,
        label: `${f.dayOfWeek.slice(0, 3)} ${f.date.slice(5)}`,
        forecast: f.forecastMeals,
        lowerBand: f.lowerConfidence,
        upperBand: f.upperConfidence,
        isFuture: true,
        eventNote: f.holidayFlag ? 'Holiday' : f.rainFlag ? 'Rain' : undefined,
      });
    });

    return data;
  }, [history, forecasts]);

  // Batch planner recommendation
  const plannerRecommendation = useMemo(() => {
    const tomorrowForecast = forecasts[0];
    if (plannerMode === 'canteen') {
      const rec = tomorrowForecast ? tomorrowForecast.forecastMeals : 940;
      const diff = plannedQuantity - rec;
      const pct = Math.round((diff / plannedQuantity) * 100);
      return {
        recommendedQuantity: rec,
        reductionPercent: pct,
        reason: tomorrowForecast?.reason || 'Demand forecast calibration',
        foodSavedKg: Math.max(0, Math.round(diff * 0.45)),
        unit: 'meals',
      };
    } else {
      // Factory mode: 10,000 biscuit packets base
      const factor = tomorrowForecast ? tomorrowForecast.forecastMeals / 1050 : 0.88;
      const rec = Math.round(10000 * factor);
      const diff = plannedQuantity - rec;
      const pct = Math.round((diff / plannedQuantity) * 100);
      return {
        recommendedQuantity: rec,
        reductionPercent: pct,
        reason: 'Distributor order velocity & retail weekend transit schedule',
        foodSavedKg: Math.max(0, Math.round(diff * 0.05)), // 50g per packet
        unit: 'packets',
      };
    }
  }, [plannerMode, plannedQuantity, forecasts]);

  // Handle Tray Photo Upload for Plate Waste
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingWaste(true);
    setWasteError(null);

    try {
      const downscaled = await downscaleImage(file, 1024);
      const result = await checkPlateWaste(
        downscaled.base64,
        downscaled.mimeType,
        downscaled.dataUrl
      );

      setLatestWasteResult({
        thumbnailUrl: downscaled.dataUrl,
        waste_percentage: result.waste_percentage,
        main_leftover_item: result.main_leftover_item,
        note: result.note,
        isManual: false,
      });

      // Update today's plate waste in history table
      setHistory((prev) => {
        const copy = [...prev];
        const lastIdx = copy.length - 1;
        if (lastIdx >= 0) {
          copy[lastIdx] = {
            ...copy[lastIdx],
            plateWastePercent: result.waste_percentage,
            plateWasteItem: result.main_leftover_item,
            plateWasteNote: result.note,
          };
        }
        return copy;
      });
    } catch (err: any) {
      console.warn('Plate waste AI analysis encountered error, opening manual slider:', err);
      setWasteError('AI vision service is busy. Please input the plate waste percentage manually.');
      setManualWasteSliderOpen(true);
    } finally {
      setIsAnalyzingWaste(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyManualWaste = () => {
    setLatestWasteResult({
      waste_percentage: manualWasteValue,
      main_leftover_item: 'Manual Entry (Rice & Dal)',
      note: 'Supervisor manual visual waste estimate.',
      isManual: true,
    });

    setHistory((prev) => {
      const copy = [...prev];
      const lastIdx = copy.length - 1;
      if (lastIdx >= 0) {
        copy[lastIdx] = {
          ...copy[lastIdx],
          plateWastePercent: manualWasteValue,
          plateWasteItem: 'Rice & Dal',
          plateWasteNote: 'Manual assessment',
        };
      }
      return copy;
    });

    setManualWasteSliderOpen(false);
  };

  const handleUseSampleTray = () => {
    const sampleResult = {
      thumbnailUrl:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23e2e8f0" rx="16"/><rect x="20" y="20" width="160" height="160" fill="%23cbd5e1" rx="8"/><circle cx="70" cy="70" r="30" fill="%23f8fafc"/><circle cx="130" cy="70" r="30" fill="%23fef3c7"/><circle cx="100" cy="135" r="35" fill="%23fee2e2"/><text x="100" y="105" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23334155" text-anchor="middle">Tray Leftover 18%</text></svg>',
      waste_percentage: 18,
      main_leftover_item: 'Rice & Dal',
      note: 'AI estimated 18% leftover on cafeteria return tray. Primary uneaten portion: Rice.',
      isManual: false,
    };
    setLatestWasteResult(sampleResult);

    setHistory((prev) => {
      const copy = [...prev];
      const lastIdx = copy.length - 1;
      if (lastIdx >= 0) {
        copy[lastIdx] = {
          ...copy[lastIdx],
          plateWastePercent: 18,
          plateWasteItem: 'Rice & Dal',
          plateWasteNote: 'Sample tray photo check (18%)',
        };
      }
      return copy;
    });
  };

  const handleResetData = () => {
    setHistory(generateSyntheticCanteenHistory());
    setTomorrowAttendance(950);
    setTomorrowHoliday(false);
    setTomorrowRain(true);
    setLatestWasteResult(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0F5132]/10 text-[#0F5132] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <span>Demand Forecast & Batch Plan ("Predict")</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Fictional demo data
                </span>
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              8-week institutional demand forecasting with explainable guidance to stop food waste before cooking begins
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleResetData}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset demo data</span>
            </button>
          </div>
        </div>

        {/* Accuracy & Model Notice Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200/80 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
              {mapeScore}%
            </div>
            <div>
              <span className="font-bold text-gray-900 block">Honest MAPE Error</span>
              <span className="text-[11px] text-gray-500">
                Mean Absolute Percentage Error over last 14 days
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-gray-600">
            <Sparkles className="w-4 h-4 text-[#D97706] shrink-0" />
            <span className="text-[11px] leading-snug">
              <strong>Demo Model:</strong> Day-of-week weighted moving average adjusted for rain and holidays. Pilot runs Facebook Prophet / LightGBM.
            </span>
          </div>

          <div className="flex items-center justify-start md:justify-end gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
              ✓ Prevention at Source
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[11px]">
              SDG 12.3 Aligned
            </span>
          </div>
        </div>

      </div>

      {/* Main Grid: Forecast Chart & Tomorrow's Live Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Interactive Forecast Line Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                14-Day History vs 7-Day Forward Forecast
              </h3>
              <p className="text-xs text-gray-500">
                Shows actual meals eaten, model forecast, and ±6% confidence band for upcoming days
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#0F5132] inline-block" /> Actual Eaten
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#D97706] border-dashed inline-block" /> Forecast
              </span>
            </div>
          </div>

          {/* Recharts Chart */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  interval={1}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} domain={[200, 1300]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-amber-300">{label}</p>
                          {data.actual !== undefined && (
                            <p className="text-emerald-300">Actual Eaten: {data.actual} meals</p>
                          )}
                          {data.forecast !== undefined && (
                            <p className="text-amber-200">Forecast: {data.forecast} meals</p>
                          )}
                          {data.lowerBand && data.upperBand && (
                            <p className="text-gray-400 text-[10px]">
                              Confidence: {data.lowerBand} - {data.upperBand} meals
                            </p>
                          )}
                          {data.eventNote && (
                            <p className="text-rose-300 font-bold text-[10px]">
                              Condition: {data.eventNote}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine x="Sun (T-0)" stroke="#94A3B8" strokeDasharray="3 3" label={{ value: 'Today', fill: '#64748B', fontSize: 10 }} />
                
                {/* Confidence band area for future days */}
                <Area
                  type="monotone"
                  dataKey="upperBand"
                  stroke="none"
                  fill="#FEF3C7"
                  fillOpacity={0.6}
                  name="Confidence Band"
                />
                <Area
                  type="monotone"
                  dataKey="lowerBand"
                  stroke="none"
                  fill="#FFFFFF"
                  fillOpacity={1}
                />

                {/* Actual Line */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#0F5132"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#0F5132' }}
                  activeDot={{ r: 5 }}
                  name="Actual Eaten"
                />

                {/* Forecast Line */}
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#D97706"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#D97706' }}
                  name="Forecast Meals"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-gray-500 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/80 flex items-center justify-between">
            <span>
              <strong>Model Calibration:</strong> Demo model. Production plan uses Prophet / LightGBM on pilot data.
            </span>
            <span className="font-mono font-bold text-[#0F5132]">Target: &lt;5% Daily Surplus</span>
          </div>
        </div>

        {/* Right: Live Inputs Panel for Tomorrow (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Sliders className="w-4 h-4 text-[#0F5132]" />
              <h3 className="text-base font-extrabold text-gray-900">
                Simulate Tomorrow's Conditions
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Adjust external parameters and watch the dynamic batch recommendation recalculate live.
            </p>

            <div className="space-y-4 pt-3 text-xs">
              {/* Expected Attendance Slider */}
              <div>
                <div className="flex items-center justify-between font-bold text-gray-700 mb-1">
                  <span>Expected Headcount:</span>
                  <span className="font-mono text-base font-extrabold text-[#0F5132]">
                    {tomorrowAttendance}
                  </span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="1300"
                  step="25"
                  value={tomorrowAttendance}
                  onChange={(e) => setTomorrowAttendance(Number(e.target.value))}
                  className="w-full accent-[#0F5132] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>200 (Low)</span>
                  <span>1,050 (Normal)</span>
                  <span>1,300 (Peak)</span>
                </div>
              </div>

              {/* Rain Forecast Toggle */}
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {tomorrowRain ? (
                    <CloudRain className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-gray-800 block text-xs">Rain Forecast</span>
                    <span className="text-[10px] text-gray-500">
                      {tomorrowRain ? 'Heavy showers (-18% attendance)' : 'Clear weather expected'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTomorrowRain(!tomorrowRain)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                    tomorrowRain
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {tomorrowRain ? 'Rainy' : 'Clear'}
                </button>
              </div>

              {/* Campus Holiday Toggle */}
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-rose-500 shrink-0" />
                  <div>
                    <span className="font-bold text-gray-800 block text-xs">Holiday Flag</span>
                    <span className="text-[10px] text-gray-500">
                      {tomorrowHoliday ? 'Campus closed (-70% meals)' : 'Normal operating day'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTomorrowHoliday(!tomorrowHoliday)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                    tomorrowHoliday
                      ? 'bg-rose-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {tomorrowHoliday ? 'Holiday' : 'Regular'}
                </button>
              </div>
            </div>
          </div>

          {/* Tomorrow Live Output Highlight */}
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-1 mt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
              Recalculated Target for Tomorrow:
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-[#0F5132]">
                {forecasts[0]?.forecastMeals || 940}
              </span>
              <span className="text-xs font-bold text-emerald-800">meals (+2% safety margin)</span>
            </div>
            <p className="text-[11px] text-emerald-700">
              Potential food saved vs default 1,100 batch:{' '}
              <strong>{forecasts[0]?.estimatedFoodSavedKg || 38} kg</strong>
            </p>
          </div>

        </div>

      </div>

      {/* Section 2: Plain-English Explainable Advice Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-[#0F5132]" />
            <h3 className="text-lg font-black text-gray-900">
              Plain-English Kitchen Guidance Cards
            </h3>
          </div>
          <span className="text-xs text-gray-500">Generated mathematically from model parameters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {adviceCards.slice(0, 4).map((card) => (
            <div
              key={card.id}
              className={`p-4 rounded-3xl border shadow-xs transition-all space-y-2.5 ${
                card.urgency === 'high'
                  ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                  : card.urgency === 'medium'
                  ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                  : 'bg-white border-gray-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white border text-gray-700">
                  {card.category}
                </span>
                <span className="font-mono text-xs font-bold text-[#0F5132]">
                  Save ~{card.foodSavedKg} kg
                </span>
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-gray-900 leading-snug">
                  {card.headline}
                </h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {card.reason}
                </p>
              </div>

              <div className="pt-2 border-t border-black/5 flex items-center justify-between text-xs font-semibold">
                <span className="text-gray-500">Target batch:</span>
                <span className="font-mono font-bold text-gray-900">
                  {card.recommendedMeals} meals
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Batch Planner & Plate-Waste Vision Check */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Batch Planner Tool (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0F5132]" />
              <h3 className="text-base font-extrabold text-gray-900">
                Institutional Batch Sizing Planner
              </h3>
            </div>

            {/* Mode Switcher: Canteen vs Factory */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setPlannerMode('canteen');
                  setPlannedQuantity(1100);
                }}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  plannerMode === 'canteen'
                    ? 'bg-[#0F5132] text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Canteen (Meals)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlannerMode('factory');
                  setPlannedQuantity(10000);
                }}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  plannerMode === 'factory'
                    ? 'bg-[#0F5132] text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Factory (Packets)
              </button>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                {plannerMode === 'canteen'
                  ? 'Your Planned Cooking Quantity (Meals):'
                  : 'Your Planned Biscuit Production Run (Packets):'}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={plannedQuantity}
                  onChange={(e) => setPlannedQuantity(Math.max(10, Number(e.target.value)))}
                  className="w-40 px-3.5 py-2 rounded-xl border border-gray-300 font-mono text-base font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                />
                <span className="text-gray-500 font-medium">
                  {plannerMode === 'canteen' ? 'Default weekday intake quota' : 'Standard 10,000 quota'}
                </span>
              </div>
            </div>

            {/* AI Recommendation Result */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-950">
                  Recommended Batch Size:
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-950">
                  {plannerRecommendation.reductionPercent > 0
                    ? `-${plannerRecommendation.reductionPercent}% Reduction`
                    : 'Standard Quota'}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-[#0F5132]">
                  {plannerRecommendation.recommendedQuantity.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-gray-700">
                  {plannerRecommendation.unit}
                </span>
              </div>

              <p className="text-xs text-amber-900 font-medium leading-relaxed">
                <strong>Reason:</strong> {plannerRecommendation.reason}. Producing this calibrated amount avoids producing{' '}
                <strong>{plannerRecommendation.foodSavedKg} kg</strong> of surplus food that would otherwise spoil.
              </p>
            </div>

            {/* Action button: Create Batch in Passport */}
            {onSeedBatchToPassport && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const newBatch: FoodBatch = {
                      id: `batch-${Date.now()}`,
                      dishName: plannerMode === 'canteen' ? 'Cooked Veg Thali Batch' : 'Biscuits Production Lot',
                      category: plannerMode === 'canteen' ? 'Cooked' : 'Packaged',
                      quantityKg: Math.round(plannerRecommendation.recommendedQuantity * (plannerMode === 'canteen' ? 0.45 : 0.05)),
                      preparedTime: Date.now(),
                      storageType: plannerMode === 'canteen' ? 'Ambient' : 'Ambient',
                      allergens: ['None'],
                      initialTempC: 25,
                      readings: [{ id: `r-${Date.now()}`, timestamp: Date.now(), temperatureC: 25 }],
                      isReusableInHouse: false,
                      createdAt: Date.now(),
                    };
                    onSeedBatchToPassport(newBatch);
                    if (onSwitchToBatches) onSwitchToBatches();
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0F5132] hover:bg-[#14663f] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  <span>Create Batch in Food Passport</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Plate Waste Vision Auditor (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#0F5132]" />
              <h3 className="text-base font-extrabold text-gray-900">
                Plate-Waste Tray Check ("Learn")
              </h3>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Vision AI</span>
          </div>

          <p className="text-xs text-gray-500">
            Upload or capture photo of cafeteria return trays to quantify leftover portions and feed dining analytics.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            onChange={handlePhotoSelect}
            className="hidden"
          />

          {/* Upload Button with Sample Tray Fallback */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <button
              type="button"
              disabled={isAnalyzingWaste}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3 px-4 border-2 border-dashed border-[#0F5132]/40 hover:border-[#0F5132] rounded-2xl bg-emerald-50/50 hover:bg-emerald-50 text-[#0F5132] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>{isAnalyzingWaste ? 'Analyzing tray leftovers with Gemini...' : 'Upload Tray Photo'}</span>
            </button>

            <button
              type="button"
              onClick={handleUseSampleTray}
              title="Test plate-waste analysis with a verified sample tray photo (works offline)"
              className="py-3 px-4 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Sample Tray</span>
            </button>
          </div>

          {/* Error & Manual Fallback */}
          {wasteError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>{wasteError}</span>
              </div>
              <button
                type="button"
                onClick={() => setManualWasteSliderOpen(true)}
                className="underline font-bold text-red-900"
              >
                Open manual percentage slider
              </button>
            </div>
          )}

          {/* Manual Slider Modal / Drawer */}
          {manualWasteSliderOpen && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3 text-xs">
              <div className="flex justify-between font-bold">
                <span>Manual Waste Estimate:</span>
                <span className="font-mono text-base font-black text-[#0F5132]">{manualWasteValue}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={manualWasteValue}
                onChange={(e) => setManualWasteValue(Number(e.target.value))}
                className="w-full accent-[#0F5132]"
              />
              <button
                type="button"
                onClick={handleApplyManualWaste}
                className="w-full py-1.5 bg-[#0F5132] text-white font-bold rounded-lg"
              >
                Save Plate Waste
              </button>
            </div>
          )}

          {/* Latest Result Card */}
          {latestWasteResult && (
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {latestWasteResult.isManual ? 'Manual Observation' : 'Gemini Tray Audit'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                  {latestWasteResult.main_leftover_item}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {latestWasteResult.thumbnailUrl && (
                  <img
                    src={latestWasteResult.thumbnailUrl}
                    alt="Tray"
                    className="w-14 h-14 rounded-xl object-cover border border-gray-200 shrink-0"
                  />
                )}
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono text-[#D97706]">
                      {latestWasteResult.waste_percentage}%
                    </span>
                    <span className="text-xs text-gray-500">food uneaten on tray</span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5 italic">
                    "{latestWasteResult.note}"
                  </p>
                </div>
              </div>

              <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-200">
                AI estimate, to be validated in pilot. Added to daily cafeteria records.
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Section 4: 8-Week Daily History Table with Plate Waste Column */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-gray-700">
            Recent Daily Canteen Records (Last 14 Days Sample)
          </span>
          <span className="text-[11px] text-gray-400">Total 56 Days Tracked</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-100/70 text-gray-600 font-bold uppercase border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5">Date & Day</th>
                <th className="px-4 py-2.5">Menu Dish</th>
                <th className="px-4 py-2.5">Weather / Event</th>
                <th className="px-4 py-2.5">Meals Cooked</th>
                <th className="px-4 py-2.5">Meals Eaten</th>
                <th className="px-4 py-2.5">Surplus (kg)</th>
                <th className="px-4 py-2.5">Plate Waste %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {history.slice(-14).reverse().map((rec) => (
                <tr key={rec.date} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="font-bold text-gray-900 block">{rec.date}</span>
                    <span className="text-[10px] text-gray-500">{rec.dayOfWeek}</span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-800">
                    {rec.menu}
                  </td>
                  <td className="px-4 py-2.5">
                    {rec.holidayFlag ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        {rec.holidayName || 'Holiday'}
                      </span>
                    ) : rec.rainFlag ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        🌧 Rainy Day
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[11px]">Normal</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-gray-700">
                    {rec.mealsCooked}
                  </td>
                  <td className="px-4 py-2.5 font-mono font-bold text-gray-900">
                    {rec.mealsEaten}
                  </td>
                  <td className="px-4 py-2.5 font-mono font-bold text-amber-700">
                    {rec.surplusKg} kg
                  </td>
                  <td className="px-4 py-2.5 font-mono">
                    {rec.plateWastePercent !== undefined ? (
                      <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-amber-50 text-amber-800 border border-amber-200">
                        {rec.plateWastePercent}% ({rec.plateWasteItem || 'Leftovers'})
                      </span>
                    ) : (
                      <span className="text-gray-300 text-[10px]">Pending scan</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory Honesty Footer */}
      <div className="text-center text-[11px] font-semibold text-gray-400 py-2">
        Demo data is fictional. Models shown are simple demo versions of the ones planned for the pilot.
      </div>

    </div>
  );
};
