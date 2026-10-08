import React, { useEffect, useState } from 'react';
import {
  RotateCcw,
  Trophy,
  Flame,
  Timer,
  Zap,
  Share2,
  Home,
  Coins,
  Shield,
  Sparkles,
  Infinity,
  CheckCircle,
  ArrowUpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameMode, ScoreBreakdown } from '../types/game';
import { soundEngine } from '../audio/soundEngine';
import { getRankForScore, getRankProgress } from '../utils/ranks';

interface GameOverScreenProps {
  score: number;
  bestScore: number;
  maxCombo: number;
  bestCombo: number;
  coinsEarned: number;
  totalCoins: number;
  fastestReactionMs: number;
  bestReactionTimeMs: number;
  averageReactionMs: number;
  totalCleared: number;
  perfectCount?: number;
  powerUpsCollected?: number;
  nearMisses?: number;
  bossesDefeated?: number;
  survivalTimeSec?: number;
  mode?: GameMode;
  scoreBreakdown?: ScoreBreakdown;
  unlockedAchievements: string[];
  isNewRecord: boolean;
  xpEarned?: number;
  playerLevel?: number;
  playerXp?: number;
  playerXpNext?: number;
  hasLeveledUp?: boolean;
  beatGhost?: boolean;
  isCrushed?: boolean;
  ghostTargetScore?: number;
  ghostCoinBonus?: number;
  ghostXpBonus?: number;
  onShowLevelUp?: () => void;
  onPlayAgain: () => void;
  onHome: () => void;
  onOpenLeaderboard: () => void;
  onOpenShare: (shareText: string) => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  bestScore,
  maxCombo,
  coinsEarned,
  totalCoins,
  fastestReactionMs,
  bestReactionTimeMs,
  perfectCount = 0,
  powerUpsCollected = 0,
  nearMisses = 0,
  bossesDefeated = 0,
  survivalTimeSec = 0,
  mode = 'CLASSIC',
  scoreBreakdown,
  isNewRecord,
  xpEarned = 0,
  playerLevel = 1,
  playerXp = 0,
  playerXpNext = 100,
  hasLeveledUp = false,
  beatGhost = false,
  isCrushed = false,
  ghostTargetScore,
  ghostCoinBonus = 25,
  ghostXpBonus = 50,
  onShowLevelUp,
  onPlayAgain,
  onHome,
  onOpenLeaderboard,
  onOpenShare,
}) => {
  const currentRank = getRankForScore(bestScore);
  const [displayScore, setDisplayScore] = useState<number>(0);
  const [displayCoins, setDisplayCoins] = useState<number>(0);
  const [displayXp, setDisplayXp] = useState<number>(0);
  const [isScoreDone, setIsScoreDone] = useState<boolean>(false);
  const [isRewardDone, setIsRewardDone] = useState<boolean>(false);

  useEffect(() => {
    soundEngine.playGameOver();

    // Smooth arcade score count-up animation with snappy easing
    const startTime = performance.now();
    const duration = 650;
    let animId: number;

    const animateCount = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // easeOutQuart curve for crisp arcade snap
      const ease = 1 - Math.pow(1 - progress, 4);

      setDisplayScore(Math.round(ease * score));
      setDisplayCoins(Math.round(ease * coinsEarned));
      setDisplayXp(Math.round(ease * xpEarned));

      if (progress < 1) {
        animId = requestAnimationFrame(animateCount);
      } else {
        setDisplayScore(score);
        setDisplayCoins(coinsEarned);
        setDisplayXp(xpEarned);
        setIsScoreDone(true);
        setTimeout(() => setIsRewardDone(true), 150);
      }
    };

    animId = requestAnimationFrame(animateCount);

    if ((isNewRecord || (mode === 'GHOST' && beatGhost)) && score > 0) {
      try {
        confetti({
          particleCount: 55,
          spread: 65,
          origin: { y: 0.55 },
          colors: ['#a855f7', '#38bdf8', '#f59e0b', '#ec4899', '#10b981'],
        });
      } catch {
        // Fallback if confetti fails
      }
    }

    return () => cancelAnimationFrame(animId);
  }, [isNewRecord, score, coinsEarned, xpEarned, mode, beatGhost]);

  const handleShare = async () => {
    soundEngine.playClick();
    const shareText = `⚡ I scored ${score} in ONE SECOND!
Rank: ${currentRank.name} · Mode: ${mode === 'ENDLESS' ? 'Endless' : 'Classic'}
Max Combo: ${maxCombo}x · Best Reaction: ${bestReactionTimeMs > 0 ? bestReactionTimeMs : fastestReactionMs}ms
Can you beat me?`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'ONE SECOND - Reflex Arcade',
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to share modal
      }
    }

    onOpenShare(shareText);
  };

  const formatSurvivalTime = (sec: number) => {
    if (!sec || sec <= 0) return '0s';
    const mins = Math.floor(sec / 60);
    const remainder = Math.floor(sec % 60);
    return mins > 0 ? `${mins}m ${remainder}s` : `${remainder}s`;
  };

  // Safe breakdown fallback calculations
  const baseScore = scoreBreakdown?.baseScore ?? score;
  const perfectBonus = scoreBreakdown?.perfectBonus ?? 0;
  const comboBonus = scoreBreakdown?.comboBonus ?? Math.max(0, Math.floor(maxCombo * 1.5));
  const feverBonus = scoreBreakdown?.feverBonus ?? 0;

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-2 sm:p-4 bg-slate-950/95 backdrop-blur-md text-white select-none overflow-y-auto no-scrollbar animate-in fade-in duration-200">
      {/* Top Banner (Compact on mobile) */}
      <div className="w-full max-w-md text-center pt-0.5">
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-[9px] sm:text-[10px] uppercase font-extrabold tracking-widest text-rose-500 font-mono-numbers">
            ALL 3 LIVES LOST
          </span>
          <span className="text-slate-600">·</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[8.5px] sm:text-[9.5px] font-mono-numbers text-cyan-300 font-bold uppercase flex items-center gap-1">
            {mode === 'ENDLESS' ? <Infinity className="w-2.5 h-2.5 text-purple-400" /> : null}
            <span>{mode} MODE</span>
          </span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
          GAME OVER
        </h2>
      </div>

      {/* Main Center Content */}
      <div className="w-full max-w-md my-auto py-1 flex flex-col items-center gap-1.5 sm:gap-2">
        {/* Primary Score & Rank Card */}
        <div
          className={`relative w-full p-2.5 sm:p-3.5 rounded-2xl bg-slate-900/90 border text-center shadow-lg transition-all duration-300 ${
            isNewRecord ? 'border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.2)]' : 'border-slate-800'
          }`}
        >
          {isNewRecord && score > 0 && (
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 text-[9px] font-black tracking-wider uppercase shadow-md">
              ★ NEW RECORD! ★
            </div>
          )}

          <div className="text-[8.5px] uppercase font-bold tracking-widest text-slate-400">
            FINAL SCORE
          </div>
          {/* Animated Count-Up Score with Snap Finish */}
          <div
            className={`font-display text-4xl sm:text-5xl font-black tracking-tight text-white font-mono-numbers drop-shadow-[0_0_16px_rgba(56,189,248,0.35)] transition-transform duration-200 ${
              isScoreDone ? 'scale-100' : 'scale-[0.98]'
            }`}
          >
            {displayScore}
          </div>

          {/* Current Rank Badge */}
          <div className="mt-0.5 flex items-center justify-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400">RANK:</span>
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-black font-display tracking-wider border shadow-sm"
              style={{
                backgroundColor: `${currentRank.color}22`,
                borderColor: currentRank.color,
                color: currentRank.color,
              }}
            >
              {currentRank.name}
            </span>
          </div>

          {/* Coins & XP Earned Strip with Reward Bounce Animation */}
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border font-mono-numbers font-black text-[11px] sm:text-xs transition-all duration-300 ${
                isRewardDone
                  ? 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)] scale-105'
                  : 'bg-amber-950/50 border-amber-500/40 text-amber-300 scale-100'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>+{displayCoins} EARNED</span>
            </div>

            {/* XP REWARD (Requirement 1 & 10) */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border font-mono-numbers font-black text-[11px] sm:text-xs transition-all duration-300 ${
                isRewardDone
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)] scale-105'
                  : 'bg-cyan-950/50 border-cyan-500/40 text-cyan-300 scale-100'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>+{displayXp} XP</span>
            </div>

            <div className="text-[10px] text-slate-400 font-mono-numbers flex items-center gap-1">
              <span>VAULT:</span>
              <span className="text-amber-300 font-bold">{totalCoins} 🪙</span>
            </div>
          </div>

          {/* Player Level & XP Progress (Requirement 2: LEVEL 1, XP 45 / 100) */}
          <div className="mt-2 w-full pt-2 border-t border-slate-800/80 flex flex-col gap-1 px-1">
            <div className="flex items-center justify-between text-[10px] font-mono-numbers">
              <span className="font-display font-black text-cyan-300 tracking-wide">
                LEVEL {playerLevel}
              </span>
              <span className="text-slate-400 font-bold">
                XP {playerXp} / {playerXpNext}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, Math.round((playerXp / Math.max(1, playerXpNext)) * 100)))}%`,
                }}
              />
            </div>

            {/* Level Up Action Prompt */}
            {hasLeveledUp && onShowLevelUp && (
              <button
                type="button"
                onClick={onShowLevelUp}
                className="mt-1 px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-display font-black text-[11px] flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-pulse hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                <ArrowUpCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>LEVEL UP ACHIEVED! VIEW REWARD</span>
              </button>
            )}
          </div>
        </div>

        {/* Ghost Mode Results Card (Requirement 4: BEAT THE GHOST) */}
        {mode === 'GHOST' && (
          <div
            className={`w-full p-2.5 sm:p-3 rounded-2xl border text-center shadow-lg transition-all animate-in zoom-in-95 duration-200 ${
              beatGhost
                ? 'bg-purple-950/85 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.35)]'
                : 'bg-slate-900/90 border-purple-900/50'
            }`}
          >
            {beatGhost ? (
              <>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-xl">👻</span>
                  <span className="font-display font-black text-sm sm:text-base text-purple-200 tracking-wide uppercase">
                    👻 GHOST DEFEATED!
                  </span>
                  <span className="text-xl">👻</span>
                </div>
                {isCrushed && (
                  <div className="font-display font-black text-[11px] text-amber-300 tracking-wider uppercase mt-0.5 animate-pulse">
                    ⚡ CRUSHED IT! ⚡
                  </div>
                )}
                <div className="flex items-center justify-center gap-3 mt-1 text-xs font-mono-numbers font-bold">
                  <span className="text-amber-300">+{ghostCoinBonus ?? 25} 🪙 Coins</span>
                  <span className="text-cyan-300">+{ghostXpBonus ?? 50} XP</span>
                </div>
                {ghostTargetScore !== undefined && (
                  <div className="text-[10px] text-purple-300/80 mt-1 font-mono-numbers">
                    Final Score: {score} · Ghost: {ghostTargetScore} (+{Math.max(0, score - ghostTargetScore)} pts lead)
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-1.5 text-purple-300 text-xs font-bold font-display">
                  <span>👻</span>
                  <span>GHOST TARGET: {ghostTargetScore ?? '—'} PTS</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  {(ghostTargetScore ?? 0) > score
                    ? `Ghost was ahead by ${(ghostTargetScore ?? 0) - score} points. Try again!`
                    : `Tied with Ghost! Score 1 more point to defeat it!`}
                </div>
              </>
            )}
          </div>
        )}

        {/* SESSION SUMMARY (8 Metrics in clean 4x2 Grid for Mobile Viewports) */}
        <div className="w-full p-2 sm:p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between px-0.5">
            <span>SESSION SUMMARY</span>
            {isNewRecord && (
              <span className="text-amber-400 text-[8.5px] font-mono-numbers font-black">
                NEW RECORD!
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-1 sm:gap-1.5 text-center">
            {/* 1. FINAL SCORE */}
            <div className="p-1 sm:p-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col items-center">
              <span className="text-[7px] sm:text-[7.5px] uppercase font-bold text-slate-400 tracking-tight leading-tight truncate w-full">FINAL</span>
              <span className="font-display text-xs sm:text-sm font-black text-cyan-300 font-mono-numbers mt-0.5">{score}</span>
            </div>

            {/* 2. BEST SCORE */}
            <div className="p-1 sm:p-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col items-center">
              <span className="text-[7px] sm:text-[7.5px] uppercase font-bold text-amber-400 tracking-tight leading-tight truncate w-full">BEST</span>
              <span className="font-display text-xs sm:text-sm font-black text-white font-mono-numbers mt-0.5">{bestScore}</span>
            </div>

            {/* 3. MAX COMBO */}
            <div className="p-1 sm:p-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col items-center">
              <span className="text-[7px] sm:text-[7.5px] uppercase font-bold text-rose-400 tracking-tight leading-tight truncate w-full">COMBO</span>
              <span className="font-display text-xs sm:text-sm font-black text-white font-mono-numbers mt-0.5">{maxCombo}x</span>
            </div>

            {/* 4. BEST REACTION */}
            <div className="p-1 sm:p-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col items-center">
              <span className="text-[7px] sm:text-[7.5px] uppercase font-bold text-emerald-400 tracking-tight leading-tight truncate w-full">REACTION</span>
              <span className="font-display text-xs sm:text-sm font-black text-emerald-300 font-mono-numbers mt-0.5">
                {bestReactionTimeMs > 0 ? `${bestReactionTimeMs}ms` : fastestReactionMs > 0 ? `${fastestReactionMs}ms` : '—'}
              </span>
            </div>

            {/* 5. PERFECT REACTIONS */}
            <div className="p-1 sm:p-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col items-center">
              <span className="text-[7px] sm:text-[7.5px] uppercase font-bold text-yellow-400 tracking-tight leading-tight truncate w-full">PERFECT</span>
              <span className="font-display text-xs sm:text-sm font-black text-amber-400 font-mono-numbers mt-0.5">{perfectCount}</span>
            </div>

            {/* 6. NEAR MISSES */}
            <div className="p-1 sm:p-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col items-center">
              <span className="text-[7px] sm:text-[7.5px] uppercase font-bold text-orange-400 tracking-tight leading-tight truncate w-full">NEAR MISS</span>
              <span className="font-display text-xs sm:text-sm font-black text-orange-400 font-mono-numbers mt-0.5">{nearMisses}</span>
            </div>

            {/* 7. POWER-UPS USED */}
            <div className="p-1 sm:p-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col items-center">
              <span className="text-[7px] sm:text-[7.5px] uppercase font-bold text-emerald-400 tracking-tight leading-tight truncate w-full">POWER-UPS</span>
              <span className="font-display text-xs sm:text-sm font-black text-emerald-400 font-mono-numbers mt-0.5">{powerUpsCollected}</span>
            </div>

            {/* 8. SURVIVAL TIME */}
            <div className="p-1 sm:p-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col items-center">
              <span className="text-[7px] sm:text-[7.5px] uppercase font-bold text-purple-300 tracking-tight leading-tight truncate w-full">SURVIVAL</span>
              <span className="font-display text-xs sm:text-sm font-black text-purple-300 font-mono-numbers mt-0.5">{formatSurvivalTime(survivalTimeSec)}</span>
            </div>

            {/* 9. COINS EARNED */}
            <div className="p-1 sm:p-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col items-center">
              <span className="text-[7px] sm:text-[7.5px] uppercase font-bold text-amber-300 tracking-tight leading-tight truncate w-full">COINS</span>
              <span className="font-display text-xs sm:text-sm font-black text-amber-300 font-mono-numbers mt-0.5">+{coinsEarned}</span>
            </div>

            {/* 10. XP EARNED */}
            <div className="p-1 sm:p-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col items-center">
              <span className="text-[7px] sm:text-[7.5px] uppercase font-bold text-cyan-300 tracking-tight leading-tight truncate w-full">XP</span>
              <span className="font-display text-xs sm:text-sm font-black text-cyan-300 font-mono-numbers mt-0.5">+{xpEarned}</span>
            </div>
          </div>
        </div>

        {/* Score Breakdown Detail Strip */}
        <div className="w-full p-1.5 sm:p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
          <div className="grid grid-cols-4 gap-1 text-center text-[8.5px]">
            <div>
              <span className="text-slate-500 block text-[7px] uppercase font-bold">Base</span>
              <span className="text-slate-300 font-bold font-mono-numbers">+{baseScore}</span>
            </div>
            <div>
              <span className="text-amber-500 block text-[7px] uppercase font-bold">Perfect</span>
              <span className="text-amber-300 font-bold font-mono-numbers">+{perfectBonus}</span>
            </div>
            <div>
              <span className="text-rose-500 block text-[7px] uppercase font-bold">Combo</span>
              <span className="text-rose-300 font-bold font-mono-numbers">+{comboBonus}</span>
            </div>
            <div>
              <span className="text-purple-500 block text-[7px] uppercase font-bold">Fever</span>
              <span className="text-purple-300 font-bold font-mono-numbers">+{feverBonus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons: PLAY AGAIN & Secondary Controls with Smooth Transitions */}
      <div className="w-full max-w-md flex flex-col gap-1.5 pb-1">
        {/* PRIMARY BUTTON: PLAY AGAIN */}
        <button
          type="button"
          onClick={onPlayAgain}
          className="group w-full h-11 sm:h-13 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 font-display text-base sm:text-lg font-black tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:brightness-110 active:scale-[0.97] active:translate-y-0.5 transition-all duration-150 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3] group-hover:rotate-180 transition-transform duration-500" />
          <span>PLAY AGAIN</span>
        </button>

        {/* SECONDARY ROW: HOME, LEADERBOARD, SHARE */}
        <div className="grid grid-cols-3 gap-1.5 w-full">
          <button
            type="button"
            onClick={onHome}
            className="h-9 sm:h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:scale-95 border border-slate-800 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-purple-400" />
            <span>HOME</span>
          </button>

          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="h-9 sm:h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:scale-95 border border-slate-800 text-amber-300 font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>RANKS</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="h-9 sm:h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:scale-95 border border-slate-800 text-cyan-300 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>SHARE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
