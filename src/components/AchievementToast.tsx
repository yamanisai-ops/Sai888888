import React from 'react';
import { Trophy, Zap, Flame, ShieldCheck, Footprints, AlertTriangle, Sparkles, Swords, Crown } from 'lucide-react';
import { Achievement } from '../types/game';

interface AchievementToastProps {
  achievement: Achievement | null;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ achievement }) => {
  if (!achievement) return null;

  const renderIcon = () => {
    switch (achievement.id) {
      case 'first_step':
        return <Footprints className="w-5 h-5 text-amber-400" />;
      case 'fast_hands':
        return <Zap className="w-5 h-5 text-cyan-400" />;
      case 'combo_master':
        return <Flame className="w-5 h-5 text-rose-400" />;
      case 'survivor':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'speed_demon':
        return <Trophy className="w-5 h-5 text-amber-300" />;
      case 'close_call':
        return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case 'power_player':
        return <Sparkles className="w-5 h-5 text-yellow-400" />;
      case 'boss_hunter':
        return <Swords className="w-5 h-5 text-rose-500" />;
      case 'untouchable':
        return <Flame className="w-5 h-5 text-purple-400" />;
      case 'legend':
        return <Crown className="w-5 h-5 text-amber-400" />;
      default:
        return <Trophy className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xs pointer-events-none animate-in slide-in-from-top-4 duration-300">
      <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900/95 border border-amber-400/70 shadow-lg backdrop-blur-md flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
          {renderIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[8.5px] font-extrabold uppercase tracking-widest text-amber-400 font-mono-numbers">
            ★ UNLOCKED ★
          </div>
          <div className="text-xs font-bold text-white truncate font-display">
            {achievement.title}
          </div>
          <div className="text-[9.5px] text-slate-300 truncate">
            {achievement.description}
          </div>
        </div>
      </div>
    </div>
  );
};
