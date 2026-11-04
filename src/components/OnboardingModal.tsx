import React from "react";
import { Video, ShieldCheck, Zap, Check } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onSelectPolicy: (enableVod: boolean) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onSelectPolicy,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in font-mono text-xs">
      <div className="bg-white dark:bg-[#0c0e14] border border-neutral-300 dark:border-neutral-700 w-full max-w-lg rounded shadow-2xl overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-800">
        {/* Header */}
        <div className="p-4 bg-neutral-50 dark:bg-[#11141c] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-riot-red/15 border border-riot-red/40 flex items-center justify-center text-riot-red">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                Setup Game Detection & VOD Policy
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Choose your background recording & match tracking preferences
              </p>
            </div>
          </div>
        </div>

        {/* Content & Policy Explanation */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
            League Stat Tracker can automatically detect whenever you enter an active game (Practice Tool, Normals, Ranked, or ARAM) and track your match live.
          </p>

          {/* Feature Highlight Cards */}
          <div className="space-y-2.5">
            <div className="p-3 rounded-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#121520] flex items-start gap-3">
              <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-neutral-900 dark:text-neutral-100 text-xs">
                  Automated Match Detection (No Manual Search)
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  The app silently listens for League of Legends in the background so you never have to manually search or activate tracking.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#121520] flex items-start gap-3">
              <Video className="w-4 h-4 text-riot-red shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-neutral-900 dark:text-neutral-100 text-xs">
                  Automated VOD Recording & Review Player
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Unlocks the full video review studio with playback speed controls, timestamp bookmark notes, and one-click Riot 3D replays.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#121520] flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-neutral-900 dark:text-neutral-100 text-xs">
                  Ultra-Lightweight (~2.5 Mbps Performance Mode)
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Hardware-accelerated encoding maintains 100% of your in-game FPS and saves directly to <code className="text-neutral-700 dark:text-neutral-300">Videos/LeagueStatTracker/</code>.
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-neutral-400 italic">
            * You can toggle this policy on or off at any time in the Settings menu.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-neutral-50 dark:bg-[#11141c] flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => onSelectPolicy(false)}
            className="w-full sm:w-auto px-4 py-2 rounded-sm border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 text-xs font-bold uppercase transition-all cursor-pointer"
          >
            Keep Disabled (Stats Only)
          </button>

          <button
            type="button"
            onClick={() => onSelectPolicy(true)}
            className="w-full sm:w-auto px-5 py-2 rounded-sm bg-riot-red hover:bg-riot-redHover text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Enable Auto-Recording & Tracking</span>
          </button>
        </div>
      </div>
    </div>
  );
};
