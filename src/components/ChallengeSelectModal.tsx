import React from 'react';
import {
  Trophy,
  X,
  Lock,
  CheckCircle,
  Coins,
  Play,
  Target,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Challenge } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface ChallengeSelectModalProps {
  challenges: Challenge[];
  coins: number;
  onSelectChallenge: (challenge: Challenge) => void;
  onClose: () => void;
}

export const ChallengeSelectModal: React.FC<ChallengeSelectModalProps> = ({
  challenges,
  coins,
  onSelectChallenge,
  onClose,
}) => {
  const completedCount = challenges.filter((c) => c.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-white">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-black tracking-wide text-white">
                  CHALLENGES
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono-numbers font-bold">
                  {completedCount}/{challenges.length} DONE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Short fixed-goal missions with coin rewards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 font-mono-numbers font-bold text-xs">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{coins}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              aria-label="Close Challenges"
              className="w-9 h-9 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Challenge Cards List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {challenges.map((c) => {
            const isLocked = !c.unlocked;
            const isCompleted = c.completed;

            return (
              <div
                key={c.id}
                className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : isLocked
                    ? 'bg-slate-950/50 border-slate-800/80 opacity-60'
                    : 'bg-slate-900/90 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:border-cyan-400'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Badge and Title */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-display text-sm font-black text-white tracking-wide">
                        {c.subtitle || `[0${c.id}] ${c.title}`}
                      </span>

                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          COMPLETED
                        </span>
                      ) : isLocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold">
                          <Lock className="w-3 h-3 text-slate-500" />
                          LOCKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold animate-pulse">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          READY
                        </span>
                      )}
                    </div>

                    {/* Goal Description */}
                    <p className="text-xs text-slate-300 font-medium">
                      {c.description}
                    </p>

                    {/* Reward Pill */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-mono-numbers font-black shadow-sm">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>+{c.rewardCoins} COINS</span>
                      </div>
                    </div>
                  </div>

                  {/* Play / Status Action Button */}
                  <div className="shrink-0 flex items-center">
                    {isLocked ? (
                      <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          onSelectChallenge(c);
                        }}
                        className={`h-10 px-4 rounded-2xl font-display text-xs font-black tracking-wide flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md ${
                          isCompleted
                            ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 hover:brightness-110 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current stroke-[2]" />
                        <span>{isCompleted ? 'REPLAY' : 'PLAY'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info note */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Complete challenges to unlock subsequent tiers!</span>
          </span>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
