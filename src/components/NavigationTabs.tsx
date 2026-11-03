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
    livePulse?: boolean;
  }[] = [
    {
      id: "matches",
      label: "Matches & Overview",
      icon: <History className="w-4 h-4" />,
      badge: matchesCount > 0 ? matchesCount : undefined,
    },
    {
      id: "mmr",
      label: "Ranked MMR Trend",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: "synergy",
      label: "Duo & Synergy",
      icon: <Users className="w-4 h-4" />,
      badge: duosCount > 0 ? `${duosCount} duos` : undefined,
    },
    {
      id: "champions",
      label: "Champion Pool",
      icon: <Shield className="w-4 h-4" />,
      badge: poolCount > 0 ? poolCount : undefined,
    },
    {
      id: "builds",
      label: "Build & Item Planner",
      icon: <Package className="w-4 h-4" />,
      badge: buildsCount > 0 ? `${buildsCount} builds` : undefined,
    },
    {
      id: "live",
      label: "Live Client",
      icon: <Radio className="w-4 h-4" />,
      badge: isLiveActive ? "IN GAME" : undefined,
      livePulse: isLiveActive,
    },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1.5 bg-riot-card/90 border border-riot-border/80 rounded-2xl shadow-lg backdrop-blur-md overflow-x-auto custom-scrollbar select-none">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              isActive
                ? "bg-gradient-to-r from-pink-500/25 to-indigo-500/25 text-slate-100 border border-pink-500/40 shadow-neon-pink"
                : "text-slate-400 hover:text-slate-200 hover:bg-riot-surface/50"
            }`}
          >
            <span className={isActive ? "text-pink-400" : "text-slate-400"}>{tab.icon}</span>
            <span>{tab.label}</span>

            {tab.badge !== undefined && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  tab.livePulse
                    ? "bg-emerald-500/20 text-neon-win border border-emerald-500/40 animate-pulse"
                    : isActive
                    ? "bg-pink-500/30 text-pink-200 border border-pink-500/50"
                    : "bg-riot-darkest text-slate-400 border border-riot-border"
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
