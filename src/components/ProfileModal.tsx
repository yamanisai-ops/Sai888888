import React, { useState } from 'react';
import {
  ArrowLeft,
  Coins,
  Flame,
  Trophy,
  Zap,
  ShieldCheck,
  Gamepad2,
  Sparkles,
  AlertTriangle,
  Crown,
  Edit2,
  Check,
  User,
  Timer,
  Lock,
  Award,
} from 'lucide-react';
import { PlayerTitleId, SkinId, UserStats } from '../types/game';
import { SKINS } from '../utils/skins';
import { ALL_ACHIEVEMENTS } from '../utils/achievements';
import { soundEngine } from '../audio/soundEngine';
import { getPlayerNickname, savePlayerNickname } from '../utils/storage';
import { getRankForScore, getRankProgress } from '../utils/ranks';
import {
  TITLES,
  getPlayerProgression,
  setEquippedTitle,
} from '../utils/progression';

interface ProfileModalProps {
  coins: number;
  bestScore: number;
  bestCombo: number;
  bestReactionTimeMs: number;
  userStats: UserStats;
  equippedSkin: SkinId;
  unlockedAchievements: string[];
  onClose: () => void;
  onOpenLeaderboard?: () => void;
  onEquipTitle?: (titleId: PlayerTitleId) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  coins,
  bestScore,
  bestCombo,
  bestReactionTimeMs,
  userStats,
  equippedSkin,
  unlockedAchievements,
  onClose,
  onOpenLeaderboard,
  onEquipTitle,
}) => {
  const skin = SKINS[equippedSkin] || SKINS.classic;
  const [nickname, setNickname] = useState(() => getPlayerNickname());
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameSaved, setNicknameSaved] = useState(false);

  // Progression state: Level, XP, Titles
  const [progression, setProgression] = useState(() => getPlayerProgression());

  const currentRank = getRankForScore(bestScore);
  const { next: nextRank, progressPercent: rankProgressPercent, pointsToNext } = getRankProgress(bestScore);

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    const saved = savePlayerNickname(nickname);
    setNickname(saved);
    setIsEditingNickname(false);
    setNicknameSaved(true);
    setTimeout(() => setNicknameSaved(false), 2000);
  };

  const handleSelectTitle = (titleId: PlayerTitleId) => {
    soundEngine.playClick();
    setEquippedTitle(titleId);
    setProgression(getPlayerProgression());
    if (onEquipTitle) {
      onEquipTitle(titleId);
    }
  };

  const formatSurvivalTime = (sec: number) => {
    if (!sec || sec <= 0) return '0s';
    const mins = Math.floor(sec / 60);
    const remainder = Math.floor(sec % 60);
    return mins > 0 ? `${mins}m ${remainder}s` : `${remainder}s`;
  };

  const xpPercent = Math.min(
    100,
    Math.max(0, Math.round((progression.currentXp / progression.xpForNextLevel) * 100))
  );

  const equippedTitleInfo = TITLES[progression.equippedTitle] || TITLES.ROOKIE;

  const titleList: PlayerTitleId[] = [
    'ROOKIE',
    'FAST_HANDS',
    'COMBO_MASTER',
    'BOSS_HUNTER',
    'SPEED_DEMON',
    'ONE_SECOND_LEGEND',
  ];

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-slate-950/98 backdrop-blur-xl text-white select-none overflow-hidden animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-800/80 bg-slate-900/60 shrink-0">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>BACK</span>
        </button>

        <div className="font-display text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
          <User className="w-5 h-5 text-purple-400" />
          <span>RUNNER PROFILE</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 font-mono-numbers font-black text-xs sm:text-sm">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span>{coins}</span>
        </div>
      </div>

      {/* Main Profile Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 max-w-md mx-auto w-full pb-8 flex flex-col gap-3 no-scrollbar">
        {/* 1. Player Identity, Nickname & Equipped Title Card */}
        <div className="p-3.5 sm:p-4 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            {/* Skin Avatar Preview */}
            <div
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border border-white/10"
              style={{ backgroundColor: `${skin.suitColor}33` }}
            >
              <div
                className="w-8 h-7 rounded-xl flex items-center justify-center shadow-md"
                style={{ backgroundColor: skin.helmetColor }}
              >
                <div
                  className="w-5 h-2.5 rounded-sm"
                  style={{
                    backgroundColor: skin.visorColor,
                    boxShadow: `0 0 6px ${skin.visorColor}`,
                  }}
                />
              </div>
            </div>

            {/* Nickname, Equipped Title, and Skin Tag */}
            <div className="min-w-0 flex-1">
              {isEditingNickname ? (
                <form onSubmit={handleSaveNickname} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={15}
                    placeholder="Enter nickname"
                    className="flex-1 px-2.5 py-1 rounded-xl bg-slate-950 border border-cyan-500/60 text-white font-display text-sm font-bold focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs cursor-pointer hover:bg-cyan-400"
                  >
                    SAVE
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-display text-lg sm:text-xl font-black text-white truncate">
                      {nickname}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingNickname(true)}
                      aria-label="Edit nickname"
                      className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                  {nicknameSaved && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> SAVED
                    </span>
                  )}
                </div>
              )}

              {/* EQUIPPED TITLE BADGE (Requirement 4: Show equipped title below nickname) */}
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-display font-black tracking-wider uppercase border shadow-sm"
                  style={{
                    backgroundColor: `${equippedTitleInfo.badgeColor}22`,
                    borderColor: equippedTitleInfo.badgeColor,
                    color: equippedTitleInfo.badgeColor,
                  }}
                >
                  ★ {equippedTitleInfo.name} ★
                </span>
                <span className="text-[9.5px] text-slate-400 font-mono-numbers">
                  SKIN: {skin.name}
                </span>
              </div>
            </div>
          </div>

          {/* 2. PLAYER LEVEL & XP PROGRESSION (Requirement 1 & 2) */}
          <div className="pt-2.5 border-t border-slate-800/80 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 font-display font-black text-xs">
                  {progression.level}
                </div>
                <span className="font-display text-xs sm:text-sm font-black text-white tracking-wide">
                  LEVEL {progression.level}
                </span>
              </div>
              <span className="font-mono-numbers text-[10px] sm:text-xs font-bold text-cyan-300">
                XP {progression.currentXp} / {progression.xpForNextLevel}
              </span>
            </div>

            {/* XP Progress Bar */}
            <div className="relative w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono-numbers px-0.5">
              <span>PROGRESS: {xpPercent}%</span>
              <span>TOTAL XP: {progression.totalXp}</span>
            </div>
          </div>
        </div>

        {/* 3. PLAYER TITLES SELECTION SECTION (Requirement 4) */}
        <div className="p-3 sm:p-3.5 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2.5 shadow-md">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-display font-black text-white uppercase tracking-wider">
              <Award className="w-4 h-4 text-amber-400" />
              <span>PLAYER TITLES</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono-numbers">
              {progression.unlockedTitles.length} / {titleList.length} UNLOCKED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {titleList.map((titleId) => {
              const titleInfo = TITLES[titleId];
              const isUnlocked = progression.unlockedTitles.includes(titleId);
              const isEquipped = progression.equippedTitle === titleId;

              return (
                <div
                  key={titleId}
                  className={`p-2 rounded-xl border flex items-center justify-between transition-all ${
                    isEquipped
                      ? 'bg-slate-800/90 border-cyan-400/80 shadow-sm'
                      : isUnlocked
                      ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-950/40 border-slate-850/60 opacity-60'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      {!isUnlocked && <Lock className="w-3 h-3 text-slate-500 shrink-0" />}
                      <span
                        className="font-display font-black text-[11px] truncate tracking-wider"
                        style={{ color: isUnlocked ? titleInfo.badgeColor : '#64748b' }}
                      >
                        {titleInfo.name}
                      </span>
                    </div>
                    <span className="text-[8.5px] text-slate-400 truncate mt-0.5">
                      {titleInfo.description}
                    </span>
                  </div>

                  <div className="shrink-0">
                    {isEquipped ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-bold text-[9px] uppercase">
                        EQUIPPED
                      </span>
                    ) : isUnlocked ? (
                      <button
                        type="button"
                        onClick={() => handleSelectTitle(titleId)}
                        className="px-2.5 py-0.5 rounded bg-cyan-600/80 hover:bg-cyan-500 active:scale-95 text-slate-950 font-black text-[9px] uppercase transition-all cursor-pointer"
                      >
                        EQUIP
                      </button>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 text-[8.5px] uppercase font-bold">
                        LOCKED
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. CAREER RECORDS & STATS (Requirement 5: 9 Required Metrics) */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between px-1">
            <span>CAREER RECORDS & STATS</span>
            <span className="text-[9.5px] text-cyan-400 font-mono-numbers">LIFETIME</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {/* 1. BEST SCORE */}
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center">
              <div className="flex items-center gap-1 text-[8.5px] text-amber-400 font-bold mb-0.5 uppercase">
                <Trophy className="w-3 h-3" />
                <span>BEST SCORE</span>
              </div>
              <span className="font-display text-lg font-black text-amber-300 font-mono-numbers">
                {bestScore}
              </span>
            </div>

            {/* 2. BEST COMBO */}
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center">
              <div className="flex items-center gap-1 text-[8.5px] text-rose-400 font-bold mb-0.5 uppercase">
                <Flame className="w-3 h-3" />
                <span>BEST COMBO</span>
              </div>
              <span className="font-display text-lg font-black text-rose-300 font-mono-numbers">
                {bestCombo}x
              </span>
            </div>

            {/* 3. BEST REACTION */}
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center">
              <div className="flex items-center gap-1 text-[8.5px] text-emerald-400 font-bold mb-0.5 uppercase">
                <Zap className="w-3 h-3" />
                <span>REACTION</span>
              </div>
              <span className="font-display text-lg font-black text-emerald-300 font-mono-numbers">
                {bestReactionTimeMs > 0 ? `${bestReactionTimeMs}ms` : '—'}
              </span>
            </div>

            {/* 4. LONGEST SURVIVAL */}
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center">
              <div className="flex items-center gap-1 text-[8.5px] text-cyan-400 font-bold mb-0.5 uppercase">
                <Timer className="w-3 h-3" />
                <span>SURVIVAL</span>
              </div>
              <span className="font-display text-sm sm:text-base font-black text-cyan-300 font-mono-numbers mt-0.5">
                {formatSurvivalTime(userStats.longestSurvivalTimeSec)}
              </span>
            </div>

            {/* 5. PERFECT REACTIONS */}
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center">
              <div className="flex items-center gap-1 text-[8.5px] text-purple-400 font-bold mb-0.5 uppercase">
                <Sparkles className="w-3 h-3" />
                <span>PERFECTS</span>
              </div>
              <span className="font-display text-lg font-black text-purple-300 font-mono-numbers">
                {userStats.totalPerfects || 0}
              </span>
            </div>

            {/* 6. NEAR MISSES */}
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center">
              <div className="flex items-center gap-1 text-[8.5px] text-orange-400 font-bold mb-0.5 uppercase">
                <AlertTriangle className="w-3 h-3" />
                <span>NEAR MISS</span>
              </div>
              <span className="font-display text-lg font-black text-orange-300 font-mono-numbers">
                {userStats.totalNearMisses || 0}
              </span>
            </div>

            {/* 7. BOSSES DEFEATED */}
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center">
              <div className="flex items-center gap-1 text-[8.5px] text-yellow-400 font-bold mb-0.5 uppercase">
                <Crown className="w-3 h-3" />
                <span>BOSSES</span>
              </div>
              <span className="font-display text-lg font-black text-yellow-300 font-mono-numbers">
                {userStats.bossesDefeated || 0}
              </span>
            </div>

            {/* 8. TOTAL GAMES */}
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center">
              <div className="flex items-center gap-1 text-[8.5px] text-sky-400 font-bold mb-0.5 uppercase">
                <Gamepad2 className="w-3 h-3" />
                <span>GAMES</span>
              </div>
              <span className="font-display text-lg font-black text-sky-300 font-mono-numbers">
                {userStats.totalGames || 0}
              </span>
            </div>

            {/* 9. TOTAL COINS EARNED */}
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center">
              <div className="flex items-center gap-1 text-[8.5px] text-amber-400 font-bold mb-0.5 uppercase">
                <Coins className="w-3 h-3" />
                <span>COINS</span>
              </div>
              <span className="font-display text-sm sm:text-base font-black text-amber-300 font-mono-numbers mt-0.5">
                +{userStats.totalCoinsEarned || coins}🪙
              </span>
            </div>
          </div>
        </div>

        {/* Leaderboard Shortcut Button */}
        {onOpenLeaderboard && (
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onOpenLeaderboard();
            }}
            className="w-full h-10 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 text-amber-300 font-display font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>CHECK LOCAL LEADERBOARD</span>
          </button>
        )}

        {/* Achievements Quick List */}
        <div>
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
            <span>ACHIEVEMENTS</span>
            <span className="text-amber-400 font-mono-numbers">
              {unlockedAchievements.length} / {ALL_ACHIEVEMENTS.length}
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1.5">
            {ALL_ACHIEVEMENTS.map((ach) => {
              const unlocked = unlockedAchievements.includes(ach.id);
              return (
                <div key={ach.id} className="flex items-center justify-between text-xs py-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${unlocked ? 'text-amber-400' : 'text-slate-600'}`} />
                    <span className={`truncate text-[11px] ${unlocked ? 'text-white font-medium' : 'text-slate-500'}`}>
                      {ach.title}
                    </span>
                  </div>
                  <span className={`text-[9.5px] font-mono-numbers shrink-0 ml-2 ${unlocked ? 'text-emerald-400 font-bold' : 'text-slate-600'}`}>
                    {unlocked ? 'COMPLETED' : 'LOCKED'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

