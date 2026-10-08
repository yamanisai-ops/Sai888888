import React from 'react';
import {
  Heart,
  Volume2,
  VolumeX,
  Zap,
  Pause,
  Sparkles,
  Flame,
  Coins,
  Shield,
  Clock,
  Magnet,
  Swords,
  AlertTriangle,
  Target,
  Crown,
} from 'lucide-react';
import { ActiveEvent, ActivePowerUpState, Challenge, GameMode, Obstacle } from '../types/game';

interface GameHUDProps {
  lives: number;
  score: number;
  combo: number;
  coins: number;
  bestScore: number;
  feverActive: boolean;
  feverProgress: number;
  feverTimeRemaining: number;
  currentObstacle: Obstacle | null;
  activeEvent?: ActiveEvent | null;
  activePowerUps?: ActivePowerUpState;
  isRushMode?: boolean;
  rushTimeRemaining?: number;
  bossWarningActive?: boolean;
  miniBossWarningActive?: boolean;
  mode?: GameMode;
  survivalTimeSec?: number;
  perfectStreak?: number;
  lastReaction?: { timeSec: string; grade: 'PERFECT' | 'GREAT' | 'GOOD'; timestamp: number } | null;
  activeChallenge?: Challenge | null;
  challengeProgress?: { current: number; target: number; label: string };
  ghostScore?: number;
  ghostTargetScore?: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  lives,
  score,
  combo,
  coins,
  bestScore,
  feverActive,
  feverProgress,
  feverTimeRemaining,
  currentObstacle,
  activeEvent = null,
  activePowerUps,
  isRushMode = false,
  rushTimeRemaining = 0,
  bossWarningActive = false,
  miniBossWarningActive = false,
  mode = 'CLASSIC',
  survivalTimeSec = 0,
  perfectStreak = 0,
  lastReaction = null,
  activeChallenge = null,
  challengeProgress,
  ghostScore,
  ghostTargetScore,
  isMuted,
  onToggleMute,
  onPause,
}) => {
  // Reaction time calculation for current obstacle
  const timeSeconds = currentObstacle ? (currentObstacle.remainingTime / 1000).toFixed(2) : '1.00';
  const timePercent = currentObstacle
    ? Math.max(0, Math.min(100, (currentObstacle.remainingTime / currentObstacle.timeLimit) * 100))
    : 100;

  const hasAnyPowerUp =
    activePowerUps &&
    (activePowerUps.hasShield ||
      activePowerUps.slowTimeRemaining > 0 ||
      activePowerUps.doubleScoreRemaining > 0 ||
      activePowerUps.coinMagnetRemaining > 0);

  // Combo meter percentage (0 to 20 combo range)
  const comboPercent = Math.min(100, Math.round((combo / 20) * 100));

  return (
    <div className="w-full max-w-lg mx-auto px-2.5 sm:px-4 pt-1.5 pb-0.5 select-none text-white">
      {/* 1. Main Top Status Row (Lives, Score, Combo, Coins, Controls) */}
      <div className="flex items-center justify-between gap-1.5">
        {/* Lives: 3 Hearts */}
        <div className="flex items-center gap-0.5 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-800/90 shrink-0">
          {[1, 2, 3].map((heartIndex) => {
            const hasLife = heartIndex <= lives;
            return (
              <Heart
                key={heartIndex}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${
                  hasLife
                    ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.7)]'
                    : 'text-slate-700 fill-slate-800/40 opacity-40'
                }`}
              />
            );
          })}
        </div>

        {/* Center Metrics: SCORE, COMBO, COINS */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* SCORE */}
          <div className="flex items-baseline gap-1 bg-slate-900/90 px-2 py-0.5 rounded-xl border border-slate-800/90 shadow-sm">
            <span className="text-[8px] uppercase font-bold tracking-wider text-slate-400">SCORE</span>
            <span className="font-display text-base sm:text-lg font-black text-white font-mono-numbers">
              {score}
            </span>
          </div>

          {/* COMBO */}
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-xl border transition-all ${
              combo >= 10
                ? 'bg-rose-950/80 border-rose-500/80 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                : combo >= 5
                ? 'bg-amber-950/70 border-amber-500/70 text-amber-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-300'
            }`}
          >
            <Flame className={`w-3 h-3 ${combo >= 5 ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`} />
            <span className="text-[11px] font-black font-mono-numbers">
              x{combo}
            </span>
          </div>

          {/* COINS */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-xl bg-amber-950/50 border border-amber-500/50 text-amber-300 font-mono-numbers font-black text-[11px] shadow-sm">
            <Coins className="w-3 h-3 text-amber-400" />
            <span>{coins}</span>
          </div>
        </div>

        {/* Right Controls: Pause & Mute */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onPause}
            aria-label="Pause Game"
            className="w-8 h-8 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:scale-95 border border-slate-700/80 flex items-center justify-center text-slate-300 transition-all cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5 text-slate-300" />
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="w-8 h-8 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:scale-95 border border-slate-700/80 flex items-center justify-center text-slate-300 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* 2. Compact Reaction Time & Fever / Power-Up Bar (Single clean row) */}
      <div className="mt-1 flex items-center justify-between gap-1.5 min-h-[22px]">
        {/* Left: Reaction time display OR Survival time */}
        <div className="flex items-center gap-1.5 min-w-0">
          {lastReaction ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/90 border border-cyan-500/50 text-[10px] shadow-sm shrink-0">
              <span className="font-mono-numbers font-bold text-white">{lastReaction.timeSec}</span>
              <span
                className={`font-display font-black uppercase text-[9px] ${
                  lastReaction.grade === 'PERFECT'
                    ? 'text-amber-400'
                    : lastReaction.grade === 'GREAT'
                    ? 'text-cyan-300'
                    : 'text-emerald-400'
                }`}
              >
                {lastReaction.grade}!
              </span>
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 font-mono-numbers truncate">
              {mode === 'ENDLESS' ? (
                <span className="flex items-center gap-1 text-purple-300">
                  <Clock className="w-2.5 h-2.5" />
                  {Math.floor(survivalTimeSec / 60)}:{String(Math.floor(survivalTimeSec % 60)).padStart(2, '0')}
                </span>
              ) : (
                <span className="text-slate-500 text-[9px]">BEST: {bestScore}</span>
              )}
            </div>
          )}

          {/* Perfect Streak chip if active */}
          {perfectStreak >= 1 && (
            <div
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black font-display tracking-wider border shrink-0 ${
                perfectStreak >= 10
                  ? 'bg-amber-400 text-slate-950 border-white shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                  : perfectStreak >= 5
                  ? 'bg-amber-950/80 border-amber-400 text-amber-300'
                  : 'bg-slate-900/90 border-cyan-500/40 text-cyan-300'
              }`}
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>STREAK x{perfectStreak}</span>
            </div>
          )}
        </div>

        {/* Right: Active Power-Ups (Compact inline icons with timers) */}
        {hasAnyPowerUp && (
          <div className="flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar">
            {activePowerUps?.hasShield && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 text-[9px] font-bold">
                <Shield className="w-2.5 h-2.5 fill-cyan-400" />
                <span>SHIELD</span>
              </span>
            )}
            {activePowerUps && activePowerUps.slowTimeRemaining > 0 && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-400/50 text-emerald-300 text-[9px] font-mono-numbers font-bold">
                <Clock className="w-2.5 h-2.5" />
                <span>{(activePowerUps.slowTimeRemaining / 1000).toFixed(0)}s</span>
              </span>
            )}
            {activePowerUps && activePowerUps.doubleScoreRemaining > 0 && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-400/50 text-amber-300 text-[9px] font-mono-numbers font-bold">
                <Flame className="w-2.5 h-2.5 fill-amber-400" />
                <span>2X</span>
              </span>
            )}
            {activePowerUps && activePowerUps.coinMagnetRemaining > 0 && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-yellow-950/80 border border-yellow-400/50 text-yellow-300 text-[9px] font-mono-numbers font-bold">
                <Magnet className="w-2.5 h-2.5 text-yellow-400" />
                <span>{(activePowerUps.coinMagnetRemaining / 1000).toFixed(0)}s</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Ghost Mode Dynamic Comparison Strip (Requirement 1 & 5) */}
      {mode === 'GHOST' && typeof ghostScore === 'number' && (
        <div className="mt-1 w-full px-2 sm:px-2.5 py-1 rounded-xl bg-purple-950/85 border border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.25)] flex items-center justify-between text-[10px]">
          {/* Left: Player score */}
          <div className="flex items-center gap-1">
            <span className="text-[8px] uppercase font-bold text-slate-300">SCORE:</span>
            <span className="font-display font-black text-cyan-300 font-mono-numbers text-xs">
              {score}
            </span>
          </div>

          {/* Center: Dynamic Ahead / Behind / Tied Badge */}
          <div className="flex items-center gap-1 font-display font-black uppercase text-[9px] sm:text-[9.5px]">
            {score > ghostScore ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.3)] animate-pulse">
                YOU'RE AHEAD! · AHEAD BY {score - ghostScore}
              </span>
            ) : score < ghostScore ? (
              <span className="px-2 py-0.5 rounded-md bg-rose-950/90 border border-rose-400 text-rose-300 shadow-[0_0_8px_rgba(251,113,133,0.3)] animate-pulse">
                GHOST IS AHEAD! · BEHIND BY {ghostScore - score}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-cyan-950/90 border border-cyan-400 text-cyan-300">
                TIED WITH GHOST!
              </span>
            )}
          </div>

          {/* Right: Ghost score */}
          <div className="flex items-center gap-1 font-mono-numbers font-black text-purple-200">
            <span className="text-xs">👻</span>
            <span className="text-[8px] uppercase font-bold text-purple-300">GHOST:</span>
            <span className="text-xs text-white">
              {ghostScore}
              {ghostTargetScore ? (
                <span className="text-[8.5px] text-purple-400 font-normal">/{ghostTargetScore}</span>
              ) : null}
            </span>
          </div>
        </div>
      )}

      {mode === 'GHOST' && typeof ghostScore !== 'number' && (
        <div className="mt-1 w-full px-2 sm:px-2.5 py-1 rounded-xl bg-purple-950/85 border border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.25)] flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1">
            <span className="text-[8px] uppercase font-bold text-slate-300">SCORE:</span>
            <span className="font-display font-black text-cyan-300 font-mono-numbers text-xs">{score}</span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-purple-900/80 border border-purple-400/50 text-purple-200 text-[9px] font-bold uppercase">
            RECORDING YOUR GHOST RUN 👻
          </span>
          <span className="text-[10px] text-purple-300 font-mono-numbers font-bold">1ST RUN</span>
        </div>
      )}

      {/* 3. Streamlined Combo & Fever / Reaction Meter (Slim, elegant bar) */}
      <div className="mt-1 w-full flex items-center gap-2">
        {/* Left: Slim Combo Bar with ticks */}
        <div className="flex-1 flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 px-0.5">
            <span className="flex items-center gap-1 text-[8px]">
              <Flame className="w-2.5 h-2.5 text-amber-400" />
              <span>COMBO</span>
            </span>
            <span className="font-mono-numbers text-[8px] text-slate-400">
              {combo >= 20 ? 'x20 MAX' : combo >= 10 ? 'x10 FEVER' : combo >= 5 ? 'x5 COINS' : `${combo}/20`}
            </span>
          </div>
          <div className="relative w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                combo >= 20
                  ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-purple-500'
                  : combo >= 10
                  ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                  : combo >= 5
                  ? 'bg-gradient-to-r from-cyan-400 to-amber-400'
                  : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.max(3, comboPercent)}%` }}
            />
          </div>
        </div>

        {/* Right: Live Obstacle / Boss Reaction Countdown Laser Bar */}
        {currentObstacle && (
          <div className="w-24 sm:w-28 flex flex-col gap-0.5 shrink-0">
            <div className="flex items-center justify-between text-[8px] font-mono-numbers font-bold text-slate-400 px-0.5">
              <span>{currentObstacle.isMiniBoss ? 'MINI BOSS' : currentObstacle.isBoss ? 'BOSS' : 'TIME'}</span>
              <span className={timePercent > 30 ? 'text-cyan-300' : 'text-rose-400 font-black'}>
                {timeSeconds}s
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  timePercent > 40 ? 'bg-cyan-400' : timePercent > 20 ? 'bg-amber-400' : 'bg-rose-500'
                }`}
                style={{ width: `${timePercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Compact Alerts & Multi-Step Sequence Badges (Non-obstructive) */}
      {/* Mini Boss Warning Alert Pill */}
      {miniBossWarningActive && (
        <div className="mt-1 w-full px-2.5 py-1 rounded-lg border border-orange-500 bg-orange-950/90 text-orange-200 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase shadow-sm">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>MINI BOSS INCOMING · 2-ACTION SEQUENCE</span>
        </div>
      )}

      {/* Full Boss Warning Alert Pill */}
      {bossWarningActive && (
        <div className="mt-1 w-full px-2.5 py-1 rounded-lg border border-rose-500 bg-rose-950/90 text-rose-200 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase shadow-sm">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>BOSS COMBAT INCOMING · 3-STEP SEQUENCE</span>
        </div>
      )}

      {/* Mini Boss 2-Step Sequence Card (Compact) */}
      {currentObstacle?.isMiniBoss && currentObstacle.miniBossSteps && (
        <div className="mt-1 w-full px-2 py-1.5 rounded-lg border border-orange-500/70 bg-slate-900/95 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="flex items-center gap-1 text-orange-400 font-display font-black">
              <Swords className="w-3 h-3" />
              <span>MINI BOSS: STEP {(currentObstacle.miniBossCurrentStepIndex || 0) + 1}/2</span>
            </span>
            <span className="font-mono-numbers text-[9px] text-orange-300 font-bold">
              +10 PTS · +15🪙
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {currentObstacle.miniBossSteps.map((stepAction, idx) => {
              const currentStepIdx = currentObstacle.miniBossCurrentStepIndex || 0;
              const isDone = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div
                  key={idx}
                  className={`py-1 px-1.5 rounded text-center font-display text-[11px] font-black border transition-all ${
                    isDone
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                      : isCurrent
                      ? 'bg-orange-500 text-slate-950 border-white font-extrabold shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  {isDone ? `✓ ${stepAction}` : `[${idx + 1}] ${stepAction}`}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Boss 3-Step Sequence Card (Compact) */}
      {currentObstacle?.isBoss && currentObstacle.bossSteps && (
        <div className="mt-1 w-full px-2 py-1.5 rounded-lg border border-amber-500/70 bg-slate-900/95 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="flex items-center gap-1 text-amber-400 font-display font-black">
              <Crown className="w-3 h-3" />
              <span>BOSS COMBAT: STEP {(currentObstacle.bossCurrentStepIndex || 0) + 1}/3</span>
            </span>
            <span className="font-mono-numbers text-[9px] text-amber-300 font-bold">
              +20 PTS · +30🪙
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {currentObstacle.bossSteps.map((stepAction, idx) => {
              const currentStepIdx = currentObstacle.bossCurrentStepIndex || 0;
              const isDone = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div
                  key={idx}
                  className={`py-1 px-1 rounded text-center font-display text-[10px] font-black border transition-all ${
                    isDone
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                      : isCurrent
                      ? 'bg-amber-500 text-slate-950 border-white font-extrabold shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  {isDone ? `✓ ${stepAction}` : `[${idx + 1}] ${stepAction}`}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Challenge Goal Banner if playing Challenge Mode (Compact) */}
      {mode === 'CHALLENGE' && activeChallenge && (
        <div className="mt-1 w-full px-2.5 py-1 rounded-lg border border-amber-500/40 bg-amber-950/30 text-amber-200 flex items-center justify-between text-[10px] font-bold shadow-sm">
          <div className="flex items-center gap-1 min-w-0">
            <Target className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="font-display font-black text-white truncate">
              {activeChallenge.subtitle}:
            </span>
            <span className="text-[10px] text-amber-200/80 truncate">
              {activeChallenge.description}
            </span>
          </div>
          {challengeProgress && (
            <span className="shrink-0 font-mono-numbers text-[10px] font-black text-amber-300 ml-1.5">
              {challengeProgress.current}/{challengeProgress.target}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
