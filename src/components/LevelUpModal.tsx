import React, { useEffect } from 'react';
import { Sparkles, Coins, ArrowUpCircle, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../audio/soundEngine';

interface LevelUpModalProps {
  level: number;
  coinReward: number;
  unlockedTitle?: string | null;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  level,
  coinReward,
  unlockedTitle = null,
  onClose,
}) => {
  useEffect(() => {
    soundEngine.playLevelUp?.();

    try {
      confetti({
        particleCount: 70,
        spread: 75,
        origin: { y: 0.5 },
        colors: ['#38bdf8', '#fbbf24', '#a855f7', '#10b981'],
      });
    } catch {
      // safe fallback
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-xs p-6 rounded-3xl bg-slate-900 border-2 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.45)] text-center flex flex-col items-center gap-3 animate-in zoom-in-95 duration-200">
        {/* Glowing Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 flex items-center justify-center shadow-[0_0_24px_rgba(6,182,212,0.6)]">
          <ArrowUpCircle className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 font-mono-numbers">
            ★ PROMOTION ACHIEVED ★
          </span>
          <h2 className="font-display text-3xl font-black text-white tracking-tight mt-0.5">
            LEVEL {level}!
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            You reached Level {level}! Keep reacting under one second to rise higher.
          </p>
        </div>

        {/* Level Reward Pill */}
        {coinReward > 0 && (
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-950/70 border border-amber-400/80 text-amber-300 font-mono-numbers font-black text-sm flex items-center gap-2 shadow-sm">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>+{coinReward} BONUS COINS</span>
          </div>
        )}

        {/* Unlocked Title Pill if applicable */}
        {unlockedTitle && (
          <div className="w-full px-3 py-1.5 rounded-xl bg-purple-950/70 border border-purple-400/70 text-purple-200 text-xs flex items-center justify-center gap-1.5 font-display font-black tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>NEW TITLE: {unlockedTitle}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="w-full h-11 mt-1 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 font-display text-base font-black tracking-wide flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>AWESOME</span>
        </button>
      </div>
    </div>
  );
};
