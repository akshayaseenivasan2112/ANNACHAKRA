import React, { useState, useEffect, useMemo } from 'react';
import {
  HourlyFactoryRecord,
  AnomalyCard,
  FactoryLiveSensorState,
} from '../types/planAndFactory';
import {
  generateSyntheticFactoryLineData,
  computeControlChartPoints,
  getSimulatedSensorState,
} from '../utils/factoryDataGenerator';
import { FoodBatch } from '../types/batch';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Factory,
  Cpu,
  AlertTriangle,
  Flame,
  Zap,
  Package,
  Layers,
  Thermometer,
  Droplets,
  Gauge,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Sliders,
  DollarSign,
  TrendingDown,
} from 'lucide-react';

interface FactoryTabProps {
  onRouteStockToMatch?: (stockBatch: FoodBatch) => void;
  onJumpToBatchPlanner?: () => void;
  onStorageTempBreachLog?: (tempC: number) => void;
}

export const FactoryTab: React.FC<FactoryTabProps> = ({
  onRouteStockToMatch,
  onJumpToBatchPlanner,
  onStorageTempBreachLog,
}) => {
  // 14 days of hourly line records and pre-seeded anomalies
  const [dataState, setDataState] = useState(() =>
    generateSyntheticFactoryLineData()
  );

  // Live sensor telemetry simulator state
  const [sensorState, setSensorState] = useState<FactoryLiveSensorState>(() =>
    getSimulatedSensorState()
  );

  // Editable storage limit (default 24 C)
  const [storageTempLimitC, setStorageTempLimitC] = useState<number>(24.0);
  const [hasLoggedBreach, setHasLoggedBreach] = useState<boolean>(false);

  // Simulated live sensor feed timer (updates every 3 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setSensorState((prev) => {
        const next = getSimulatedSensorState(prev);
        // Check storage temperature breach alert
        if (next.storageTempC > storageTempLimitC && !hasLoggedBreach) {
          setHasLoggedBreach(true);
          if (onStorageTempBreachLog) {
            onStorageTempBreachLog(next.storageTempC);
          }
        }
        return next;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [storageTempLimitC, hasLoggedBreach, onStorageTempBreachLog]);

  // Compute 3-sigma control chart points (last 48 hours)
  const controlChartData = useMemo(() => {
    return computeControlChartPoints(dataState.records);
  }, [dataState.records]);

  // Calculate live summary stats
  const factoryStats = useMemo(() => {
    const totalPackets = dataState.records.reduce((acc, r) => acc + r.packetsOut, 0);
    const totalFlourLost = 105; // from anomaly #2
    const totalLossRupees = dataState.anomalies.reduce((acc, a) => acc + a.estimatedLossRupees, 0);
    const anomalyCount = dataState.anomalies.length;

    return {
      totalPackets,
      totalFlourLost,
      totalLossRupees,
      anomalyCount,
    };
  }, [dataState]);

  const handleResetData = () => {
    setDataState(generateSyntheticFactoryLineData());
    setSensorState(getSimulatedSensorState());
    setHasLoggedBreach(false);
  };

  // Route Near-Date Stock into the cascade
  const handleRouteStock = (anomaly: AnomalyCard) => {
    if (!anomaly.stockPayload) return;
    const stock = anomaly.stockPayload;

    const newBatch: FoodBatch = {
      id: `factory-stock-${Date.now()}`,
      dishName: stock.productName,
      category: stock.category,
      quantityKg: stock.quantityKg,
      preparedTime: Date.now() - 3600 * 1000 * 48, // 48h ago
      storageType: 'Ambient',
      allergens: ['Gluten', 'Milk'],
      initialTempC: 22,
      readings: [{ id: `r-${Date.now()}`, timestamp: Date.now(), temperatureC: 22 }],
      isReusableInHouse: false,
      createdAt: Date.now(),
    };

    if (onRouteStockToMatch) {
      onRouteStockToMatch(newBatch);
    }
  };

  const isStorageBreached = sensorState.storageTempC > storageTempLimitC;

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0F5132]/10 text-[#0F5132] flex items-center justify-center">
                <Factory className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <span>Processing-Unit Monitoring & Anomaly Engine ("Learn")</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Fictional demo data
                </span>
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              10,000 packets/day biscuit plant line telemetry: statistical control charts, waste anomaly detection & secondary cascade routing
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleResetData}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset factory data</span>
            </button>
          </div>
        </div>

        {/* Live Simulator Tag Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-gray-800">
              Simulated sensor feed. Pilot uses ESP32 + MQTT, or manual entry at Level 0
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-gray-500">
            <span>Plant: Hubli Bakery Unit #4</span>
            <span>•</span>
            <span>Line Quota: 10,000 pkts/day</span>
          </div>
        </div>

        {/* Storage Excursion Alert (if breached) */}
        {isStorageBreached && (
          <div className="p-4 bg-red-50 border-2 border-red-400 rounded-2xl flex items-start gap-3 shadow-xs animate-pulse">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="text-sm font-black text-red-950 block">
                Critical Alert: Raw Material / Cold-Room Temperature Excursion!
              </strong>
              <p className="text-xs text-red-800 mt-0.5">
                Current storage probe reading is <strong>{sensorState.storageTempC}°C</strong>, which exceeds your configured safety threshold of <strong>{storageTempLimitC}°C</strong>. Cryptographic excursion recorded in Trust Log.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStorageTempLimitC(sensorState.storageTempC + 2)}
              className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold shrink-0 shadow-2xs"
            >
              Acknowledge & Set to {sensorState.storageTempC + 2}°C
            </button>
          </div>
        )}

        {/* 6 Live Telemetry Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {/* Tile 1: Storage Temp */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            isStorageBreached
              ? 'bg-red-50 border-red-300 text-red-900 shadow-xs'
              : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase">
              <span>Cold Storage</span>
              <Thermometer className={`w-3.5 h-3.5 ${isStorageBreached ? 'text-red-600' : 'text-blue-500'}`} />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-xl sm:text-2xl font-black font-mono ${isStorageBreached ? 'text-red-700' : 'text-gray-900'}`}>
                {sensorState.storageTempC}°C
              </span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              Limit: &le;{storageTempLimitC}°C
            </span>
          </div>

          {/* Tile 2: Humidity */}
          <div className="p-3.5 rounded-2xl bg-white border border-gray-200">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase">
              <span>RH Humidity</span>
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-gray-900">
                {sensorState.storageHumidityPercent}%
              </span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              Target: 45 - 55%
            </span>
          </div>

          {/* Tile 3: Line Speed */}
          <div className="p-3.5 rounded-2xl bg-white border border-gray-200">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase">
              <span>Packer Speed</span>
              <Gauge className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-[#0F5132]">
                {sensorState.lineSpeedPacketsPerHour}
              </span>
              <span className="text-[10px] text-gray-400">pkts/h</span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              Nominal: 500 pkts/h
            </span>
          </div>

          {/* Tile 4: Machine Status */}
          <div className="p-3.5 rounded-2xl bg-white border border-gray-200">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase">
              <span>Line Status</span>
              <Cpu className="w-3.5 h-3.5 text-[#D97706]" />
            </div>
            <div className="mt-1">
              <span className="text-xs font-black text-gray-900 block truncate">
                {sensorState.machineStatus}
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
              PLC Feed: OK
            </span>
          </div>

          {/* Tile 5: Power Draw */}
          <div className="p-3.5 rounded-2xl bg-white border border-gray-200">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase">
              <span>Power Draw</span>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-gray-900">
                {sensorState.powerDrawKw}
              </span>
              <span className="text-[10px] text-gray-400">kW</span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              Idle: &le;12 kW
            </span>
          </div>

          {/* Tile 6: Flour Stock */}
          <div className="p-3.5 rounded-2xl bg-white border border-gray-200">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase">
              <span>Flour Silo</span>
              <Layers className="w-3.5 h-3.5 text-[#0F5132]" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-gray-900">
                {sensorState.flourStockKg.toLocaleString()}
              </span>
              <span className="text-[10px] text-gray-400">kg</span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              34 operating hours
            </span>
          </div>
        </div>

      </div>

      {/* Section 2: 3-Sigma Statistical Control Chart (Recharts) */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-[#0F5132]" />
              <h3 className="text-base font-extrabold text-gray-900">
                Packing Line Speed: 3-Sigma Statistical Quality Control Chart
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Hourly output (packets/hr) over last 48 hours. Red markers highlight breaches beyond upper/lower control limits (&plusmn;3&sigma;)
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F5132]" /> Normal Run
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> &gt;3&sigma; Anomaly
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-red-400 border-dashed" /> UCL / LCL
            </span>
          </div>
        </div>

        {/* Recharts Control Chart */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={controlChartData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} interval={3} />
              <YAxis domain={[200, 600]} tick={{ fontSize: 10, fill: '#64748B' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                        <p className="font-bold text-amber-300">{d.label}</p>
                        <p className="text-emerald-300">Speed: {d.value} pkts/hr</p>
                        <p className="text-gray-400 text-[10px]">
                          Process Mean: {d.mean} pkts/hr (UCL: {d.upperControlLimit} / LCL: {d.lowerControlLimit})
                        </p>
                        {d.isAnomaly && (
                          <p className="text-red-400 font-bold text-[10px]">
                            ⚠ Anomaly: {d.anomalyType || '3-Sigma Process Breach'}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Reference Lines for Mean, UCL, LCL */}
              <ReferenceLine y={controlChartData[0]?.mean || 490} stroke="#64748B" strokeDasharray="3 3" label={{ value: 'Mean', fill: '#64748B', fontSize: 10 }} />
              <ReferenceLine y={controlChartData[0]?.upperControlLimit || 545} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'UCL (+3σ)', fill: '#EF4444', fontSize: 10 }} />
              <ReferenceLine y={controlChartData[0]?.lowerControlLimit || 435} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'LCL (-3σ)', fill: '#EF4444', fontSize: 10 }} />

              <Line
                type="monotone"
                dataKey="value"
                stroke="#0F5132"
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.isAnomaly) {
                    return (
                      <circle
                        key={`dot-${payload.index}`}
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill="#DC2626"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                    );
                  }
                  return (
                    <circle
                      key={`dot-${payload.index}`}
                      cx={cx}
                      cy={cy}
                      r={2.5}
                      fill="#0F5132"
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex items-center justify-between">
          <span>
            <strong>Detection Engine:</strong> Demo uses control charts (3-sigma). Pilot adds Isolation Forest & LSTM autoencoders.
          </span>
          <span className="font-mono text-gray-700">3-Sigma Limits: Auto-calculated</span>
        </div>
      </div>

      {/* Section 3: Anomaly Feed Cards with Action Handlers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#D97706]" />
            <h3 className="text-lg font-black text-gray-900">
              Factory Loss & Anomaly Feed ({dataState.anomalies.length} Flagged Events)
            </h3>
          </div>
          <span className="text-xs text-gray-500">
            Total Estimated Loss: <strong>₹{factoryStats.totalLossRupees.toLocaleString()}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dataState.anomalies.map((card) => {
            const isNearDate = card.type === 'Near-date stock';
            const isOverproduction = card.type === 'Overproduction';

            return (
              <div
                key={card.id}
                className={`p-5 rounded-3xl border shadow-xs space-y-3 transition-all ${
                  card.severity === 'critical'
                    ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                    : 'bg-white border-gray-200 hover:border-amber-300'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        card.type === 'Downtime'
                          ? 'bg-amber-100 text-amber-900'
                          : card.type === 'Raw-material loss'
                          ? 'bg-rose-100 text-rose-900'
                          : card.type === 'Energy waste'
                          ? 'bg-purple-100 text-purple-900'
                          : card.type === 'Near-date stock'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {card.type}
                    </span>
                    <span className="text-[11px] font-mono text-gray-400">
                      {card.hourStr}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black font-mono text-rose-700 block">
                      -₹{card.estimatedLossRupees.toLocaleString()}
                    </span>
                    {card.estimatedLossKg > 0 && (
                      <span className="text-[10px] text-gray-400 block">
                        ~{card.estimatedLossKg} kg loss
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h4 className="text-sm font-extrabold text-gray-900 leading-snug">
                    {card.headline}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                {/* Action Recommendation */}
                <div className="p-3 bg-gray-50/80 rounded-2xl border border-gray-200 text-xs text-gray-700 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                    Suggested Engineering Action:
                  </span>
                  <p className="text-[11px] font-medium leading-relaxed">
                    {card.suggestedAction}
                  </p>
                </div>

                {/* Actionable Buttons for Cascade & Planning integration */}
                {isNearDate && onRouteStockToMatch && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => handleRouteStock(card)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F5132] hover:bg-[#14663f] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                    >
                      <span>Route this stock (Send to Cascade Match)</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                    </button>
                  </div>
                )}

                {isOverproduction && onJumpToBatchPlanner && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={onJumpToBatchPlanner}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                    >
                      <span>Adjust Batch Planner (Plan Tab)</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-200" />
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

      {/* Mandatory Honesty Footer */}
      <div className="text-center text-[11px] font-semibold text-gray-400 py-2">
        Demo data is fictional. Models shown are simple demo versions of the ones planned for the pilot.
      </div>

    </div>
  );
};
