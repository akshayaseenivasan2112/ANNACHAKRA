import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Truck,
  Layers,
  ArrowRight,
  TrendingDown,
  Fuel,
  Leaf,
  Info,
  Compass,
} from 'lucide-react';

interface Point {
  id: string;
  name: string;
  type: 'depot' | 'donor' | 'receiver';
  x: number; // SVG coordinate
  y: number;
  label: string;
  sublabel: string;
  color: string;
}

export const RouteMap: React.FC = () => {
  const [viewMode, setViewMode] = useState<'pooled' | 'separate'>('pooled');

  // Coordinates on a 420 x 300 SVG canvas representing local city cluster
  const depot: Point = {
    id: 'hub',
    name: 'Shared Logistics Hub',
    type: 'depot',
    x: 200,
    y: 150,
    label: 'Hub',
    sublabel: 'EV Van Base',
    color: '#0F5132',
  };

  const donors: Point[] = [
    {
      id: 'd1',
      name: 'Ananta Central Kitchen',
      type: 'donor',
      x: 100,
      y: 90,
      label: 'D1: Ananta Kitchen',
      sublabel: '40 kg cooked curry',
      color: '#D97706',
    },
    {
      id: 'd2',
      name: 'Campus Tech Park Canteen',
      type: 'donor',
      x: 230,
      y: 65,
      label: 'D2: Tech Canteen',
      sublabel: '25 kg rice & dal',
      color: '#D97706',
    },
    {
      id: 'd3',
      name: 'Metro Bakery & Foods',
      type: 'donor',
      x: 80,
      y: 220,
      label: 'D3: Metro Bakery',
      sublabel: '30 kg bread & buns',
      color: '#D97706',
    },
  ];

  const receivers: Point[] = [
    {
      id: 'r1',
      name: 'Seva Community Kitchen',
      type: 'receiver',
      x: 340,
      y: 130,
      label: 'R1: Seva Kitchen',
      sublabel: 'Cap: 60 kg (Tier 2)',
      color: '#2563EB',
    },
    {
      id: 'r2',
      name: 'Asha Child Haven',
      type: 'receiver',
      x: 290,
      y: 245,
      label: 'R2: Asha Haven',
      sublabel: 'Cap: 40 kg (Tier 2)',
      color: '#2563EB',
    },
  ];

  // Scale factor: 1 SVG unit ~ 0.075 km
  const kmScale = 0.075;

  const distKm = (p1: Point, p2: Point) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy) * kmScale;
  };

  // Compute Separate Trips:
  // Trip 1: Hub -> D1 -> R1 -> Hub
  // Trip 2: Hub -> D2 -> R1 -> Hub
  // Trip 3: Hub -> D3 -> R2 -> Hub
  const separateTrips = useMemo(() => {
    const trip1 = distKm(depot, donors[0]) + distKm(donors[0], receivers[0]) + distKm(receivers[0], depot);
    const trip2 = distKm(depot, donors[1]) + distKm(donors[1], receivers[0]) + distKm(receivers[0], depot);
    const trip3 = distKm(depot, donors[2]) + distKm(donors[2], receivers[1]) + distKm(receivers[1], depot);
    const total = trip1 + trip2 + trip3;
    return { trip1, trip2, trip3, total };
  }, []);

  // Compute Pooled Route using Nearest-Neighbour Heuristic:
  // Sequence: Hub -> D1 -> D2 -> R1 -> D3 -> R2 -> Hub
  const pooledRoute = useMemo(() => {
    const d_hub_d1 = distKm(depot, donors[0]);
    const d_d1_d2 = distKm(donors[0], donors[1]);
    const d_d2_r1 = distKm(donors[1], receivers[0]);
    const d_r1_d3 = distKm(receivers[0], donors[2]);
    const d_d3_r2 = distKm(donors[2], receivers[1]);
    const d_r2_hub = distKm(receivers[1], depot);
    const total = d_hub_d1 + d_d1_d2 + d_d2_r1 + d_r1_d3 + d_d3_r2 + d_r2_hub;
    return {
      total,
      sequence: [depot, donors[0], donors[1], receivers[0], donors[2], receivers[1], depot],
    };
  }, []);

  const savedKm = Math.max(0, separateTrips.total - pooledRoute.total);
  const percentSaved = Math.round((savedKm / separateTrips.total) * 100);
  const fuelSavedLitres = Number((savedKm * 0.12).toFixed(1)); // ~12L / 100km for city diesel van
  const co2eSavedKg = Number((fuelSavedLitres * 2.68).toFixed(1)); // 2.68 kg CO2e / L diesel

  // Generate SVG path string from points
  const getPathD = (pts: Point[]) => {
    return pts.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#0F5132]" />
              <span>Pooled Multi-Stop Pickup Route Map</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Fictional demo data
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Combines pickups across 3 nearby donors and drops off at 2 verified shelters in a single coordinated loop.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl self-start sm:self-auto border border-gray-200">
          <button
            type="button"
            onClick={() => setViewMode('pooled')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'pooled'
                ? 'bg-[#0F5132] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pooled Route (Green)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('separate')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'separate'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Separate Trips (Red)
          </button>
        </div>
      </div>

      {/* KPI Comparison Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-200">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Separate Individual Trips
          </span>
          <div className="mt-1 flex items-baseline gap-1 font-mono">
            <span className="text-xl font-extrabold text-gray-800">
              {separateTrips.total.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500 font-bold">km</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5 block">3 separate back-and-forth runs</span>
        </div>

        <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
            Optimized Pooled Route
          </span>
          <div className="mt-1 flex items-baseline gap-1 font-mono">
            <span className="text-xl font-extrabold text-[#0F5132]">
              {pooledRoute.total.toFixed(1)}
            </span>
            <span className="text-xs text-emerald-700 font-bold">km</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">1 consolidated circuit</span>
        </div>

        <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
            Distance Saved
          </span>
          <div className="mt-1 flex items-baseline gap-1 font-mono">
            <span className="text-xl font-extrabold text-amber-900">
              {savedKm.toFixed(1)}
            </span>
            <span className="text-xs text-amber-700 font-bold">km (-{percentSaved}%)</span>
          </div>
          <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">Less vehicle road time</span>
        </div>

        <div className="bg-emerald-950 text-white p-3 rounded-2xl border border-emerald-900">
          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block flex items-center gap-1">
            <Leaf className="w-3 h-3 text-amber-300" />
            Emissions Cut
          </span>
          <div className="mt-1 flex items-baseline gap-1 font-mono">
            <span className="text-xl font-extrabold text-amber-300">
              {co2eSavedKg}
            </span>
            <span className="text-xs text-emerald-200 font-bold">kg CO₂e</span>
          </div>
          <span className="text-[10px] text-emerald-300 font-medium mt-0.5 block">~{fuelSavedLitres}L diesel saved</span>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div className="relative bg-[#0d1d15] rounded-2xl p-3 sm:p-4 border border-emerald-900/60 overflow-hidden shadow-inner">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <svg
          viewBox="0 0 420 300"
          className="w-full h-auto max-h-[360px] select-none"
        >
          <defs>
            {/* Arrow marker for pooled green line */}
            <marker
              id="greenArrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10B981" />
            </marker>

            {/* Arrow marker for red separate lines */}
            <marker
              id="redArrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#F43F5E" />
            </marker>
          </defs>

          {/* Separate Trips Path (if active) */}
          {viewMode === 'separate' && (
            <g strokeDasharray="5,4" strokeWidth="2.5" opacity="0.85">
              {/* Trip 1: Hub -> D1 -> R1 -> Hub */}
              <path
                d={getPathD([depot, donors[0], receivers[0], depot])}
                fill="none"
                stroke="#F43F5E"
                markerMid="url(#redArrow)"
              />
              {/* Trip 2: Hub -> D2 -> R1 -> Hub */}
              <path
                d={getPathD([depot, donors[1], receivers[0], depot])}
                fill="none"
                stroke="#FB7185"
                markerMid="url(#redArrow)"
              />
              {/* Trip 3: Hub -> D3 -> R2 -> Hub */}
              <path
                d={getPathD([depot, donors[2], receivers[1], depot])}
                fill="none"
                stroke="#FDA4AF"
                markerMid="url(#redArrow)"
              />
            </g>
          )}

          {/* Pooled Route Path (if active) */}
          {viewMode === 'pooled' && (
            <path
              d={getPathD(pooledRoute.sequence)}
              fill="none"
              stroke="#10B981"
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]"
              markerMid="url(#greenArrow)"
            />
          )}

          {/* Nodes: Donors */}
          {donors.map((d, i) => (
            <g key={d.id} className="cursor-pointer">
              <circle
                cx={d.x}
                cy={d.y}
                r="14"
                fill="#D97706"
                className="transition-transform hover:scale-110 shadow-lg"
              />
              <circle cx={d.x} cy={d.y} r="18" fill="none" stroke="#FBBF24" strokeWidth="1.5" opacity="0.6" />
              <text
                x={d.x}
                y={d.y + 4}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
              >
                D{i + 1}
              </text>
              <text
                x={d.x}
                y={d.y - 18}
                textAnchor="middle"
                fill="#FDE68A"
                fontSize="9"
                fontWeight="700"
              >
                {d.label}
              </text>
              <text
                x={d.x}
                y={d.y + 26}
                textAnchor="middle"
                fill="#D1D5DB"
                fontSize="8"
              >
                {d.sublabel}
              </text>
            </g>
          ))}

          {/* Nodes: Receivers */}
          {receivers.map((r, i) => (
            <g key={r.id} className="cursor-pointer">
              <circle
                cx={r.x}
                cy={r.y}
                r="14"
                fill="#2563EB"
                className="transition-transform hover:scale-110 shadow-lg"
              />
              <circle cx={r.x} cy={r.y} r="18" fill="none" stroke="#60A5FA" strokeWidth="1.5" opacity="0.6" />
              <text
                x={r.x}
                y={r.y + 4}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
              >
                R{i + 1}
              </text>
              <text
                x={r.x}
                y={r.y - 18}
                textAnchor="middle"
                fill="#93C5FD"
                fontSize="9"
                fontWeight="700"
              >
                {r.label}
              </text>
              <text
                x={r.x}
                y={r.y + 26}
                textAnchor="middle"
                fill="#D1D5DB"
                fontSize="8"
              >
                {r.sublabel}
              </text>
            </g>
          ))}

          {/* Central Logistics Hub */}
          <g className="cursor-pointer">
            <rect
              x={depot.x - 14}
              y={depot.y - 14}
              width="28"
              height="28"
              rx="6"
              fill="#0F5132"
              stroke="#34D399"
              strokeWidth="2"
            />
            <text
              x={depot.x}
              y={depot.y + 4}
              textAnchor="middle"
              fill="#FBBF24"
              fontSize="10"
              fontWeight="900"
              fontFamily="monospace"
            >
              HUB
            </text>
            <text
              x={depot.x}
              y={depot.y + 28}
              textAnchor="middle"
              fill="#A7F3D0"
              fontSize="8"
              fontWeight="600"
            >
              {depot.name}
            </text>
          </g>
        </svg>

        {/* Overlay Legend */}
        <div className="mt-2 pt-2 border-t border-emerald-900/60 flex flex-wrap items-center justify-between text-[11px] text-gray-300 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" /> Donors (D1, D2, D3)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" /> Receivers (R1, R2)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0F5132] border border-emerald-400" /> Logistics Hub
            </span>
          </div>

          <div className="text-[10px] text-amber-300 font-mono">
            Trip sequence: HUB → D1 → D2 → R1 → D3 → R2 → HUB
          </div>
        </div>
      </div>

      {/* Model disclaimer badge */}
      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Optimization Algorithm Note:</span>
          <p className="text-[11px] text-amber-900/90 mt-0.5">
            <strong>Demo heuristic:</strong> Nearest-neighbour cluster routing running in browser JavaScript.{' '}
            <strong>Pilot uses Google OR-Tools VRP with OpenStreetMap</strong> to account for real-time traffic, vehicle payload constraints, cold-box capacities, and tight Arrhenius safe-hour deadlines.
          </p>
          <span className="text-[10px] text-gray-500 font-mono mt-1 block">
            Illustrative, to be validated in pilot • Fictional demo data
          </span>
        </div>
      </div>
    </div>
  );
};
