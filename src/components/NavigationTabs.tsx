import React from "react";
import { History, TrendingUp, Users, Radio, Shield, Package } from "lucide-react";

export type TabType = "matches" | "mmr" | "synergy" | "champions" | "builds" | "live";

interface NavigationTabsProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  matchesCount: number;
  isLiveActive: boolean;
  duosCount?: number;
  poolCount?: number;
  buildsCount?: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onSelectTab,
  matchesCount,
  isLiveActive,
  duosCount = 0,
  poolCount = 0,
  buildsCount = 0,
}) => {
  const tabs: {
    id: TabType;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    liveDot?: boolean;
  }[] = [
    {
      id: "matches",
      label: "Overview & Matches",
      icon: <History className="w-3.5 h-3.5" />,
      badge: matchesCount > 0 ? matchesCount : undefined,
    },
    {
      id: "mmr",
      label: "MMR Analytics",
      icon: <TrendingUp className="w-3.5 h-3.5" />,
    },
    {
      id: "synergy",
      label: "Duo Synergies",
      icon: <Users className="w-3.5 h-3.5" />,
      badge: duosCount > 0 ? duosCount : undefined,
    },
    {
      id: "champions",
      label: "Champion Pool",
      icon: <Shield className="w-3.5 h-3.5" />,
      badge: poolCount > 0 ? poolCount : undefined,
    },
    {
      id: "builds",
      label: "Build Matrix",
      icon: <Package className="w-3.5 h-3.5" />,
      badge: buildsCount > 0 ? buildsCount : undefined,
    },
    {
      id: "live",
      label: "Live Match Feed",
      icon: <Radio className="w-3.5 h-3.5" />,
      badge: isLiveActive ? "LIVE" : undefined,
      liveDot: isLiveActive,
    },
  ];

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-[#0e1117] px-2 sm:px-4 flex items-center gap-1 overflow-x-auto custom-scrollbar select-none">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono uppercase tracking-wider font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              isActive
                ? "border-riot-red text-neutral-900 dark:text-white bg-white dark:bg-[#151923]"
                : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/40"
            }`}
          >
            <span className={isActive ? "text-riot-red" : "text-neutral-400"}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>

            {tab.badge !== undefined && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-sm font-bold ${
                  tab.liveDot
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                    : isActive
                    ? "bg-riot-red/10 text-riot-red border border-riot-red/30"
                    : "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
