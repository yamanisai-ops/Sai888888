import React from 'react';
import {
  Play,
  Infinity,
  Trophy,
  Coins,
  Calendar,
  ShoppingBag,
  Target,
  User,
  Volume2,
  VolumeX,
  Zap,
  Flame,
  Swords,
  ChevronRight,
  Award,
} from 'lucide-react';
import { SkinId } from '../types/game';
import { SKINS } from '../utils/skins';
import { soundEngine } from '../audio/soundEngine';
import { getRankForScore, getRankProgress } from '../utils/ranks';
import { TITLES, getPlayerProgression } from '../utils/progression';
import { getGhostRun } from '../utils/storage';

interface StartScreenProps {
  coins: number;
  bestScore: number;
  bestReactionTimeMs: number;
  equippedSkin: SkinId;
  hasUnclaimedDaily: boolean;
  hasUnclaimedMissions: boolean;
  hasUnclaimedStreak: boolean;
  currentStreak: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onPlayClassic: () => void;
  onPlayGhost: () => void;
  onPlayEndless: () => void;
  onOpenChallenges: () => void;
  onOpenShop: () => void;
  onOpenDaily: () => void;
  onOpenStreak: () => void;
  onOpenLeaderboard: () => void;
  onOpenMissions: () => void;
  onOpenProfile: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  coins,
  bestScore,
  bestReactionTimeMs,
  equippedSkin,
  hasUnclaimedDaily,
  hasUnclaimedMissions,
  hasUnclaimedStreak,
  currentStreak,
  isMuted,
  onToggleMute,
  onPlayClassic,
  onPlayGhost,
  onPlayEndless,
  onOpenChallenges,
  onOpenShop,
  onOpenDaily,
  onOpenStreak,
  onOpenLeaderboard,
  onOpenMissions,
  onOpenProfile,
}) => {
  const currentSkin = SKINS[equippedSkin] || SKINS.classic;
  const currentRank = getRankForScore(bestScore);
  const { next: nextRank, progressPercent, pointsToNext } = getRankProgress(bestScore);
  const progression = getPlayerProgression();
  const titleInfo = TITLES[progression.equippedTitle] || TITLES.ROOKIE;
  const ghostRun = getGhostRun();

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-3.5 sm:p-5 bg-slate-950/95 backdrop-blur-xl text-white select-none overflow-y-auto">
      {/* Top Header Row */}
      <div className="w-full max-w-md flex items-center justify-between pt-1">
        {/* Coin Balance Chip */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onOpenShop();
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-950/40 hover:bg-amber-900/40 border border-amber-500/40 text-amber-300 font-mono-numbers font-black text-xs sm:text-sm shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all cursor-pointer active:scale-95"
        >
          <Coins className="w-4 h-4 text-amber-400" />
          <span>{coins}</span>
          <span className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider ml-0.5">SHOP</span>
        </button>

        {/* Daily Streak Chip */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onOpenStreak();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border transition-all cursor-pointer active:scale-95 text-xs font-bold font-mono-numbers ${
            hasUnclaimedStreak
              ? 'bg-orange-950/50 border-orange-500/60 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
              : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}
        >
          <Flame className={`w-3.5 h-3.5 ${hasUnclaimedStreak ? 'fill-orange-400 text-orange-400 animate-pulse' : 'text-slate-400'}`} />
          <span>{currentStreak}D STREAK</span>
          {hasUnclaimedStreak && (
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping" />
          )}
        </button>

        {/* Audio Mute Toggle */}
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>
      </div>

      {/* Hero Title & Rank Showcase */}
      <div className="w-full max-w-md flex flex-col items-center text-center my-auto py-2">
        {/* Neon Reflex Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-1.5">
          <Zap className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
          <span>FAST REFLEX ARCADE</span>
        </div>

        {/* Main Title */}
        <h1 className="font-display text-5xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[0_0_35px_rgba(56,189,248,0.5)]">
          ONE SECOND
        </h1>
        <p className="mt-0.5 text-sm sm:text-base text-slate-300 font-medium">
          "How fast can you react?"
        </p>

        {/* Rank & Runner Badge Card */}
        <div
          onClick={() => {
            soundEngine.playClick();
            onOpenProfile();
          }}
          className="w-full mt-3 p-3 sm:p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-400/50 transition-all cursor-pointer text-left flex items-center justify-between group shadow-lg"
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Skin Avatar */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-white/10"
              style={{ backgroundColor: `${currentSkin.suitColor}33` }}
            >
              <div
                className="w-6 h-5 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: currentSkin.helmetColor }}
              >
                <div
                  className="w-4 h-2 rounded-sm"
                  style={{
                    backgroundColor: currentSkin.visorColor,
                    boxShadow: `0 0 6px ${currentSkin.visorColor}`,
                  }}
                />
              </div>
            </div>

            {/* Rank and Progression info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 font-display font-black text-[9px] uppercase">
                  LVL {progression.level}
                </span>
                <span
                  className="px-1.5 py-0.2 rounded text-[9px] font-display font-black uppercase border"
                  style={{
                    backgroundColor: `${titleInfo.badgeColor}22`,
                    borderColor: titleInfo.badgeColor,
                    color: titleInfo.badgeColor,
                  }}
                >
                  ★ {titleInfo.name} ★
                </span>
                <span
                  className="px-1.5 py-0.2 rounded-md text-[9px] font-display font-black uppercase border ml-auto"
                  style={{
                    backgroundColor: `${currentRank.color}22`,
                    borderColor: currentRank.color,
                    color: currentRank.color,
                  }}
                >
                  {currentRank.name}
                </span>
              </div>

              {/* Progress bar to next rank */}
              <div className="mt-1.5 w-full">
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${progressPercent}%`,
                      backgroundColor: currentRank.color,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono-numbers mt-0.5">
                  <span>Score: {bestScore}</span>
                  <span>{nextRank ? `${pointsToNext} pts to ${nextRank.name}` : 'MAX RANK'}</span>
                </div>
              </div>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-300 transition-colors shrink-0 ml-2" />
        </div>

        {/* Best Stats Strip */}
        <div className="grid grid-cols-2 gap-2.5 w-full mt-2.5">
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                BEST SCORE
              </span>
              <span className="block font-display text-lg font-black text-white font-mono-numbers">
                {bestScore}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                BEST TIME
              </span>
              <span className="block font-display text-lg font-black text-white font-mono-numbers">
                {bestReactionTimeMs > 0 ? `${bestReactionTimeMs}ms` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Home Menu Navigation Buttons */}
      <div className="w-full max-w-md pb-1 flex flex-col gap-1.5 sm:gap-2">
        {/* PRIMARY BUTTON: PLAY */}
        <button
          type="button"
          onClick={onPlayClassic}
          className="w-full h-12 sm:h-13 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 text-slate-950 font-display text-lg sm:text-xl font-black tracking-wide flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(56,189,248,0.45)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-slate-950 text-slate-950 stroke-[2]" />
          <span>PLAY</span>
        </button>

        {/* GHOST MODE 👻 BUTTON (Requirement 1, 8) */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onPlayGhost();
          }}
          className="w-full h-11 sm:h-12 px-3.5 sm:px-4 rounded-2xl bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-purple-900/90 hover:from-purple-900 hover:to-indigo-900 border border-purple-500/50 hover:border-purple-400 text-purple-100 font-display flex items-center justify-between shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg sm:text-xl group-hover:scale-110 transition-transform">👻</span>
            <div className="text-left">
              <span className="block font-black text-xs sm:text-sm text-white tracking-wide leading-tight">
                GHOST MODE 👻
              </span>
              <span className="block text-[9.5px] sm:text-[10px] text-purple-300/80 font-medium">
                Race your best run
              </span>
            </div>
          </div>
          {ghostRun ? (
            <span className="px-2 py-0.5 rounded-lg bg-purple-900/80 border border-purple-400/40 text-[10px] font-mono-numbers font-black text-purple-200 shadow-sm">
              GHOST: {ghostRun.finalScore}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 border border-purple-400/30 text-[9.5px] font-mono-numbers font-bold text-purple-300">
              CREATE GHOST
            </span>
          )}
        </button>

        {/* SECONDARY BUTTONS ROW 1: ENDLESS & CHALLENGES */}
        <div className="grid grid-cols-2 gap-2 w-full">
          {/* ENDLESS */}
          <button
            type="button"
            onClick={onPlayEndless}
            className="h-11 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-purple-500/40 text-purple-200 flex items-center gap-2.5 transition-all cursor-pointer active:scale-95 text-left shadow-[0_0_15px_rgba(168,85,247,0.15)]"
          >
            <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
              <Infinity className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block font-display text-xs font-black text-white leading-tight">
                ENDLESS
              </span>
              <span className="block text-[10px] text-purple-300/70 truncate">
                Survive Mode
              </span>
            </div>
          </button>

          {/* CHALLENGES */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onOpenChallenges();
            }}
            className="h-11 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-cyan-500/40 text-cyan-200 flex items-center gap-2.5 transition-all cursor-pointer active:scale-95 text-left shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          >
            <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
              <Swords className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block font-display text-xs font-black text-white leading-tight">
                CHALLENGES
              </span>
              <span className="block text-[10px] text-cyan-300/70 truncate">
                8 Missions
              </span>
            </div>
          </button>
        </div>

        {/* SECONDARY BUTTONS ROW 2: DAILY & LEADERBOARD */}
        <div className="grid grid-cols-2 gap-2 w-full">
          {/* DAILY */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onOpenDaily();
            }}
            className="h-11 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-slate-200 flex items-center gap-2.5 transition-all cursor-pointer active:scale-95 text-left"
          >
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block font-display text-xs font-black text-white leading-tight">
                DAILY
              </span>
              <span className="block text-[10px] text-slate-400 truncate">
                {hasUnclaimedDaily ? 'Claim Reward' : 'Today’s Goal'}
              </span>
            </div>
            {hasUnclaimedDaily && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            )}
          </button>

          {/* LEADERBOARD */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onOpenLeaderboard();
            }}
            className="h-11 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-slate-200 flex items-center gap-2.5 transition-all cursor-pointer active:scale-95 text-left"
          >
            <div className="w-7 h-7 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0">
              <Trophy className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block font-display text-xs font-black text-white leading-tight">
                LEADERBOARD
              </span>
              <span className="block text-[10px] text-slate-400 truncate">
                Local Ranks
              </span>
            </div>
          </button>
        </div>

        {/* SECONDARY BUTTONS ROW 3: SHOP, MISSIONS & PROFILE */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {/* SHOP */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onOpenShop();
            }}
            className="h-11 px-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-pink-400" />
            <span className="font-display text-xs font-black text-white">
              SHOP
            </span>
          </button>

          {/* MISSIONS */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onOpenMissions();
            }}
            className="relative h-11 px-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-display text-xs font-black text-white">
              MISSIONS
            </span>
            {hasUnclaimedMissions && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping absolute top-1.5 right-2" />
            )}
          </button>

          {/* PROFILE */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onOpenProfile();
            }}
            className="h-11 px-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <User className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-display text-xs font-black text-white">
              PROFILE
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

