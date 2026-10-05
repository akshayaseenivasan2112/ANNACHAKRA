import React from 'react';
import {
  Home,
  Calendar,
  Boxes,
  Handshake,
  FileCheck2,
  Fingerprint,
  Factory,
  Leaf,
  FileText,
} from 'lucide-react';

export type TabId =
  | 'Home'
  | 'Plan'
  | 'Batches'
  | 'Match'
  | 'Handover'
  | 'Trust Log'
  | 'Factory'
  | 'Impact'
  | 'README';

interface TabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  batchCount: number;
  activeHandoverCount?: number;
  factoryAnomalyCount?: number;
}

export const Tabs: React.FC<TabsProps> = ({
  activeTab,
  onTabChange,
  batchCount,
  activeHandoverCount = 0,
  factoryAnomalyCount = 5,
}) => {
  const tabs: Array<{
    id: TabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    sublabel?: string;
    badgeColor?: string;
  }> = [
    {
      id: 'Home',
      label: 'Home',
      icon: Home,
      sublabel: 'Overview & Demo',
    },
    {
      id: 'Plan',
      label: 'Plan',
      icon: Calendar,
      sublabel: 'Predict Demand',
    },
    {
      id: 'Batches',
      label: 'Batches',
      icon: Boxes,
      badge: batchCount > 0 ? batchCount : undefined,
      sublabel: 'Track & Clocks',
    },
    {
      id: 'Match',
      label: 'Match',
      icon: Handshake,
      sublabel: 'Cascade Route',
    },
    {
      id: 'Handover',
      label: 'Handover',
      icon: FileCheck2,
      badge: activeHandoverCount > 0 ? activeHandoverCount : undefined,
      sublabel: 'Desk Proof',
    },
    {
      id: 'Trust Log',
      label: 'Trust Log',
      icon: Fingerprint,
      sublabel: 'Prove: Ledger',
    },
    {
      id: 'Factory',
      label: 'Factory',
      icon: Factory,
      badge: factoryAnomalyCount > 0 ? factoryAnomalyCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
      sublabel: 'Learn: Telemetry',
    },
    {
      id: 'Impact',
      label: 'Impact',
      icon: Leaf,
      sublabel: 'BRSR ESG',
    },
    {
      id: 'README',
      label: 'README',
      icon: FileText,
      sublabel: 'SIH Specs',
    },
  ];

  return (
    <div className="bg-white border-b border-gray-200/90 shadow-2xs sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav
          className="flex space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar py-2"
          aria-label="Tabs"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`group relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#0F5132] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-amber-300 scale-105' : 'text-gray-400 group-hover:text-gray-700'
                  }`}
                />

                <div className="flex flex-col items-start leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-extrabold">{tab.label}</span>

                    {tab.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-black font-mono leading-none ${
                          tab.badgeColor
                            ? tab.badgeColor
                            : isActive
                            ? 'bg-amber-400 text-gray-950'
                            : 'bg-gray-200 text-gray-700 group-hover:bg-gray-300'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </div>

                  {tab.sublabel && (
                    <span
                      className={`text-[9px] font-medium hidden lg:inline truncate max-w-[110px] ${
                        isActive ? 'text-emerald-100/90' : 'text-gray-400'
                      }`}
                    >
                      {tab.sublabel}
                    </span>
                  )}
                </div>

                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-amber-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
