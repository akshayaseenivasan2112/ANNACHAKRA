import React from 'react';
import { TabId } from './Tabs';
import {
  Calendar,
  Boxes,
  Handshake,
  FileCheck2,
  Fingerprint,
  Factory,
  Leaf,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Smartphone,
  CheckCircle2,
  Clock,
  Building2,
  DollarSign,
  Heart,
  Store,
  Layers,
  HelpCircle,
  PlayCircle,
  Activity,
  Zap,
} from 'lucide-react';

interface HomeTabProps {
  onNavigateTab: (tab: TabId) => void;
  onStartGuidedDemo: () => void;
  batchCount: number;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  onNavigateTab,
  onStartGuidedDemo,
  batchCount,
}) => {
  // Five stages loop
  const stages: Array<{
    stage: string;
    action: string;
    tabTarget: TabId;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    badgeText: string;
    description: string;
  }> = [
    {
      stage: 'Predict',
      action: 'Demand & Surplus Forecast',
      tabTarget: 'Plan',
      icon: Calendar,
      accentColor: 'from-blue-600 to-indigo-700',
      badgeText: 'Plan Tab',
      description:
        'Canteen & factory attendance modeling, rain/holiday factors, and plain-English kitchen preparation advice.',
    },
    {
      stage: 'Track',
      action: 'Dynamic Spoilage Clock',
      tabTarget: 'Batches',
      icon: Boxes,
      accentColor: 'from-[#0F5132] to-emerald-800',
      badgeText: 'Batches Tab',
      description:
        'Arrhenius Mean Kinetic Temperature (MKT) continuous decay tracking and vision freshness verification.',
    },
    {
      stage: 'Route',
      action: 'Cascade Redistribution',
      tabTarget: 'Match',
      icon: Handshake,
      accentColor: 'from-amber-600 to-yellow-700',
      badgeText: 'Match & Handover',
      description:
        '5-tier hierarchy (T1 In-house → T2 People → T3 Secondary → T4 Animal feed → T5 Biogas) & WhatsApp dispatch.',
    },
    {
      stage: 'Prove',
      action: 'Audit Log & BRSR ESG',
      tabTarget: 'Trust Log',
      icon: Fingerprint,
      accentColor: 'from-emerald-700 to-teal-800',
      badgeText: 'Trust Log & Impact',
      description:
        'SHA-256 cryptographic immutable hash chain, tamper detection, and audit-grade ESG sustainability metrics.',
    },
    {
      stage: 'Learn',
      action: 'Factory Anomalies & Waste',
      tabTarget: 'Factory',
      icon: Factory,
      accentColor: 'from-purple-700 to-fuchsia-800',
      badgeText: 'Factory Tab',
      description:
        'Statistical control charts for line speed, flour loss, energy spikes, and routing near-date inventory.',
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a3822] via-[#0F5132] to-[#166534] text-white p-6 sm:p-10 shadow-xl border border-emerald-700/60">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-semibold text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>SIH 2026 • PS SIH26234 • Team Ananta</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Anna<span className="text-[#FBBF24]">Chakra</span>
            </h1>
            <p className="text-lg sm:text-2xl font-bold text-emerald-100">
              AI-powered food-waste loop:{' '}
              <span className="text-amber-300 underline decoration-amber-400/60 underline-offset-4">
                Predict, Track, Route, Prove, Learn
              </span>
            </p>
          </div>

          <p className="text-sm sm:text-base text-emerald-100/90 max-w-2xl leading-relaxed">
            Eliminating institutional and industrial food waste before it rots. Replacing arbitrary expiry labels with continuous Arrhenius food kinetics, multi-factor NGO cascade dispatch, and cryptographic tamper-evident audit trails.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onStartGuidedDemo}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#D97706] hover:bg-[#b45309] text-white text-sm sm:text-base font-extrabold shadow-lg hover:shadow-xl transition-all transform active:scale-95 cursor-pointer ring-2 ring-amber-300/40"
            >
              <PlayCircle className="w-5 h-5 text-amber-200 fill-amber-300/20" />
              <span>Start 2-Minute Guided Demo</span>
              <ArrowRight className="w-4 h-4 text-amber-200" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('Plan')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold border border-white/20 transition-all cursor-pointer"
            >
              <span>Explore Self-Guided</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('README')}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-black/20 hover:bg-black/30 text-emerald-200 text-xs font-semibold border border-emerald-800/80 transition-all cursor-pointer"
            >
              <span>Read Architecture Specs</span>
            </button>
          </div>

          <div className="pt-2 flex items-center gap-3 text-xs text-emerald-200/80">
            <span className="px-2 py-0.5 rounded-md bg-black/30 font-mono text-[11px] text-amber-300">
              Fictional demo data
            </span>
            <span>•</span>
            <span>Designed around FSSAI Surplus Food Regulations (2019)</span>
          </div>
        </div>
      </div>

      {/* Five Stages Interactive Clickable Row */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#0F5132]" />
            <h2 className="text-lg font-black text-gray-900 tracking-tight">
              The 5-Stage Closed Loop Architecture
            </h2>
          </div>
          <span className="text-xs font-semibold text-gray-500 hidden sm:inline">
            Click any stage to open its live interactive tab
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {stages.map((stg, idx) => {
            const Icon = stg.icon;
            return (
              <button
                key={stg.stage}
                type="button"
                onClick={() => onNavigateTab(stg.tabTarget)}
                className="group p-4 bg-white rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-[#0F5132]/60 transition-all text-left flex flex-col justify-between cursor-pointer transform active:scale-98"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 group-hover:bg-[#0F5132] group-hover:text-white transition-colors">
                      STAGE 0{idx + 1}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {stg.badgeText}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-2 rounded-xl bg-gray-50 text-gray-800 group-hover:bg-amber-50 group-hover:text-amber-800 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900 leading-tight">
                        {stg.stage}
                      </h3>
                      <p className="text-[11px] font-bold text-gray-500">
                        {stg.action}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed mt-2 line-clamp-3">
                    {stg.description}
                  </p>
                </div>

                <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#0F5132] group-hover:text-amber-800">
                  <span>Open {stg.stage} Tab</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Simple Architecture Diagram (Styled Boxes) */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#0F5132]" />
              <span>System Flow & Architecture Pipeline</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              High-throughput pipeline connecting edge sensing to mathematical models, cloud AI, and recipient delivery.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Working in this demo
            </span>
            <span className="flex items-center gap-1.5 font-bold text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Pilot roadmap
            </span>
          </div>
        </div>

        {/* 4 Pipeline Stages */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Stage 1: Inputs */}
          <div className="bg-gray-50/90 rounded-2xl p-4 border border-gray-200/90 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Step 1</span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded">
                  Dual Mode
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-gray-900 mb-2">Data Intake</h4>
              
              <ul className="text-xs space-y-2 text-gray-700">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Manual & QR Intake:</strong> Batch weight, storage category, allergen tags{' '}
                    <span className="text-[10px] text-emerald-800 font-semibold">(Working)</span>
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Phone Camera:</strong> Freshness assessment & plate waste tray photo{' '}
                    <span className="text-[10px] text-emerald-800 font-semibold">(Working)</span>
                  </span>
                </li>
                <li className="flex items-start gap-1.5 text-slate-600">
                  <span className="w-3.5 h-3.5 rounded-full bg-slate-300 text-[10px] font-bold text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    •
                  </span>
                  <span>
                    <strong>ESP32 Microcontrollers:</strong> Live probe telemetry (simulated in demo, physical pilot roadmap)
                  </span>
                </li>
                <li className="flex items-start gap-1.5 text-slate-600">
                  <span className="w-3.5 h-3.5 rounded-full bg-slate-300 text-[10px] font-bold text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    •
                  </span>
                  <span>
                    <strong>ERP / POS CSV Sync:</strong> Institutional attendance & production sync (Pilot roadmap)
                  </span>
                </li>
              </ul>
            </div>
            <div className="text-[10px] text-gray-400 font-mono text-right">Inputs & Sensors →</div>
          </div>

          {/* Stage 2: Edge / Browser Logic */}
          <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Step 2</span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.2 rounded">
                  100% Working
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-[#0F5132] mb-2">Edge & Browser Engine</h4>

              <ul className="text-xs space-y-2 text-emerald-950">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Arrhenius MKT Decay:</strong> Numerical integration of Mean Kinetic Temperature
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>SHA-256 Ledger:</strong> Client-side cryptographic hash linking with HMAC signatures
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Offline LocalStorage:</strong> Zero loss of data during network drops
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Vehicle Route Heuristic:</strong> Nearest-neighbour cluster mileage savings
                  </span>
                </li>
              </ul>
            </div>
            <div className="text-[10px] text-emerald-700 font-mono text-right">Edge Calculus →</div>
          </div>

          {/* Stage 3: Cloud AI */}
          <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Step 3</span>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.2 rounded">
                  Hybrid
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-amber-950 mb-2">Cloud AI & Optimization</h4>

              <ul className="text-xs space-y-2 text-amber-950">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Gemini 2.5 Flash:</strong> Visual freshness scoring & tray plate-waste estimation{' '}
                    <span className="text-[10px] text-emerald-800 font-semibold">(Working)</span>
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Transparent Forecast:</strong> Weighted seasonal baseline + rain/holiday factors{' '}
                    <span className="text-[10px] text-emerald-800 font-semibold">(Working)</span>
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>3-Sigma Anomaly Engine:</strong> Real-time control charts for plant line speed{' '}
                    <span className="text-[10px] text-emerald-800 font-semibold">(Working)</span>
                  </span>
                </li>
                <li className="flex items-start gap-1.5 text-slate-600">
                  <span className="w-3.5 h-3.5 rounded-full bg-slate-300 text-[10px] font-bold text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    •
                  </span>
                  <span>
                    <strong>Prophet / LightGBM + Isolation Forest:</strong> Multi-year pilot modeling (Pilot roadmap)
                  </span>
                </li>
              </ul>
            </div>
            <div className="text-[10px] text-amber-800 font-mono text-right">Intelligent Dispatch →</div>
          </div>

          {/* Stage 4: Outputs */}
          <div className="bg-gray-50/90 rounded-2xl p-4 border border-gray-200/90 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Step 4</span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded">
                  Operational
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-gray-900 mb-2">Verifiable Outputs</h4>

              <ul className="text-xs space-y-2 text-gray-700">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Interactive Phone Dispatch:</strong> WhatsApp & SMS alerts with acceptance flow{' '}
                    <span className="text-[10px] text-emerald-800 font-semibold">(Working)</span>
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Signed Handover Receipts:</strong> 4-digit code and core temperature logging{' '}
                    <span className="text-[10px] text-emerald-800 font-semibold">(Working)</span>
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>FSSAI Audit Ledger:</strong> Cryptographic verification of compliance{' '}
                    <span className="text-[10px] text-emerald-800 font-semibold">(Working)</span>
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>BRSR ESG Sustainability PDF:</strong> Exportable corporate compliance report{' '}
                    <span className="text-[10px] text-emerald-800 font-semibold">(Working)</span>
                  </span>
                </li>
              </ul>
            </div>
            <div className="text-[10px] text-gray-400 font-mono text-right">Human Confirmed Handover ✓</div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Business Model & Hardware Levels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* "Who Pays" Card (Business Model) */}
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-800">
                <DollarSign className="w-5 h-5 text-[#D97706]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  Business Model ("Who Pays")
                </h3>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Business model, to be validated in pilot
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-600">
            AnnaChakra ensures sustainability without burdening charitable beneficiaries:
          </p>

          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-start gap-3">
              <Building2 className="w-5 h-5 text-[#0F5132] shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-extrabold text-gray-900 block">
                  1. Factories & Institutional Kitchens
                </span>
                <p className="text-gray-600 mt-0.5">
                  Pay a monthly per-site SaaS subscription (INR 4,500 – 18,000/site/month). Recovered value in avoided raw material loss and waste hauling costs typically yields a 4x ROI.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-start gap-3">
              <Leaf className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-extrabold text-gray-900 block">
                  2. Corporates & CSR Sponsors
                </span>
                <p className="text-gray-600 mt-0.5">
                  Pay a per-kg rescue fee for verified impact credits (INR 3.50/kg). Includes audit-grade SEBI BRSR Core sustainability certification with tamper-evident digital proof.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-start gap-3">
              <Store className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-extrabold text-gray-900 block">
                  3. Commercial Secondary Buyers (Tier 3)
                </span>
                <p className="text-gray-600 mt-0.5">
                  Pay discounted rates for raw/packaged surplus inventory; AnnaChakra retains a small 4–6% transaction commission on settled batches.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-300 flex items-start gap-3">
              <Heart className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-extrabold text-emerald-950 block">
                  4. Non-Profit Community Receivers (NGOs) — FREE ALWAYS
                </span>
                <p className="text-emerald-800 font-medium mt-0.5">
                  Shelters, orphanages, and community feeding centres NEVER pay to participate, receive alerts, or collect food.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hardware Levels Card */}
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-[#0F5132]">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  Hardware Tiers (L0 to L2)
                </h3>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Zero-barrier adoption
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-600">
            Designed so any kitchen can deploy immediately with zero initial hardware purchases:
          </p>

          <div className="space-y-3">
            {/* L0 */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-start gap-3">
              <div className="px-2 py-1 rounded-lg bg-gray-800 text-white font-mono font-black text-xs shrink-0">
                L0
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-gray-900 block">
                  Level 0: Zero New Hardware (Manual & Probe)
                </span>
                <p className="text-gray-600 mt-0.5">
                  Kitchen staff uses any smartphone browser. Readings are entered manually using their existing kitchen probe thermometer or food storage logs.
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                  Cost: ₹0 • Deployed in 3 minutes
                </span>
              </div>
            </div>

            {/* L1 */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-start gap-3">
              <div className="px-2 py-1 rounded-lg bg-emerald-800 text-white font-mono font-black text-xs shrink-0">
                L1
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-gray-900 block">
                  Level 1: Phone Camera Visual Audit
                </span>
                <p className="text-gray-600 mt-0.5">
                  Takes a single photo of the prepared batch or tray. Gemini 2.5 Flash extracts dish characteristics, surface freshness defects, and plate-waste percentages.
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                  Cost: ₹0 hardware • Uses existing staff smartphones
                </span>
              </div>
            </div>

            {/* L2 */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
              <div className="px-2 py-1 rounded-lg bg-[#0F5132] text-amber-300 font-mono font-black text-xs shrink-0">
                L2
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-emerald-950 block">
                  Level 2: Continuous ESP32 IoT Telemetry
                </span>
                <p className="text-emerald-900 mt-0.5">
                  Optional ultra-low-cost ESP32 microcontrollers with DS18B20 / DHT22 temperature probes logging continuous readings over MQTT to cloud.
                </p>
                <span className="text-[10px] text-amber-800 font-bold mt-1 block">
                  Simulated in this demo • Production hardware cost &lt; ₹1,200 per cold room
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Launchpad to Guided Tour */}
      <div className="p-6 rounded-3xl bg-amber-50/80 border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-base font-extrabold text-amber-950 flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="w-5 h-5 text-[#D97706]" />
            <span>Ready for the Evaluator Walkthrough?</span>
          </h4>
          <p className="text-xs text-amber-900/90 max-w-xl">
            Click "Start Guided Demo" to follow the curated 7-step journey showcasing the full Predict → Track → Route → Prove → Learn lifecycle.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartGuidedDemo}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0F5132] hover:bg-[#14663f] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
        >
          <PlayCircle className="w-4 h-4 text-amber-300" />
          <span>Launch Guided Demo</span>
        </button>
      </div>
    </div>
  );
};
