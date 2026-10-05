import React from 'react';
import { TabId } from './Tabs';
import {
  Factory,
  Leaf,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface PlaceholderTabsProps {
  tabId: 'Factory' | 'ESG';
  onGoToBatches: () => void;
}

export const PlaceholderTabs: React.FC<PlaceholderTabsProps> = ({
  tabId,
  onGoToBatches,
}) => {
  const tabDetails: Record<
    'Factory' | 'ESG',
    {
      title: string;
      subtitle: string;
      icon: React.ComponentType<{ className?: string }>;
      description: string;
      plannedFeatures: string[];
      tag: string;
    }
  > = {
    Factory: {
      title: 'Factory & Kitchen',
      subtitle: 'Central Kitchen Batching & Wireless Probe IoT',
      icon: Factory,
      description:
        'Industrial kitchen telemetry integration connecting blast chillers, steam tables, combi-ovens, and wireless Bluetooth/LoRa food core temperature sensors directly into batch clocks.',
      plannedFeatures: [
        'Automatic BLE & WiFi core probe telemetry streaming',
        'Cook-chill blast chiller cycle completion triggers',
        'High-volume kettle and combi-oven recipe integration',
        'Threshold alerts via SMS/WhatsApp for walk-in cold room excursions',
      ],
      tag: 'Kitchen Automation',
    },
    ESG: {
      title: 'ESG & Impact',
      subtitle: 'Greenhouse Gas & Waste Diversion Analytics',
      icon: Leaf,
      description:
        'Quantifies the environmental and social dividend of rescue interventions before food spoilage occurs, converting saved kilograms into CO2e avoided and meals served.',
      plannedFeatures: [
        'Real-time CO2 equivalent greenhouse gas avoidance metrics',
        'Water footprint conservation calculations per food category',
        'Standardized corporate ESG reporting exports (GRI & Scope 3)',
        'Social impact scorecards (meals saved, nutrient density preserved)',
      ],
      tag: 'Sustainability Metrics',
    },
  };

  const current = tabDetails[tabId];
  if (!current) return null;
  const Icon = current.icon;

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12">
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden p-6 sm:p-10 text-center relative">
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-32 bg-amber-100/50 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold mb-4 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
          <span>Coming next in AnnaChakra roadmap</span>
        </div>

        <div className="w-16 h-16 rounded-2xl bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Icon className="w-8 h-8 stroke-[1.8]" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          {current.title}
        </h2>
        <p className="text-sm sm:text-base font-semibold text-[#D97706] mt-1">
          {current.subtitle}
        </p>

        <p className="text-gray-600 max-w-xl mx-auto mt-4 text-sm sm:text-base leading-relaxed">
          {current.description}
        </p>

        <div className="mt-8 bg-gray-50/80 rounded-2xl p-5 sm:p-6 border border-gray-200 text-left max-w-xl mx-auto">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#0F5132]" />
            What is planned for this module
          </h4>
          <ul className="space-y-2.5 text-xs sm:text-sm text-gray-700">
            {current.plannedFeatures.map((feat, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#0F5132] shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={onGoToBatches}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0F5132] hover:bg-[#14663f] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
          >
            <span>Return to Batches tab</span>
            <ArrowRight className="w-4 h-4 text-amber-300" />
          </button>
        </div>

      </div>
    </div>
  );
};
