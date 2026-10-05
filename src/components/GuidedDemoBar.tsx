import React from 'react';
import { TabId } from './Tabs';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Calendar,
  Boxes,
  Handshake,
  FileCheck2,
  Fingerprint,
  Factory,
  Leaf,
  CheckCircle,
} from 'lucide-react';

export interface DemoStep {
  stepNumber: number;
  title: string;
  tabTarget: TabId;
  caption: string;
  hint: string;
  actionButtonLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const GUIDED_DEMO_STEPS: DemoStep[] = [
  {
    stepNumber: 1,
    title: 'Plan (Predict)',
    tabTarget: 'Plan',
    caption: 'Friday: cook 12% less rice. Expected attendance is lower and rain is forecast.',
    hint: 'Notice the honest MAPE score (6.8%) and the Batch Planner recommendation below.',
    actionButtonLabel: 'View Friday Advice',
    icon: Calendar,
  },
  {
    stepNumber: 2,
    title: 'Batch (Track)',
    tabTarget: 'Batches',
    caption: 'Vegetable curry (40 kg, Cooked) initialized with Batch Passport, allergens, and live Arrhenius Spoilage Clock.',
    hint: 'Observe the countdown timer adjusting based on real temperature history and vision freshness score.',
    actionButtonLabel: 'Inspect Spoilage Clock',
    icon: Boxes,
  },
  {
    stepNumber: 3,
    title: 'Match (Route)',
    tabTarget: 'Match',
    caption: 'The nearest shelter (2 km) loses to the best fit because of capacity and reliability; allergens enforce strict exclusions.',
    hint: 'Scroll down to the 5-tier Cascade Ladder and inspect the Multi-Factor Match Score breakdown.',
    actionButtonLabel: 'Inspect Cascade Ladder',
    icon: Handshake,
  },
  {
    stepNumber: 4,
    title: 'Handover (Route)',
    tabTarget: 'Handover',
    caption: 'Send the WhatsApp alert, test Decline to trigger backup escalation, then Accept with 4-digit code and core temperature verification.',
    hint: 'Review the interactive smartphone preview and verified digital Handover Receipt.',
    actionButtonLabel: 'Check Dispatch Desk',
    icon: FileCheck2,
  },
  {
    stepNumber: 5,
    title: 'Trust Log (Prove)',
    tabTarget: 'Trust Log',
    caption: 'Cryptographic SHA-256 hash chain with 90+ Trust Score; test the red "Simulate Tampering" button to see instant fraud detection.',
    hint: 'Tampered blocks turn red immediately; click "Restore Original" to re-verify the hash chain.',
    actionButtonLabel: 'Run Tamper Test',
    icon: Fingerprint,
  },
  {
    stepNumber: 6,
    title: 'Factory (Learn)',
    tabTarget: 'Factory',
    caption: 'Processing-unit control charts detect line packer drop (-40%), flour loss spike, and route near-date biscuit stock directly into Match.',
    hint: 'Click "Route this stock" on the Near-date Stock card to cascade 80 kg of flour into Tier 3 / Tier 4.',
    actionButtonLabel: 'View Anomaly Feed',
    icon: Factory,
  },
  {
    stepNumber: 7,
    title: 'Impact (Prove)',
    tabTarget: 'Impact',
    caption: 'Download the comprehensive BRSR ESG Sustainability report quantifying food waste prevented, meals served, and avoided CO2e.',
    hint: 'Click "Export ESG PDF Report" or tweak the interactive scenario calculator assumptions.',
    actionButtonLabel: 'Generate ESG PDF',
    icon: Leaf,
  },
];

interface GuidedDemoBarProps {
  currentStepIndex: number;
  onNextStep: () => void;
  onPrevStep: () => void;
  onExitDemo: () => void;
  onJumpToStep: (index: number) => void;
}

export const GuidedDemoBar: React.FC<GuidedDemoBarProps> = ({
  currentStepIndex,
  onNextStep,
  onPrevStep,
  onExitDemo,
  onJumpToStep,
}) => {
  const currentStep = GUIDED_DEMO_STEPS[currentStepIndex] || GUIDED_DEMO_STEPS[0];
  const Icon = currentStep.icon;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === GUIDED_DEMO_STEPS.length - 1;

  return (
    <aside aria-label="Guided demo controls" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-3 sm:px-4 pointer-events-none">
      <div className="bg-gray-950/95 text-white backdrop-blur-md border-2 border-amber-400/90 rounded-3xl p-3.5 sm:p-4 shadow-2xl pointer-events-auto flex flex-col gap-3 ring-4 ring-black/30">
        
        {/* Top Row: Progress Indicators & Step Title */}
        <div className="flex items-center justify-between gap-2 border-b border-gray-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-gray-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3 h-3 text-amber-900" />
              Demo Tour
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-amber-300">
                Step {currentStep.stepNumber} of {GUIDED_DEMO_STEPS.length}:
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
                <Icon className="w-4 h-4 text-amber-300" />
                {currentStep.title}
              </span>
            </div>
          </div>

          {/* Stepper Dots (clickable on desktop) */}
          <div className="hidden md:flex items-center gap-1.5">
            {GUIDED_DEMO_STEPS.map((s, idx) => (
              <button
                key={s.stepNumber}
                type="button"
                onClick={() => onJumpToStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-6 bg-amber-400'
                    : idx < currentStepIndex
                    ? 'w-2 bg-emerald-400'
                    : 'w-2 bg-gray-700 hover:bg-gray-500'
                }`}
                title={`Jump to Step ${s.stepNumber}: ${s.title}`}
              />
            ))}
          </div>

          {/* Exit Button */}
          <button
            type="button"
            onClick={onExitDemo}
            className="p-1 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            title="Exit Guided Demo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Middle: Caption & Hint */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 max-w-2xl">
            <p className="text-xs sm:text-sm font-bold text-emerald-200 leading-snug">
              "{currentStep.caption}"
            </p>
            <p className="text-[11px] text-gray-400 font-medium">
              💡 {currentStep.hint}
            </p>
          </div>

          {/* Controls: Back & Next */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={onPrevStep}
              disabled={isFirst}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isFirst
                  ? 'opacity-40 cursor-not-allowed bg-gray-800 text-gray-500'
                  : 'bg-gray-800 hover:bg-gray-700 text-white cursor-pointer active:scale-95'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            {isLast ? (
              <button
                type="button"
                onClick={onExitDemo}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <CheckCircle className="w-3.5 h-3.5 text-amber-300" />
                <span>Complete Tour</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onNextStep}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <span>Next Step</span>
                <ChevronRight className="w-3.5 h-3.5 text-amber-200" />
              </button>
            )}
          </div>
        </div>

      </div>
    </aside>
  );
};
