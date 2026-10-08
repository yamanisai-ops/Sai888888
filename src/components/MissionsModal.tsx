import React from 'react';
import { ArrowLeft, Check, Coins, Target, Sparkles } from 'lucide-react';
import { Mission } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface MissionsModalProps {
  missions: Mission[];
  coins: number;
  onClaimMission: (id: string) => void;
  onClose: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  missions,
  coins,
  onClaimMission,
  onClose,
}) => {
  const handleClaim = (missionId: string) => {
    soundEngine.playClaimReward();
    onClaimMission(missionId);
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-slate-950/98 backdrop-blur-xl text-white select-none overflow-hidden animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-900/60">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>BACK</span>
        </button>

        <div className="font-display text-xl font-black tracking-tight text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-400" />
          <span>MISSIONS</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 font-mono-numbers font-black text-sm">
          <Coins className="w-4 h-4 text-amber-400" />
          <span>{coins}</span>
        </div>
      </div>

      {/* Main Missions List */}
      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full pb-8 flex flex-col gap-3">
        <div className="text-xs text-slate-400 mb-1">
          Complete objectives during runs to earn bonus coins for the shop!
        </div>

        {missions.map((mission) => {
          const percent = Math.min(100, Math.round((mission.progress / mission.targetValue) * 100));

          return (
            <div
              key={mission.id}
              className={`p-4 rounded-3xl border transition-all ${
                mission.completed && !mission.claimed
                  ? 'border-amber-400/80 bg-amber-950/20 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  : mission.claimed
                  ? 'border-slate-800/80 bg-slate-900/40 opacity-70'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-display text-base font-black text-white">
                    {mission.title}
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    {mission.description}
                  </div>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono-numbers font-bold text-xs shrink-0">
                  <Coins className="w-3.5 h-3.5" />
                  <span>+{mission.rewardCoins}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1 font-mono-numbers">
                  <span>PROGRESS</span>
                  <span>
                    {mission.progress} / {mission.targetValue}
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      mission.completed
                        ? 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-3">
                {mission.claimed ? (
                  <div className="w-full py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>CLAIMED</span>
                  </div>
                ) : mission.completed ? (
                  <button
                    type="button"
                    onClick={() => handleClaim(mission.id)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.5)] cursor-pointer active:scale-95 transition-transform"
                  >
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>CLAIM +{mission.rewardCoins} COINS</span>
                  </button>
                ) : (
                  <div className="w-full py-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-slate-400 text-xs font-semibold text-center font-mono-numbers">
                    IN PROGRESS ({percent}%)
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
