import React, { useEffect } from 'react';
import { Crown, Sparkles, Trophy, Zap, ChevronRight, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { RankInfo } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface RankUpModalProps {
  previousRank: RankInfo;
  newRank: RankInfo;
  score: number;
  onClose: () => void;
}

export const RankUpModal: React.FC<RankUpModalProps> = ({
  previousRank,
  newRank,
  score,
  onClose,
}) => {
  useEffect(() => {
    soundEngine.playRankUp();

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: [newRank.color, '#f59e0b', '#38bdf8', '#ec4899', '#ffffff'],
      });
    } catch {
      // safe fallback
    }
  }, [newRank]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
        {/* Glow backdrop */}
        <div
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: newRank.color }}
        />

        {/* Promotion Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-widest shadow-sm">
          <Sparkles className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>RANK PROMOTION</span>
        </div>

        {/* Header Title */}
        <h2 className="font-display text-3xl font-black text-white tracking-tight">
          RANK UP!
        </h2>

        {/* Rank Transition Row */}
        <div className="flex items-center justify-center gap-3 w-full py-2">
          {/* Previous Rank */}
          <div className="flex flex-col items-center opacity-60">
            <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">WAS</span>
            <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-display font-bold text-xs">
              {previousRank.name}
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />

          {/* New Rank Highlight */}
          <div className="flex flex-col items-center scale-110">
            <span className="text-[10px] text-amber-400 font-black uppercase mb-1">NEW RANK</span>
            <div
              className="px-4 py-2 rounded-2xl border font-display font-black text-sm shadow-lg flex items-center gap-1.5"
              style={{
                backgroundColor: `${newRank.color}22`,
                borderColor: newRank.color,
                color: newRank.color,
                boxShadow: `0 0 20px ${newRank.color}44`,
              }}
            >
              <Crown className="w-4 h-4 fill-current" />
              <span>{newRank.name}</span>
            </div>
          </div>
        </div>

        {/* Quote / Description */}
        <p className="text-xs text-slate-300 italic px-2">
          "{newRank.quote}"
        </p>

        {/* Score Qualification */}
        <div className="w-full p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">UNLOCKED AT SCORE:</span>
          <span className="font-display font-black text-white font-mono-numbers">
            {score} PTS (REQUIRED: {newRank.minScore}+)
          </span>
        </div>

        {/* Continue Button */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-display text-base font-black tracking-wide flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.5)] hover:brightness-110 active:scale-95 transition-all cursor-pointer mt-1"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>CONTINUE</span>
        </button>
      </div>
    </div>
  );
};
