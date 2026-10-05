import React from 'react';
import {
  Clock,
  RotateCcw,
  Sliders,
  FastForward,
  Play,
  Zap,
} from 'lucide-react';

interface HeaderProps {
  timeWarp: number;
  onTimeWarpChange: (speed: number) => void;
  onReset: () => void;
  onOpenSettings: () => void;
  onAdvanceHours?: (hours: number) => void;
  simulatedTimeMs: number;
}

export const Header: React.FC<HeaderProps> = ({
  timeWarp,
  onTimeWarpChange,
  onReset,
  onOpenSettings,
  onAdvanceHours,
  simulatedTimeMs,
}) => {
  const formattedSimulatedTime = new Date(simulatedTimeMs).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <header className="bg-[#0F5132] text-white shadow-md border-b border-[#14663f] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Brand & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1b7348] to-[#0a3822] border border-[#2fa069]/40 flex items-center justify-center shadow-inner text-[#D97706]">
              {/* Chakra wheel / clock icon stylized */}
              <div className="relative flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-400 stroke-[2.2]" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-[#0F5132] animate-ping" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  Anna<span className="text-[#FBBF24]">Chakra</span>
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-[#166534] border border-[#22c55e]/40 text-emerald-100">
                  Arrhenius MKT Engine
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-0.5">
                Every food batch gets a live <span className="text-amber-300 font-semibold">Spoilage Clock</span>
              </p>
            </div>
          </div>

          {/* Right Controls: Time Warp & Actions */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 bg-[#0a3822]/80 p-2 sm:p-2.5 rounded-xl border border-emerald-800/60 shadow-sm">
            
            {/* Live Clock / Simulated Time indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-mono text-[11px] uppercase tracking-wider">Sim Clock</span>
              <span className="font-mono font-bold text-amber-300 ml-1">{formattedSimulatedTime}</span>
            </div>

            {/* Time Warp selector */}
            <div className="flex items-center bg-black/30 rounded-lg p-0.5 border border-emerald-700/50">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300 px-2 flex items-center gap-1 hidden sm:inline-flex">
                <Zap className="w-3 h-3 text-amber-400" /> Time Warp:
              </span>
              {( [1, 60, 600] as const ).map((speed) => {
                const isActive = timeWarp === speed;
                return (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => onTimeWarpChange(speed)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                      isActive
                        ? 'bg-[#D97706] text-white shadow-sm ring-1 ring-amber-300'
                        : 'text-emerald-200 hover:text-white hover:bg-emerald-900/40'
                    }`}
                    title={`Simulate at ${speed}x real speed`}
                  >
                    {speed === 1 ? '1x Real' : `${speed}x`}
                  </button>
                );
              })}
            </div>

            {/* Quick +1 Hour step */}
            {onAdvanceHours && (
              <button
                type="button"
                onClick={() => onAdvanceHours(1)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100 hover:text-white border border-emerald-700/60 transition-colors"
                title="Fast-forward simulated time by +1 hour"
              >
                <FastForward className="w-3.5 h-3.5 text-amber-300" />
                <span>+1h</span>
              </button>
            )}

            {/* Settings button */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 hover:text-white border border-emerald-700/60 transition-colors"
              title="Edit Arrhenius Safe Hours & Baseline Config"
              aria-label="Settings"
            >
              <Sliders className="w-4 h-4 text-emerald-100" />
            </button>

            {/* Reset button */}
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-200 hover:text-white border border-red-800/40 transition-colors"
              title="Reset time warp and restore demo batches"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
