import React from 'react';
import { ArrowLeft, Calendar, Check, Coins, Play, Trophy, Sparkles } from 'lucide-react';
import { DailyChallenge } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface DailyChallengeModalProps {
  challenge: DailyChallenge;
  onClaimReward: () => void;
  onStartPlaying: () => void;
  onClose: () => void;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  challenge,
  onClaimReward,
  onStartPlaying,
  onClose,
}) => {
  const percent = Math.min(100, Math.round((challenge.progress / challenge.targetValue) * 100));

  const handleClaim = () => {
    soundEngine.playClaimReward();
    onClaimReward();
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-between p-4 sm:p-6 bg-slate-950/98 backdrop-blur-xl text-white select-none overflow-y-auto animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="w-full max-w-md flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>BACK</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs font-mono-numbers text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>{challenge.dateKey}</span>
        </div>
      </div>

      {/* Main Challenge Card */}
      <div className="w-full max-w-md my-auto py-4 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4 shadow-[0_0_25px_rgba(245,158,11,0.3)]">
          <Trophy className="w-7 h-7" />
        </div>

        <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400 font-mono-numbers">
          TODAY'S CHALLENGE
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-black text-white mt-1">
          {challenge.title}
        </h2>
        <p className="text-sm text-slate-300 mt-1 max-w-xs">
          {challenge.description}
        </p>

        {/* Progress Container */}
        <div className="w-full p-5 rounded-3xl bg-slate-900/90 border border-slate-800 mt-6 text-left">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-slate-400 uppercase tracking-wider">PROGRESS</span>
            <span className="font-mono-numbers text-white">
              {challenge.progress} / {challenge.targetValue} ({percent}%)
            </span>
          </div>

          <div className="w-full h-3 bg-slate-950 rounded-full p-0.5 border border-slate-800 overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                challenge.completed
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                  : 'bg-gradient-to-r from-amber-400 to-orange-500'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>

          {/* Reward Box */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-300">DAILY REWARD</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono-numbers font-black text-amber-300 text-sm">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>+{challenge.rewardCoins} COINS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md pb-4 flex flex-col gap-3">
        {challenge.completed ? (
          challenge.claimed ? (
            <div className="w-full h-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 font-display text-base font-bold flex items-center justify-center gap-2">
              <Check className="w-5 h-5 text-emerald-400" />
              <span>CLAIMED · COME BACK TOMORROW</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleClaim}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-display text-xl font-black flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(245,158,11,0.6)] cursor-pointer active:scale-95"
            >
              <Coins className="w-6 h-6 fill-slate-950" />
              <span>CLAIM +{challenge.rewardCoins} COINS</span>
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onStartPlaying();
            }}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-display text-xl font-black flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(6,182,212,0.5)] cursor-pointer active:scale-95"
          >
            <Play className="w-6 h-6 fill-slate-950" />
            <span>PLAY CHALLENGE NOW</span>
          </button>
        )}
      </div>
    </div>
  );
};
