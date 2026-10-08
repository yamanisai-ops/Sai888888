import React, { useState } from 'react';
import { Flame, Check, Coins, Sparkles, X, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import { STREAK_REWARDS, claimDailyStreakReward, getDailyStreak } from '../utils/storage';
import { soundEngine } from '../audio/soundEngine';

interface DailyStreakModalProps {
  onClose: () => void;
  onRewardClaimed: (coinsEarned: number) => void;
}

export const DailyStreakModal: React.FC<DailyStreakModalProps> = ({
  onClose,
  onRewardClaimed,
}) => {
  const [streakData, setStreakData] = useState(() => getDailyStreak());
  const [justClaimed, setJustClaimed] = useState(false);

  const handleClaim = () => {
    soundEngine.playPurchase();
    const result = claimDailyStreakReward();
    if (result.success) {
      setStreakData(getDailyStreak());
      setJustClaimed(true);
      onRewardClaimed(result.coinsAwarded);

      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#f97316', '#38bdf8', '#ec4899'],
        });
      } catch {
        // safe fallback
      }
    }
  };

  const days = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl flex flex-col items-center gap-3.5 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="w-13 h-13 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.3)]">
          <Flame className="w-7 h-7 fill-current" />
        </div>

        <div>
          <h3 className="font-display text-2xl font-black text-white tracking-tight">
            DAILY STREAK
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Play every day to build your consecutive streak and unlock the Day 7 Jackpot!
          </p>
        </div>

        {/* Current Streak Indicator */}
        <div className="px-4 py-1.5 rounded-full bg-orange-950/60 border border-orange-500/40 text-orange-300 font-display font-black text-xs flex items-center gap-2">
          <Flame className="w-4 h-4 fill-orange-400" />
          <span>CURRENT STREAK: {streakData.currentStreak} DAYS</span>
        </div>

        {/* 7 Days Grid */}
        <div className="grid grid-cols-4 gap-2 w-full mt-1">
          {days.slice(0, 4).map((day) => {
            const isCompleted = streakData.currentStreak >= day && (streakData.claimedToday || streakData.currentStreak > day);
            const isToday = !streakData.claimedToday && streakData.currentStreak + 1 === day;
            const reward = STREAK_REWARDS[day];

            return (
              <div
                key={day}
                className={`p-2 rounded-2xl border flex flex-col items-center justify-between text-center transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : isToday
                    ? 'bg-amber-950/60 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.3)] text-amber-300 scale-105'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500'
                }`}
              >
                <span className="text-[10px] font-bold uppercase">DAY {day}</span>
                <Coins className="w-4 h-4 my-1 text-amber-400" />
                <span className="text-xs font-mono-numbers font-black">+{reward}</span>
              </div>
            );
          })}
        </div>

        {/* Days 5, 6, and 7 */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {days.slice(4).map((day) => {
            const isCompleted = streakData.currentStreak >= day && (streakData.claimedToday || streakData.currentStreak > day);
            const isToday = !streakData.claimedToday && streakData.currentStreak + 1 === day;
            const isJackpot = day === 7;
            const reward = STREAK_REWARDS[day];

            return (
              <div
                key={day}
                className={`p-2.5 rounded-2xl border flex flex-col items-center justify-between text-center transition-all ${
                  isJackpot
                    ? isCompleted
                      ? 'bg-amber-950/60 border-amber-400 text-amber-300'
                      : isToday
                      ? 'bg-gradient-to-b from-amber-900/60 to-yellow-950/80 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] text-yellow-300 scale-105'
                      : 'bg-slate-950/80 border-amber-500/30 text-amber-400/60'
                    : isCompleted
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : isToday
                    ? 'bg-amber-950/60 border-amber-500/60 text-amber-300 scale-105'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase">
                  {isJackpot && <Sparkles className="w-3 h-3 text-amber-400" />}
                  <span>{isJackpot ? 'JACKPOT' : `DAY ${day}`}</span>
                </div>
                <Coins className="w-5 h-5 my-1 text-amber-400" />
                <span className="text-xs font-mono-numbers font-black">+{reward}</span>
              </div>
            );
          })}
        </div>

        {/* Claim or Status Button */}
        {streakData.claimedToday ? (
          <div className="w-full h-12 rounded-2xl bg-slate-800/80 border border-slate-700 text-emerald-400 font-display font-black text-sm flex items-center justify-center gap-2">
            <Check className="w-5 h-5" />
            <span>CLAIMED FOR TODAY! (RETURN TOMORROW)</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleClaim}
            className="w-full h-13 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 text-slate-950 font-display text-base font-black flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(249,115,22,0.5)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Gift className="w-5 h-5 stroke-[2.5]" />
            <span>CLAIM TODAY'S REWARD (+{STREAK_REWARDS[streakData.currentStreak + 1 || 1]} 🪙)</span>
          </button>
        )}
      </div>
    </div>
  );
};
