/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Action,
  ActiveEvent,
  Achievement,
  AchievementId,
  ActivePowerUpState,
  DailyChallenge,
  DailyStreakData,
  FloatingFeedback,
  GameMode,
  GameState,
  Mission,
  Obstacle,
  Player,
  PlayerAction,
  PowerUp,
  RainCoin,
  RankInfo,
  Challenge,
  ScoreBreakdown,
  SkinId,
  UserStats,
  PlayerProgression,
  PlayerTitleId,
  GhostRun,
  GhostEvent,
} from './types/game';
import {
  generateBossObstacle,
  generateMiniBossObstacle,
  generateRandomObstacle,
  generateRandomPowerUp,
  getDifficulty,
  pickRandomEvent,
} from './utils/difficulty';
import confetti from 'canvas-confetti';
import { ALL_ACHIEVEMENTS, getStoredAchievements, saveAchievement } from './utils/achievements';
import {
  addCoins,
  checkChallengeGoalProgress,
  claimDailyReward,
  claimMissionReward,
  completeChallenge,
  getBestCombo,
  getBestReactionTime,
  getBestScore,
  getChallenges,
  getCoins,
  getDailyChallenge,
  getDailyStreak,
  getEquippedSkin,
  getGhostRun,
  getMissions,
  getPurchasedSkins,
  getUserStats,
  purchaseSkin,
  recordGameStats,
  saveBestCombo,
  saveBestReactionTime,
  saveBestScore,
  saveEndlessBestScore,
  saveEndlessBestSurvival,
  saveGhostRun,
  setEquippedSkin,
  updateDailyChallengeProgress,
  updateMissionsProgress,
  updatePlayerLeaderboardScore,
} from './utils/storage';
import { getRankForScore, hasRankedUp } from './utils/ranks';
import { TITLES, addPlayerXp, getPlayerProgression } from './utils/progression';
import { getEnvironmentTheme } from './utils/environmentThemes';
import { soundEngine } from './audio/soundEngine';
import { GameCanvas } from './components/GameCanvas';
import { ActionControls } from './components/ActionControls';
import { GameHUD } from './components/GameHUD';
import { StartScreen } from './components/StartScreen';
import { CountdownScreen } from './components/CountdownScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { PauseScreen } from './components/PauseScreen';
import { AchievementToast } from './components/AchievementToast';
import { ShopModal } from './components/ShopModal';
import { DailyChallengeModal } from './components/DailyChallengeModal';
import { MissionsModal } from './components/MissionsModal';
import { ProfileModal } from './components/ProfileModal';
import { RewardToast, RewardToastData } from './components/RewardToast';
import { LeaderboardModal } from './components/LeaderboardModal';
import { RankUpModal } from './components/RankUpModal';
import { ShareModal } from './components/ShareModal';
import { DailyStreakModal } from './components/DailyStreakModal';
import { ChallengeSelectModal } from './components/ChallengeSelectModal';
import { LevelUpModal } from './components/LevelUpModal';

export default function App() {
  // Game lifecycle state
  const [gameState, setGameState] = useState<GameState>('MENU');

  // Coins & Currency
  const [coins, setCoins] = useState<number>(() => getCoins());
  const [coinsEarnedThisRun, setCoinsEarnedThisRun] = useState<number>(0);

  // Skins & Inventory
  const [purchasedSkins, setPurchasedSkins] = useState<SkinId[]>(() => getPurchasedSkins());
  const [equippedSkin, setEquippedSkinState] = useState<SkinId>(() => getEquippedSkin());

  // Daily Challenge & Missions
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge>(() => getDailyChallenge());
  const [missions, setMissions] = useState<Mission[]>(() => getMissions());
  const [userStats, setUserStats] = useState<UserStats>(() => getUserStats());

  // Reward Toast & Popups (Requirement 6)
  const [rewardToastData, setRewardToastData] = useState<RewardToastData | null>(null);
  const [rewardToast, setRewardToast] = useState<{ message: string; coins?: number } | null>(null);

  // Player XP, Level Progression, and Level-Up Modal (Requirement 1, 2, 4)
  const [xpEarnedThisRun, setXpEarnedThisRun] = useState<number>(0);
  const [playerProgression, setPlayerProgression] = useState<PlayerProgression>(() => getPlayerProgression());
  const [levelUpModalData, setLevelUpModalData] = useState<{
    level: number;
    coinReward: number;
    unlockedTitle?: string | null;
  } | null>(null);

  // Stats & Progress
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [bestScore, setBestScore] = useState<number>(() => getBestScore());
  const [bestCombo, setBestCombo] = useState<number>(() => getBestCombo());
  const [bestReactionTimeMs, setBestReactionTimeMs] = useState<number>(() => getBestReactionTime());
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  // Reaction times tracking
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [fastestReactionMs, setFastestReactionMs] = useState<number>(0);
  const [averageReactionMs, setAverageReactionMs] = useState<number>(0);
  const [totalCleared, setTotalCleared] = useState<number>(0);
  const [perfectCount, setPerfectCount] = useState<number>(0);

  // Achievements
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(() => getStoredAchievements());
  const [activeToastAchievement, setActiveToastAchievement] = useState<Achievement | null>(null);

  // Audio mute state
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.getMuted());

  // Fever Mode state (10 seconds duration)
  const [feverActive, setFeverActive] = useState<boolean>(false);
  const [feverProgress, setFeverProgress] = useState<number>(0);
  const [feverTimeRemaining, setFeverTimeRemaining] = useState<number>(0);

  // Random Events state
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);

  // V4 Power-Ups State
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUpState>({
    hasShield: false,
    slowTimeRemaining: 0,
    doubleScoreRemaining: 0,
    coinMagnetRemaining: 0,
  });
  const [activePowerUpPickup, setActivePowerUpPickup] = useState<PowerUp | null>(null);
  const [powerUpsCollected, setPowerUpsCollected] = useState<number>(0);

  // V4 Near Misses
  const [nearMisses, setNearMisses] = useState<number>(0);

  // V4 Rush Mode (At 40 Score)
  const [isRushMode, setIsRushMode] = useState<boolean>(false);
  const [rushTimeRemaining, setRushTimeRemaining] = useState<number>(0);
  const rushTriggeredRef = useRef<boolean>(false);

  // V4 Boss Challenge (Every 50 Score)
  const [bossWarningActive, setBossWarningActive] = useState<boolean>(false);
  const [bossesDefeated, setBossesDefeated] = useState<number>(0);
  const lastBossScoreThresholdRef = useRef<number>(0);

  // V4 Combo Milestones
  const comboMilestonesClaimedRef = useRef<{ 5: boolean; 10: boolean; 20: boolean }>({
    5: false,
    10: false,
    20: false,
  });

  // V5 Mode Select: CLASSIC vs ENDLESS vs CHALLENGE
  const [gameMode, setGameMode] = useState<GameMode>('CLASSIC');

  // V6 Challenge Mode State
  const [isChallengesOpen, setIsChallengesOpen] = useState<boolean>(false);
  const [challenges, setChallenges] = useState<Challenge[]>(() => getChallenges());
  const [activeChallengeId, setActiveChallengeId] = useState<number | null>(null);

  // V6 Mini Boss (Every 25 Score)
  const [miniBossWarningActive, setMiniBossWarningActive] = useState<boolean>(false);
  const lastMiniBossScoreThresholdRef = useRef<number>(0);

  // V6 Perfect Streak Tracking
  const [perfectStreak, setPerfectStreak] = useState<number>(0);

  // V6 Reaction Time Display Badge
  const [lastReaction, setLastReaction] = useState<{ timeSec: string; grade: 'PERFECT' | 'GREAT' | 'GOOD'; timestamp: number } | null>(null);

  // V6 Score Milestones Rewards (10 -> +5, 25 -> +10, 50 -> +25, 100 -> +50)
  const scoreMilestonesClaimedRef = useRef<{ 10: boolean; 25: boolean; 50: boolean; 100: boolean }>({
    10: false,
    25: false,
    50: false,
    100: false,
  });

  // V5 Modals & Dialogs State
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [rankUpData, setRankUpData] = useState<{ previousRank: RankInfo; newRank: RankInfo; score: number } | null>(null);
  const [shareModalText, setShareModalText] = useState<string | null>(null);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState<boolean>(false);
  const [streakData, setStreakData] = useState<DailyStreakData>(() => getDailyStreak());

  // V5 Score Breakdown & Survival Metrics
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | undefined>(undefined);
  const [survivalTimeSec, setSurvivalTimeSec] = useState<number>(0);
  const basePointsSumRef = useRef<number>(0);
  const perfectBonusSumRef = useRef<number>(0);
  const comboBonusSumRef = useRef<number>(0);
  const feverBonusSumRef = useRef<number>(0);

  // Falling Rain Coins for Coin Rain event
  const [rainCoins, setRainCoins] = useState<RainCoin[]>([]);

  // Survival time tracking
  const runStartTimeRef = useRef<number>(0);

  // Screen trauma / flash / shake
  const [isHurtShake, setIsHurtShake] = useState<boolean>(false);
  const [showRedFlash, setShowRedFlash] = useState<boolean>(false);

  // Floating feedbacks for canvas & screen
  const [floatingFeedbacks, setFloatingFeedbacks] = useState<FloatingFeedback[]>([]);

  // Active Obstacle
  const [currentObstacle, setCurrentObstacle] = useState<Obstacle | null>(null);

  // Runner state
  const [player, setPlayer] = useState<Player>({
    lane: 0,
    targetLane: 0,
    currentAction: 'RUNNING',
    actionProgress: 0,
    invulnerableTime: 0,
    skinId: getEquippedSkin(),
  });

  // Ghost Runner state (Requirement: Ghost Mode 👻)
  const [ghostPlayer, setGhostPlayer] = useState<Player | null>(null);
  const [ghostScore, setGhostScore] = useState<number | undefined>(undefined);
  const activeGhostRunRef = useRef<GhostRun | null>(null);
  const currentRunEventsRef = useRef<GhostEvent[]>([]);
  const [ghostDefeatedState, setGhostDefeatedState] = useState<{
    beatGhost: boolean;
    isCrushed: boolean;
    ghostTargetScore?: number;
    ghostCoinBonus: number;
    ghostXpBonus: number;
  } | null>(null);
  const prevBiomeIdRef = useRef<string>('CYBER_MIDNIGHT');

  // Mutable game loop references to prevent closure staleness
  const stateRef = useRef({
    gameState: 'MENU' as GameState,
    gameMode: 'CLASSIC' as GameMode,
    score: 0,
    combo: 0,
    maxCombo: 0,
    lives: 3,
    coinsEarnedThisRun: 0,
    xpEarnedThisRun: 0,
    perfectCount: 0,
    totalCleared: 0,
    powerUpsCollected: 0,
    nearMisses: 0,
    bossesDefeated: 0,
    feverActive: false,
    feverProgress: 0,
    feverTimeRemaining: 0,
    isRushMode: false,
    rushTimeRemaining: 0,
    bossWarningActive: false,
    miniBossWarningActive: false,
    perfectStreak: 0,
    activePowerUps: {
      hasShield: false,
      slowTimeRemaining: 0,
      doubleScoreRemaining: 0,
      coinMagnetRemaining: 0,
    } as ActivePowerUpState,
    activePowerUpPickup: null as PowerUp | null,
    activeEvent: null as ActiveEvent | null,
    eventCooldownMs: 12000,
    obstaclesSinceEvent: 0,
    obstaclesSincePowerUp: 0,
    currentObstacle: null as Obstacle | null,
    nextObstacleTimer: 0,
    lastSpawnedAction: undefined as Action | undefined,
    player: {
      lane: 0 as -1 | 0 | 1,
      targetLane: 0 as -1 | 0 | 1,
      currentAction: 'RUNNING' as PlayerAction,
      actionProgress: 0,
      invulnerableTime: 0,
      skinId: getEquippedSkin(),
    },
  });

  // Keep stateRef synchronized with React state
  useEffect(() => {
    stateRef.current.gameState = gameState;
    stateRef.current.gameMode = gameMode;
    stateRef.current.score = score;
    stateRef.current.combo = combo;
    stateRef.current.maxCombo = maxCombo;
    stateRef.current.lives = lives;
    stateRef.current.coinsEarnedThisRun = coinsEarnedThisRun;
    stateRef.current.xpEarnedThisRun = xpEarnedThisRun;
    stateRef.current.perfectCount = perfectCount;
    stateRef.current.totalCleared = totalCleared;
    stateRef.current.powerUpsCollected = powerUpsCollected;
    stateRef.current.nearMisses = nearMisses;
    stateRef.current.bossesDefeated = bossesDefeated;
    stateRef.current.feverActive = feverActive;
    stateRef.current.feverProgress = feverProgress;
    stateRef.current.feverTimeRemaining = feverTimeRemaining;
    stateRef.current.isRushMode = isRushMode;
    stateRef.current.rushTimeRemaining = rushTimeRemaining;
    stateRef.current.bossWarningActive = bossWarningActive;
    stateRef.current.miniBossWarningActive = miniBossWarningActive;
    stateRef.current.perfectStreak = perfectStreak;
    stateRef.current.activePowerUps = activePowerUps;
    stateRef.current.activePowerUpPickup = activePowerUpPickup;
    stateRef.current.activeEvent = activeEvent;
    stateRef.current.currentObstacle = currentObstacle;
    stateRef.current.player = player;
  }, [
    gameState,
    score,
    combo,
    maxCombo,
    lives,
    coinsEarnedThisRun,
    xpEarnedThisRun,
    perfectCount,
    totalCleared,
    powerUpsCollected,
    nearMisses,
    bossesDefeated,
    feverActive,
    feverProgress,
    feverTimeRemaining,
    isRushMode,
    rushTimeRemaining,
    bossWarningActive,
    miniBossWarningActive,
    perfectStreak,
    activePowerUps,
    activePowerUpPickup,
    activeEvent,
    currentObstacle,
    player,
  ]);

  // Sync player skinId when equippedSkin changes
  useEffect(() => {
    setPlayer((prev) => ({ ...prev, skinId: equippedSkin }));
    stateRef.current.player.skinId = equippedSkin;
  }, [equippedSkin]);

  // Show Upgraded Reward Popup Helper (Requirement 6: Never covers player or obstacle)
  const triggerRewardPopup = useCallback((data: RewardToastData) => {
    setRewardToastData(data);
    setTimeout(() => {
      setRewardToastData((curr) => (curr?.title === data.title ? null : curr));
    }, 2400);
  }, []);

  // Show Reward Toast Helper (Backwards compatible)
  const triggerRewardToast = useCallback(
    (message: string, coinAmount?: number) => {
      triggerRewardPopup({
        type: coinAmount !== undefined ? 'COINS' : 'GENERIC',
        title: message,
        amount: coinAmount,
      });
    },
    [triggerRewardPopup]
  );

  // Achievement Check Helper
  const checkAchievementUnlock = useCallback((id: AchievementId) => {
    const isNew = saveAchievement(id);
    if (isNew) {
      setUnlockedAchievements(getStoredAchievements());
      const ach = ALL_ACHIEVEMENTS.find((a) => a.id === id);
      if (ach) {
        soundEngine.playAchievement();
        setActiveToastAchievement(ach);
        setTimeout(() => setActiveToastAchievement(null), 3500);
      }
    }
  }, []);

  // Handle Mute Toggle
  const handleToggleMute = useCallback(() => {
    const newMuted = soundEngine.toggleMute();
    setIsMuted(newMuted);
  }, []);

  // Add floating text feedback
  const addFeedback = useCallback(
    (text: string, type: FloatingFeedback['type'] = 'GOOD', subtext?: string, scoreBonus?: number, coinBonus?: number) => {
      const fb: FloatingFeedback = {
        id: `fb_${Date.now()}_${Math.random()}`,
        text,
        subtext,
        scoreBonus,
        coinBonus,
        type,
        yOffset: 0,
        createdAt: performance.now(),
      };
      setFloatingFeedbacks((prev) => [...prev.slice(-4), fb]);
    },
    []
  );

  // Trigger hurt shake & red flash
  const triggerHurtEffect = useCallback(() => {
    setIsHurtShake(true);
    setShowRedFlash(true);
    setTimeout(() => setIsHurtShake(false), 300);
    setTimeout(() => setShowRedFlash(false), 220);
  }, []);

  // Start Playing Flow with GameMode
  const handleStartPlay = (selectedMode: GameMode = 'CLASSIC') => {
    soundEngine.unlockAudio();
    soundEngine.playClick();
    setGameMode(selectedMode);
    stateRef.current.gameMode = selectedMode;
    currentRunEventsRef.current = [];
    setGhostDefeatedState(null);
    prevBiomeIdRef.current = getEnvironmentTheme(0, selectedMode, 0).id;

    if (selectedMode === 'GHOST') {
      const ghost = getGhostRun();
      activeGhostRunRef.current = ghost;
      if (ghost) {
        setGhostPlayer({
          lane: 0,
          targetLane: 0,
          currentAction: 'RUNNING',
          actionProgress: 0,
          invulnerableTime: 0,
          skinId: ghost.skinId || 'classic',
        });
        setGhostScore(0);
      } else {
        setGhostPlayer(null);
        setGhostScore(undefined);
      }
    } else {
      activeGhostRunRef.current = null;
      setGhostPlayer(null);
      setGhostScore(undefined);
    }

    setGameState('COUNTDOWN');
  };

  const handleCountdownComplete = () => {
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setLives(3);
    setCoinsEarnedThisRun(0);
    setXpEarnedThisRun(0);
    setIsNewRecord(false);
    setReactionTimes([]);
    setFastestReactionMs(0);
    setAverageReactionMs(0);
    setTotalCleared(0);
    setPerfectCount(0);
    setPowerUpsCollected(0);
    setNearMisses(0);
    setBossesDefeated(0);
    setFeverActive(false);
    setFeverProgress(0);
    setFeverTimeRemaining(0);
    setIsRushMode(false);
    setRushTimeRemaining(0);
    rushTriggeredRef.current = false;
    setBossWarningActive(false);
    lastBossScoreThresholdRef.current = 0;
    setMiniBossWarningActive(false);
    lastMiniBossScoreThresholdRef.current = 0;
    setPerfectStreak(0);
    setLastReaction(null);
    comboMilestonesClaimedRef.current = { 5: false, 10: false, 20: false };
    scoreMilestonesClaimedRef.current = { 10: false, 25: false, 50: false, 100: false };

    // Reset V5 breakdown and survival metrics
    basePointsSumRef.current = 0;
    perfectBonusSumRef.current = 0;
    comboBonusSumRef.current = 0;
    feverBonusSumRef.current = 0;
    setSurvivalTimeSec(0);
    setScoreBreakdown(undefined);

    setActivePowerUps({
      hasShield: false,
      slowTimeRemaining: 0,
      doubleScoreRemaining: 0,
      coinMagnetRemaining: 0,
    });
    setActivePowerUpPickup(null);
    setRainCoins([]);
    runStartTimeRef.current = performance.now();
    setActiveEvent(null);
    setCurrentObstacle(null);
    setFloatingFeedbacks([]);

    stateRef.current.score = 0;
    stateRef.current.combo = 0;
    stateRef.current.maxCombo = 0;
    stateRef.current.lives = 3;
    stateRef.current.coinsEarnedThisRun = 0;
    stateRef.current.xpEarnedThisRun = 0;
    stateRef.current.perfectCount = 0;
    stateRef.current.totalCleared = 0;
    stateRef.current.powerUpsCollected = 0;
    stateRef.current.nearMisses = 0;
    stateRef.current.bossesDefeated = 0;
    stateRef.current.feverActive = false;
    stateRef.current.feverProgress = 0;
    stateRef.current.feverTimeRemaining = 0;
    stateRef.current.isRushMode = false;
    stateRef.current.rushTimeRemaining = 0;
    stateRef.current.bossWarningActive = false;
    stateRef.current.activePowerUps = {
      hasShield: false,
      slowTimeRemaining: 0,
      doubleScoreRemaining: 0,
      coinMagnetRemaining: 0,
    };
    stateRef.current.activePowerUpPickup = null;
    stateRef.current.activeEvent = null;
    stateRef.current.eventCooldownMs = 12000;
    stateRef.current.obstaclesSinceEvent = 0;
    stateRef.current.obstaclesSincePowerUp = 0;
    stateRef.current.currentObstacle = null;
    stateRef.current.nextObstacleTimer = 350; // Initial delay before 1st obstacle
    stateRef.current.lastSpawnedAction = undefined;
    stateRef.current.player = {
      lane: 0,
      targetLane: 0,
      currentAction: 'RUNNING',
      actionProgress: 0,
      invulnerableTime: 0,
      skinId: equippedSkin,
    };
    setPlayer(stateRef.current.player);

    setGameState('PLAYING');
    soundEngine.startBgm(1.0, false);

    if (stateRef.current.gameMode === 'GHOST') {
      if (activeGhostRunRef.current) {
        addFeedback('GHOST ACTIVE 👻', 'GOOD', `RACE VS BEST: ${activeGhostRunRef.current.finalScore}`);
      } else {
        addFeedback('RECORDING GHOST 👻', 'GOOD', 'Set your benchmark run!');
      }
    }
  };

  // Pause / Resume Handlers
  const handlePause = () => {
    if (gameState === 'PLAYING') {
      soundEngine.stopBgm();
      setGameState('PAUSED');
    }
  };

  const handleResume = () => {
    if (gameState === 'PAUSED') {
      setGameState('PLAYING');
      const diff = getDifficulty(stateRef.current.score);
      soundEngine.startBgm(diff.speedMultiplier, stateRef.current.feverActive);
    }
  };

  const handleGoHome = () => {
    soundEngine.stopBgm();
    if (stateRef.current.coinsEarnedThisRun > 0 && (gameState === 'PLAYING' || gameState === 'PAUSED')) {
      const updatedTotal = addCoins(stateRef.current.coinsEarnedThisRun);
      setCoins(updatedTotal);
      setCoinsEarnedThisRun(0);
      stateRef.current.coinsEarnedThisRun = 0;
    }
    if (stateRef.current.xpEarnedThisRun > 0 && (gameState === 'PLAYING' || gameState === 'PAUSED')) {
      const res = addPlayerXp(stateRef.current.xpEarnedThisRun);
      setPlayerProgression(getPlayerProgression());
      if (res.coinReward > 0) setCoins(getCoins());
      setXpEarnedThisRun(0);
      stateRef.current.xpEarnedThisRun = 0;
    }
    setGameState('MENU');
  };

  // Trigger End Game
  const handleTriggerGameOver = useCallback(() => {
    soundEngine.stopBgm();
    setGameState('GAMEOVER');

    const finalScore = stateRef.current.score;
    const finalMaxCombo = stateRef.current.maxCombo;
    let earnedCoins = stateRef.current.coinsEarnedThisRun;
    const totalAvoided = stateRef.current.totalCleared;
    const perfectsInGame = stateRef.current.perfectCount;
    const finalPowerUps = stateRef.current.powerUpsCollected;
    const finalNearMisses = stateRef.current.nearMisses;
    const finalBosses = stateRef.current.bossesDefeated;
    const runDurationSec = (performance.now() - (runStartTimeRef.current || performance.now())) / 1000;
    const currentMode = stateRef.current.gameMode;

    // Endless Mode Survival Coin Bonus & Record Tracking
    let survivalBonusCoins = 0;
    if (currentMode === 'ENDLESS') {
      survivalBonusCoins = Math.floor(runDurationSec / 5) * 2;
      earnedCoins += survivalBonusCoins;
      saveEndlessBestScore(finalScore);
      saveEndlessBestSurvival(runDurationSec);
    }

    // Ghost Mode Rewards & Record Beating (Requirement 4 & 6)
    let beatGhost = false;
    let isCrushed = false;
    const ghostBenchmark = activeGhostRunRef.current?.finalScore ?? getGhostRun()?.finalScore;
    let ghostTargetScore = ghostBenchmark;
    let ghostCoinBonus = 0;
    let ghostXpBonus = 0;

    if (currentMode === 'GHOST' && typeof ghostTargetScore === 'number') {
      if (finalScore > ghostTargetScore) {
        beatGhost = true;
        isCrushed = (finalScore - ghostTargetScore) >= 5;
        ghostCoinBonus = isCrushed ? 40 : 25; // +25 coins base, +15 if crushed
        ghostXpBonus = isCrushed ? 75 : 50;   // +50 XP base, +25 if crushed
        earnedCoins += ghostCoinBonus;
        stateRef.current.xpEarnedThisRun += ghostXpBonus;
        soundEngine.playMilestone();
        setIsNewRecord(true);
        triggerRewardToast(
          isCrushed ? '👻 GHOST CRUSHED! (+40 🪙, +75 XP)' : '👻 GHOST DEFEATED! (+25 🪙, +50 XP)',
          ghostCoinBonus
        );
      }
    }

    setGhostDefeatedState({
      beatGhost,
      isCrushed,
      ghostTargetScore,
      ghostCoinBonus,
      ghostXpBonus,
    });

    // Persist coins earned to user vault
    if (earnedCoins > 0) {
      const updatedTotal = addCoins(earnedCoins);
      setCoins(updatedTotal);
    }

    // Score Breakdown for Game Over Screen
    const breakdown: ScoreBreakdown = {
      finalScore,
      baseScore: basePointsSumRef.current > 0 ? basePointsSumRef.current : totalAvoided,
      perfectBonus: perfectBonusSumRef.current > 0 ? perfectBonusSumRef.current : perfectsInGame * 2,
      comboBonus: comboBonusSumRef.current > 0 ? comboBonusSumRef.current : Math.max(0, Math.floor(finalMaxCombo * 1.5)),
      feverBonus: feverBonusSumRef.current,
      coinsEarned: earnedCoins,
      survivalBonusCoins,
      survivalTimeSec: runDurationSec,
    };
    setScoreBreakdown(breakdown);

    // Update Career Stats
    recordGameStats(
      perfectsInGame,
      totalAvoided,
      finalPowerUps,
      finalNearMisses,
      finalBosses,
      finalBosses,
      runDurationSec
    );
    setUserStats(getUserStats());

    // Check V4 achievements on run end
    if (finalNearMisses >= 10 || getUserStats().totalNearMisses >= 10) checkAchievementUnlock('close_call');
    if (finalPowerUps >= 25 || getUserStats().totalPowerUpsCollected >= 25) checkAchievementUnlock('power_player');
    if (finalBosses >= 3 || getUserStats().bossesDefeated >= 3) checkAchievementUnlock('boss_hunter');
    if (finalMaxCombo >= 20) checkAchievementUnlock('untouchable');
    if (finalScore >= 100) checkAchievementUnlock('legend');

    // Update Daily Challenge Progress
    const wasDailyCompleted = dailyChallenge.completed;
    const updatedDaily = updateDailyChallengeProgress(finalScore, perfectsInGame, finalMaxCombo, totalAvoided);
    setDailyChallenge({ ...updatedDaily });
    if (!wasDailyCompleted && updatedDaily.completed) {
      soundEngine.playMilestone();
      triggerRewardPopup({
        type: 'DAILY_REWARD',
        title: 'DAILY CHALLENGE COMPLETED!',
        subtitle: `+${updatedDaily.rewardCoins} 🪙`,
      });
    }

    // Update Missions Progress
    const { missions: updatedMissions, newlyCompleted } = updateMissionsProgress(finalScore, perfectsInGame, finalMaxCombo);
    setMissions([...updatedMissions]);
    if (newlyCompleted.length > 0) {
      soundEngine.playMilestone();
      triggerRewardToast(`MISSION COMPLETED: ${newlyCompleted[0].title}!`);
    }

    // Update Challenge Mode Progress
    if (currentMode === 'CHALLENGE' && activeChallengeId !== null) {
      const activeC = challenges.find((c) => c.id === activeChallengeId);
      if (activeC && !activeC.completed) {
        const { isMet } = checkChallengeGoalProgress(activeC, {
          score: finalScore,
          lives: stateRef.current.lives,
          perfectCount: perfectsInGame,
          maxCombo: finalMaxCombo,
          survivalTimeSec: runDurationSec,
          bossesDefeated: finalBosses,
          coinsEarnedThisRun: earnedCoins,
          nearMisses: finalNearMisses,
        });
        if (isMet) {
          const res = completeChallenge(activeC.id);
          if (res.success) {
            setChallenges(getChallenges());
            soundEngine.playMilestone();
            const cXp = addPlayerXp(25);
            setPlayerProgression(getPlayerProgression());
            if (cXp.coinReward > 0) setCoins(getCoins());
            if (cXp.leveledUp) {
              setLevelUpModalData({
                level: cXp.newLevel,
                coinReward: cXp.coinReward,
                unlockedTitle: cXp.newlyUnlockedTitles[0] ? TITLES[cXp.newlyUnlockedTitles[0]]?.name : null,
              });
            }
            triggerRewardPopup({
              type: 'CHALLENGE_COMPLETE',
              title: 'CHALLENGE COMPLETED!',
              subtitle: `${res.challengeTitle} · +${res.coinsAwarded} 🪙 · +25 XP`,
            });
          }
        }
      }
    }

    // Process XP Earned This Run & Level Up (Requirement 1, 2, 4, 10)
    const runXp = stateRef.current.xpEarnedThisRun;
    if (runXp > 0) {
      const xpRes = addPlayerXp(runXp);
      setPlayerProgression(getPlayerProgression());
      if (xpRes.coinReward > 0) {
        setCoins(getCoins());
      }
      if (xpRes.leveledUp) {
        const unlockedTitleName = xpRes.newlyUnlockedTitles[0]
          ? TITLES[xpRes.newlyUnlockedTitles[0]]?.name
          : null;
        setLevelUpModalData({
          level: xpRes.newLevel,
          coinReward: xpRes.coinReward,
          unlockedTitle: unlockedTitleName,
        });
        triggerRewardPopup({
          type: 'LEVEL_UP',
          title: `LEVEL UP! LEVEL ${xpRes.newLevel}`,
          subtitle: `+${xpRes.coinReward} Bonus Coins`,
        });
      }
      if (xpRes.newlyUnlockedTitles.length > 0) {
        xpRes.newlyUnlockedTitles.forEach((titleId) => {
          const tInfo = TITLES[titleId];
          triggerRewardPopup({
            type: 'NEW_TITLE',
            title: 'NEW TITLE UNLOCKED!',
            subtitle: `★ ${tInfo?.name || titleId} ★`,
          });
        });
      }
    }

    // Check Player Rank Promotion
    const oldBest = bestScore;
    const newBest = Math.max(oldBest, finalScore);
    if (hasRankedUp(oldBest, finalScore)) {
      const oldRank = getRankForScore(oldBest);
      const newRank = getRankForScore(finalScore);
      setRankUpData({
        previousRank: oldRank,
        newRank,
        score: finalScore,
      });
    }

    // Automatically update player's local leaderboard score
    updatePlayerLeaderboardScore(newBest, currentMode);

    // Check high score & personal record (Requirement 6)
    if (finalScore > bestScore || (currentMode === 'GHOST' && beatGhost)) {
      const updatedBest = Math.max(bestScore, finalScore);
      setBestScore(updatedBest);
      setIsNewRecord(true);
      saveBestScore(updatedBest);
      triggerRewardPopup({
        type: 'NEW_RECORD',
        title: '★ NEW RECORD! ★',
        subtitle: `Score: ${updatedBest}`,
      });
    }
    if (finalMaxCombo > bestCombo) {
      setBestCombo(finalMaxCombo);
      saveBestCombo(finalMaxCombo);
    }

    // Save or update Ghost benchmark run
    const prevGhost = getGhostRun();
    if (currentRunEventsRef.current.length > 0 && (!prevGhost || finalScore >= prevGhost.finalScore)) {
      saveGhostRun({
        id: `ghost_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        finalScore,
        survivalTimeSec: Math.round(runDurationSec),
        skinId: equippedSkin,
        events: currentRunEventsRef.current,
      });
    }
  }, [
    bestScore,
    bestCombo,
    triggerRewardToast,
    triggerRewardPopup,
    checkAchievementUnlock,
    dailyChallenge,
    challenges,
    activeChallengeId,
  ]);

  // Collect Approaching Power-Up Pickup
  const handleCollectPowerUp = useCallback((id?: string) => {
    const pickup = stateRef.current.activePowerUpPickup;
    if (!pickup || pickup.collected) return;
    if (id && pickup.id !== id) return;

    pickup.collected = true;
    setActivePowerUpPickup(null);
    stateRef.current.activePowerUpPickup = null;

    soundEngine.playPowerUp();
    setPowerUpsCollected((c) => c + 1);
    stateRef.current.powerUpsCollected += 1;

    const pType = pickup.type;
    const currentPU: ActivePowerUpState = { ...stateRef.current.activePowerUps };

    if (pType === 'SHIELD') {
      currentPU.hasShield = true;
      addFeedback('SHIELD ACTIVE', 'POWERUP', '+1 SHIELD');
    } else if (pType === 'SLOW_TIME') {
      currentPU.slowTimeRemaining = 5000;
      addFeedback('SLOW TIME', 'POWERUP', '5s DURATION');
    } else if (pType === 'DOUBLE_SCORE') {
      currentPU.doubleScoreRemaining = 8000;
      addFeedback('DOUBLE SCORE', 'POWERUP', '2X POINTS');
    } else if (pType === 'EXTRA_LIFE') {
      if (stateRef.current.lives < 3) {
        const newL = stateRef.current.lives + 1;
        setLives(newL);
        stateRef.current.lives = newL;
        addFeedback('EXTRA LIFE', 'POWERUP', '+1 LIFE');
      } else {
        const bonusCoins = 10;
        const newRunCoins = stateRef.current.coinsEarnedThisRun + bonusCoins;
        setCoinsEarnedThisRun(newRunCoins);
        stateRef.current.coinsEarnedThisRun = newRunCoins;
        addFeedback('FULL LIVES', 'POWERUP', '+10 COINS', 0, bonusCoins);
      }
    } else if (pType === 'COIN_MAGNET') {
      currentPU.coinMagnetRemaining = 8000;
      addFeedback('COIN MAGNET', 'POWERUP', '8s DURATION');
    }

    setActivePowerUps(currentPU);
    stateRef.current.activePowerUps = currentPU;

    const stats = getUserStats();
    if (stats.totalPowerUpsCollected + stateRef.current.powerUpsCollected >= 25) {
      checkAchievementUnlock('power_player');
    }
  }, [addFeedback, checkAchievementUnlock]);

  // Collect Rain Coin
  const handleCollectRainCoin = useCallback((coinId: string) => {
    setRainCoins((prev) => {
      const idx = prev.findIndex((c) => c.id === coinId);
      if (idx !== -1 && !prev[idx].collected) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], collected: true };
        soundEngine.playCoin();
        const newRunCoins = stateRef.current.coinsEarnedThisRun + 1;
        setCoinsEarnedThisRun(newRunCoins);
        stateRef.current.coinsEarnedThisRun = newRunCoins;
        return updated;
      }
      return prev;
    });
  }, []);

  // Handle Miss / Timeout Penalty
  const handleMiss = useCallback(
    (reason: 'TIMEOUT' | 'WRONG_ACTION') => {
      // 1. Check if Shield is active:
      if (stateRef.current.activePowerUps.hasShield) {
        const updatedPU: ActivePowerUpState = { ...stateRef.current.activePowerUps, hasShield: false };
        setActivePowerUps(updatedPU);
        stateRef.current.activePowerUps = updatedPU;

        soundEngine.playShieldBlock();
        addFeedback('🛡️ SHIELD BLOCKED DAMAGE!', 'POWERUP', 'Mistake absorbed!');

        // Clear current obstacle and grant recovery window
        setCurrentObstacle(null);
        stateRef.current.currentObstacle = null;
        stateRef.current.nextObstacleTimer = 550;
        return;
      }

      soundEngine.playHit();
      triggerHurtEffect();

      const newLives = stateRef.current.lives - 1;
      setLives(newLives);
      stateRef.current.lives = newLives;

      // Reset Combo on mistake
      setCombo(0);
      stateRef.current.combo = 0;
      comboMilestonesClaimedRef.current = { 5: false, 10: false, 20: false };

      // Reset Perfect Streak on mistake (Requirement 4)
      setPerfectStreak(0);
      stateRef.current.perfectStreak = 0;

      // Mistake immediately ends Fever Mode
      if (stateRef.current.feverActive) {
        setFeverActive(false);
        stateRef.current.feverActive = false;
        setFeverProgress(0);
        stateRef.current.feverProgress = 0;
        setFeverTimeRemaining(0);
        stateRef.current.feverTimeRemaining = 0;
        soundEngine.startBgm(1.0, false);
      }

      // Add feedback
      addFeedback(reason === 'TIMEOUT' ? 'TIMEOUT!' : 'WRONG ACTION!', 'MISS', '-1 LIFE');

      // Hurt runner animation & invulnerability
      const updatedPlayer: Player = {
        ...stateRef.current.player,
        currentAction: 'HURT',
        actionProgress: 0,
        invulnerableTime: 850,
      };
      setPlayer(updatedPlayer);
      stateRef.current.player = updatedPlayer;

      // Clear current obstacle
      setCurrentObstacle(null);
      stateRef.current.currentObstacle = null;

      if (newLives <= 0) {
        handleTriggerGameOver();
      } else {
        // Cooldown before next obstacle spawns
        stateRef.current.nextObstacleTimer = 750;
      }
    },
    [addFeedback, triggerHurtEffect, handleTriggerGameOver]
  );

  // Player Action Execution (JUMP, SLIDE, LEFT, RIGHT)
  const handlePlayerAction = useCallback(
    (action: Action) => {
      if (stateRef.current.gameState !== 'PLAYING') return;

      const p = stateRef.current.player;
      if (p.invulnerableTime > 400) return; // Brief immunity buffer after hurt

      const curRunTime = performance.now() - (runStartTimeRef.current || performance.now());
      let actLane: -1 | 0 | 1 = p.lane;
      if (action === 'LEFT') actLane = -1;
      else if (action === 'RIGHT') actLane = 1;
      currentRunEventsRef.current.push({
        t: Math.round(curRunTime),
        a: action,
        l: actLane,
        s: stateRef.current.score,
      });

      const obs = stateRef.current.currentObstacle;
      if (!obs || obs.cleared || obs.failed) {
        // No obstacle on screen, animate player move anyway for crisp responsive feel
        const nextAction: PlayerAction =
          action === 'JUMP'
            ? 'JUMPING'
            : action === 'SLIDE'
            ? 'SLIDING'
            : action === 'LEFT'
            ? 'DODGE_LEFT'
            : 'DODGE_RIGHT';

        if (action === 'JUMP') soundEngine.playJump();
        else if (action === 'SLIDE') soundEngine.playSlide();
        else soundEngine.playDodge(action);

        let targetLane = p.lane;
        if (action === 'LEFT') targetLane = Math.max(-1, p.lane - 1) as -1 | 0 | 1;
        if (action === 'RIGHT') targetLane = Math.min(1, p.lane + 1) as -1 | 0 | 1;

        const updated: Player = {
          ...p,
          lane: targetLane,
          targetLane,
          currentAction: nextAction,
          actionProgress: 0,
        };
        setPlayer(updated);
        stateRef.current.player = updated;
        return;
      }

      // Check if current obstacle is a Boss Obstacle:
      if (obs.isBoss && obs.bossSteps) {
        const stepIdx = obs.bossCurrentStepIndex || 0;
        const requiredAction = obs.bossSteps[stepIdx];

        if (action === requiredAction) {
          // Play action sound & animate runner
          if (action === 'JUMP') soundEngine.playJump();
          else if (action === 'SLIDE') soundEngine.playSlide();
          else soundEngine.playDodge(action);

          let targetLane = p.lane;
          if (action === 'LEFT') targetLane = -1;
          else if (action === 'RIGHT') targetLane = 1;
          else targetLane = 0;

          const updated: Player = {
            ...p,
            lane: targetLane,
            targetLane,
            currentAction: action === 'JUMP' ? 'JUMPING' : action === 'SLIDE' ? 'SLIDING' : action === 'LEFT' ? 'DODGE_LEFT' : 'DODGE_RIGHT',
            actionProgress: 0,
          };
          setPlayer(updated);
          stateRef.current.player = updated;

          if (stepIdx < 2) {
            // Next Boss step!
            obs.bossCurrentStepIndex = stepIdx + 1;
            obs.remainingTime = obs.timeLimit;
            setCurrentObstacle({ ...obs });
            soundEngine.playSuccess(stateRef.current.combo);
            addFeedback(`BOSS STEP ${stepIdx + 1}/3 CLEARED! ➔`, 'GOOD');
            return;
          }

          // FULL BOSS DEFEATED!
          obs.cleared = true;
          setCurrentObstacle({ ...obs });
          soundEngine.playBossVictory();

          try {
            confetti({
              particleCount: 85,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#ef4444', '#f59e0b', '#ec4899', '#38bdf8'],
            });
          } catch {
            // Ignore confetti error
          }

          const bossPts = 20;
          const bossCoins = 30;
          const bossXp = 50;
          const newScore = stateRef.current.score + bossPts;
          setScore(newScore);
          stateRef.current.score = newScore;

          const newRunCoins = stateRef.current.coinsEarnedThisRun + bossCoins;
          setCoinsEarnedThisRun(newRunCoins);
          stateRef.current.coinsEarnedThisRun = newRunCoins;

          stateRef.current.xpEarnedThisRun += bossXp;
          setXpEarnedThisRun(stateRef.current.xpEarnedThisRun);

          const newCombo = stateRef.current.combo + 3;
          setCombo(newCombo);
          stateRef.current.combo = newCombo;
          if (newCombo > stateRef.current.maxCombo) {
            setMaxCombo(newCombo);
            stateRef.current.maxCombo = newCombo;
          }

          setBossesDefeated((b) => b + 1);
          stateRef.current.bossesDefeated += 1;

          addFeedback('★ BOSS CRUSHED! ★', 'BOSS', `+${bossPts} PTS · +${bossCoins} COINS · +3 COMBO!`, bossPts, bossCoins);

          const stats = getUserStats();
          if (stats.bossesDefeated + stateRef.current.bossesDefeated >= 3) {
            checkAchievementUnlock('boss_hunter');
          }
          if (newScore >= 50) checkAchievementUnlock('speed_demon');
          if (newScore >= 100) checkAchievementUnlock('legend');

          stateRef.current.nextObstacleTimer = 900;
          return;
        } else {
          // Wrong action against Boss!
          handleMiss('WRONG_ACTION');
          return;
        }
      }

      // Check if current obstacle is a Mini Boss Obstacle (Requirement 3: 2-action sequence)
      if (obs.isMiniBoss && obs.miniBossSteps) {
        const stepIdx = obs.miniBossCurrentStepIndex || 0;
        const requiredAction = obs.miniBossSteps[stepIdx];

        if (action === requiredAction) {
          if (action === 'JUMP') soundEngine.playJump();
          else if (action === 'SLIDE') soundEngine.playSlide();
          else soundEngine.playDodge(action);

          let targetLane = p.lane;
          if (action === 'LEFT') targetLane = -1;
          else if (action === 'RIGHT') targetLane = 1;
          else targetLane = 0;

          const updated: Player = {
            ...p,
            lane: targetLane,
            targetLane,
            currentAction: action === 'JUMP' ? 'JUMPING' : action === 'SLIDE' ? 'SLIDING' : action === 'LEFT' ? 'DODGE_LEFT' : 'DODGE_RIGHT',
            actionProgress: 0,
          };
          setPlayer(updated);
          stateRef.current.player = updated;

          if (stepIdx < 1) {
            // Next Mini Boss step!
            obs.miniBossCurrentStepIndex = stepIdx + 1;
            obs.remainingTime = obs.timeLimit;
            setCurrentObstacle({ ...obs });
            soundEngine.playSuccess(stateRef.current.combo);
            addFeedback('MINI BOSS STEP 1/2! ➔', 'GOOD');
            return;
          }

          // FULL MINI BOSS DEFEATED!
          obs.cleared = true;
          setCurrentObstacle({ ...obs });
          soundEngine.playBossVictory();

          try {
            confetti({
              particleCount: 65,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#f97316', '#fbbf24', '#38bdf8', '#ec4899'],
            });
          } catch {
            // Ignore confetti error
          }

          const miniBossPts = 10;
          const miniBossCoins = 15;
          const miniBossXp = 25;
          const newScore = stateRef.current.score + miniBossPts;
          setScore(newScore);
          stateRef.current.score = newScore;

          const newRunCoins = stateRef.current.coinsEarnedThisRun + miniBossCoins;
          setCoinsEarnedThisRun(newRunCoins);
          stateRef.current.coinsEarnedThisRun = newRunCoins;

          stateRef.current.xpEarnedThisRun += miniBossXp;
          setXpEarnedThisRun(stateRef.current.xpEarnedThisRun);

          const newCombo = stateRef.current.combo + 2;
          setCombo(newCombo);
          stateRef.current.combo = newCombo;
          if (newCombo > stateRef.current.maxCombo) {
            setMaxCombo(newCombo);
            stateRef.current.maxCombo = newCombo;
          }

          setBossesDefeated((b) => b + 1);
          stateRef.current.bossesDefeated += 1;

          addFeedback('MINI BOSS DEFEATED', 'MINIBOSS', `+${miniBossPts} PTS · +${miniBossCoins}🪙`, miniBossPts, miniBossCoins);

          const stats = getUserStats();
          if (stats.bossesDefeated + stateRef.current.bossesDefeated >= 3) {
            checkAchievementUnlock('boss_hunter');
          }

          stateRef.current.nextObstacleTimer = 850;
          return;
        } else {
          // Wrong action against Mini Boss: lose 1 life and continue game
          handleMiss('WRONG_ACTION');
          return;
        }
      }

      // Current required target
      const requiredTarget =
        obs.isTwoStep && obs.currentStep === 2 && obs.secondAction ? obs.secondAction : obs.action;

      if (action === requiredTarget) {
        // CORRECT ACTION!
        const reactionMs = Math.round(obs.timeLimit - obs.remainingTime);

        // Sound effect for action
        if (action === 'JUMP') soundEngine.playJump();
        else if (action === 'SLIDE') soundEngine.playSlide();
        else soundEngine.playDodge(action);

        // Animate runner
        const nextAction: PlayerAction =
          action === 'JUMP'
            ? 'JUMPING'
            : action === 'SLIDE'
            ? 'SLIDING'
            : action === 'LEFT'
            ? 'DODGE_LEFT'
            : 'DODGE_RIGHT';

        let targetLane = p.lane;
        if (action === 'LEFT') targetLane = -1;
        else if (action === 'RIGHT') targetLane = 1;
        else targetLane = 0;

        const updated: Player = {
          ...p,
          lane: targetLane,
          targetLane,
          currentAction: nextAction,
          actionProgress: 0,
        };
        setPlayer(updated);
        stateRef.current.player = updated;

        // Check if two-step pattern and on Step 1
        if (obs.isTwoStep && obs.currentStep === 1) {
          obs.currentStep = 2;
          const step2Time = Math.max(620, Math.round(obs.timeLimit * 0.85));
          obs.timeLimit = step2Time;
          obs.remainingTime = step2Time;
          setCurrentObstacle({ ...obs });

          soundEngine.playSuccess(stateRef.current.combo, stateRef.current.feverActive);
          addFeedback('STEP 1 CLEAR! ➔', 'GOOD', `${reactionMs}ms`);
          return;
        }

        // FULL OBSTACLE CLEARED!
        obs.cleared = true;
        setCurrentObstacle({ ...obs });
        stateRef.current.totalCleared += 1;
        setTotalCleared((c) => c + 1);

        // PERFECT REACTION CALCULATION:
        const isPerfect = reactionMs <= Math.min(380, obs.timeLimit * 0.38);

        // NEAR-MISS CALCULATION:
        // Action performed at the last possible moment (within last 20% or <= 190ms)
        const timeRatio = obs.remainingTime / obs.timeLimit;
        const isNearMiss = timeRatio <= 0.20 || obs.remainingTime <= 190;

        if (isNearMiss) {
          soundEngine.playNearMiss();
          setNearMisses((n) => n + 1);
          stateRef.current.nearMisses += 1;
          const stats = getUserStats();
          if (stats.totalNearMisses + stateRef.current.nearMisses >= 10) {
            checkAchievementUnlock('close_call');
          }
        }

        // Score Multipliers:
        let basePts = isPerfect ? 3 : 1;
        if (isNearMiss) basePts += 2; // Near-miss bonus score
        if (stateRef.current.feverActive) basePts *= 2;
        if (stateRef.current.activePowerUps.doubleScoreRemaining > 0) basePts *= 2;
        if (stateRef.current.activeEvent?.type === 'DOUBLE_SCORE') basePts *= 2;
        if (stateRef.current.isRushMode) basePts *= 2; // Rush Mode double score multiplier

        const newScore = stateRef.current.score + basePts;
        setScore(newScore);
        stateRef.current.score = newScore;

        // V5 Accumulate Score Breakdown components
        basePointsSumRef.current += 1;
        if (isPerfect) perfectBonusSumRef.current += 2;
        if (stateRef.current.combo >= 2) comboBonusSumRef.current += Math.max(0, basePts - 1 - (isPerfect ? 2 : 0));
        if (stateRef.current.feverActive) feverBonusSumRef.current += Math.max(0, Math.floor(basePts / 2));

        // COIN EARNINGS:
        // Base: Normal = 1 coin, Perfect = 3 coins
        // Near Miss: +2 bonus coins
        // Coin Magnet: +2 bonus coins
        // Fever Mode: 2x coins
        // Rush Mode: 2x coins
        let earnedCoins = isPerfect ? 3 : 1;
        if (isNearMiss) earnedCoins += 2;
        if (stateRef.current.activePowerUps.coinMagnetRemaining > 0) earnedCoins += 2;
        if (stateRef.current.feverActive) earnedCoins *= 2;
        if (stateRef.current.isRushMode) earnedCoins *= 2;
        if (stateRef.current.activeEvent?.type === 'SPEED_BURST') earnedCoins *= 2;

        const newRunCoins = stateRef.current.coinsEarnedThisRun + earnedCoins;
        setCoinsEarnedThisRun(newRunCoins);
        stateRef.current.coinsEarnedThisRun = newRunCoins;

        // XP EARNINGS (Requirement 1: Correct action +5 XP, Perfect +10 XP, Near Miss +15 XP)
        const actionXp = isNearMiss ? 15 : isPerfect ? 10 : 5;
        stateRef.current.xpEarnedThisRun += actionXp;
        setXpEarnedThisRun(stateRef.current.xpEarnedThisRun);

        // Play coin sound
        soundEngine.playCoin();

        // Perfect count tracking & achievement
        if (isPerfect) {
          const newPerfectCount = stateRef.current.perfectCount + 1;
          setPerfectCount(newPerfectCount);
          stateRef.current.perfectCount = newPerfectCount;
          if (newPerfectCount >= 5) {
            checkAchievementUnlock('fast_hands');
          }
        }

        // Check score achievements
        if (newScore >= 10) checkAchievementUnlock('first_step');
        if (newScore >= 30) checkAchievementUnlock('survivor');
        if (newScore >= 50) checkAchievementUnlock('speed_demon');
        if (newScore >= 100) checkAchievementUnlock('legend');

        // Update Combo (Near Miss gives +1 extra combo increase)
        const comboBoost = isNearMiss ? 2 : 1;
        const newCombo = stateRef.current.combo + comboBoost;
        setCombo(newCombo);
        stateRef.current.combo = newCombo;
        if (newCombo > stateRef.current.maxCombo) {
          setMaxCombo(newCombo);
          stateRef.current.maxCombo = newCombo;
        }

        // COMBO REWARDS:
        // x5 combo -> +5 coins
        // x10 combo -> +10 coins
        // x20 combo -> +20 coins
        if (newCombo >= 5 && !comboMilestonesClaimedRef.current[5]) {
          comboMilestonesClaimedRef.current[5] = true;
          const bonusCoins5 = 5;
          const updatedCoins = stateRef.current.coinsEarnedThisRun + bonusCoins5;
          setCoinsEarnedThisRun(updatedCoins);
          stateRef.current.coinsEarnedThisRun = updatedCoins;
          soundEngine.playCoin();
          addFeedback('COMBO x5 REWARD!', 'COIN', `+${bonusCoins5} BONUS COINS! 🪙`, 0, bonusCoins5);
        }

        if (newCombo >= 10 && !comboMilestonesClaimedRef.current[10]) {
          comboMilestonesClaimedRef.current[10] = true;
          const bonusCoins10 = 10;
          const updatedCoins = stateRef.current.coinsEarnedThisRun + bonusCoins10;
          setCoinsEarnedThisRun(updatedCoins);
          stateRef.current.coinsEarnedThisRun = updatedCoins;
          soundEngine.playCoin();
          addFeedback('COMBO x10 REWARD!', 'COIN', `+${bonusCoins10} BONUS COINS! 🪙`, 0, bonusCoins10);
        }

        if (newCombo >= 20 && !comboMilestonesClaimedRef.current[20]) {
          comboMilestonesClaimedRef.current[20] = true;
          const bonusCoins20 = 20;
          const updatedCoins = stateRef.current.coinsEarnedThisRun + bonusCoins20;
          setCoinsEarnedThisRun(updatedCoins);
          stateRef.current.coinsEarnedThisRun = updatedCoins;
          soundEngine.playCoin();
          addFeedback('COMBO x20 GODLIKE!', 'COIN', `+${bonusCoins20} BONUS COINS! 🪙`, 0, bonusCoins20);
          checkAchievementUnlock('untouchable');
        }

        // Fever Mode activation at x10 combo
        if (newCombo >= 10) {
          checkAchievementUnlock('combo_master');
          if (!stateRef.current.feverActive) {
            setFeverActive(true);
            stateRef.current.feverActive = true;
            setFeverTimeRemaining(10000); // 10 seconds Fever duration
            stateRef.current.feverTimeRemaining = 10000;
            soundEngine.playFeverActivate();
            soundEngine.startBgm(1.35, true);
            addFeedback('FEVER MODE', 'FEVER', '2X MULTIPLIER');
          }
        }

        // RUSH MODE TRIGGER: When player reaches 40 score
        if (newScore >= 40 && !rushTriggeredRef.current) {
          rushTriggeredRef.current = true;
          setIsRushMode(true);
          setRushTimeRemaining(10000); // 10 seconds Rush Mode
          stateRef.current.isRushMode = true;
          stateRef.current.rushTimeRemaining = 10000;
          soundEngine.playRushMode();
          addFeedback('RUSH MODE', 'RUSH', '1.3X SPEED');
        }

        // MINI BOSS & BOSS OBSTACLE TRIGGER: Every 25 score in CLASSIC or CHALLENGE mode (Requirement 3)
        const nextThreshold25 = Math.floor(newScore / 25) * 25;
        if (
          stateRef.current.gameMode !== 'ENDLESS' &&
          nextThreshold25 >= 25 &&
          nextThreshold25 > lastMiniBossScoreThresholdRef.current
        ) {
          lastMiniBossScoreThresholdRef.current = nextThreshold25;

          if (nextThreshold25 % 50 === 0 && stateRef.current.gameMode === 'CLASSIC') {
            // Full 3-Step Boss at 50, 100, 150...
            setBossWarningActive(true);
            stateRef.current.bossWarningActive = true;
            soundEngine.playBossAlert();
            addFeedback('BOSS INCOMING', 'BOSS', '3-STEP SEQUENCE');

            setTimeout(() => {
              if (stateRef.current.gameState === 'PLAYING') {
                setBossWarningActive(false);
                stateRef.current.bossWarningActive = false;
                const boss = generateBossObstacle();
                setCurrentObstacle(boss);
                stateRef.current.currentObstacle = boss;
              }
            }, 1200);
          } else {
            // 2-Action Mini Boss every 25 score (25, 75, 125, etc.)
            setMiniBossWarningActive(true);
            stateRef.current.miniBossWarningActive = true;
            soundEngine.playBossAlert();
            addFeedback('MINI BOSS INCOMING', 'MINIBOSS', '2-STEP SEQUENCE');

            setTimeout(() => {
              if (stateRef.current.gameState === 'PLAYING') {
                setMiniBossWarningActive(false);
                stateRef.current.miniBossWarningActive = false;
                const mb = generateMiniBossObstacle();
                setCurrentObstacle(mb);
                stateRef.current.currentObstacle = mb;
              }
            }, 1100);
          }
        }

        // Milestone Coin Rewards (Requirement 8: 10->+5, 25->+10, 50->+25, 100->+50)
        if (newScore >= 10 && !scoreMilestonesClaimedRef.current[10]) {
          scoreMilestonesClaimedRef.current[10] = true;
          const m10 = 5;
          const updatedCoins = stateRef.current.coinsEarnedThisRun + m10;
          setCoinsEarnedThisRun(updatedCoins);
          stateRef.current.coinsEarnedThisRun = updatedCoins;
          soundEngine.playCoin();
          addFeedback('MILESTONE: 10 PTS!', 'COIN', `+${m10} BONUS COINS! 🪙`, 0, m10);
        }
        if (newScore >= 25 && !scoreMilestonesClaimedRef.current[25]) {
          scoreMilestonesClaimedRef.current[25] = true;
          const m25 = 10;
          const updatedCoins = stateRef.current.coinsEarnedThisRun + m25;
          setCoinsEarnedThisRun(updatedCoins);
          stateRef.current.coinsEarnedThisRun = updatedCoins;
          soundEngine.playCoin();
          addFeedback('MILESTONE: 25 PTS!', 'COIN', `+${m25} BONUS COINS! 🪙`, 0, m25);
        }
        if (newScore >= 50 && !scoreMilestonesClaimedRef.current[50]) {
          scoreMilestonesClaimedRef.current[50] = true;
          const m50 = 25;
          const updatedCoins = stateRef.current.coinsEarnedThisRun + m50;
          setCoinsEarnedThisRun(updatedCoins);
          stateRef.current.coinsEarnedThisRun = updatedCoins;
          soundEngine.playCoin();
          addFeedback('MILESTONE: 50 PTS!', 'COIN', `+${m50} BONUS COINS! 🪙`, 0, m50);
        }
        if (newScore >= 100 && !scoreMilestonesClaimedRef.current[100]) {
          scoreMilestonesClaimedRef.current[100] = true;
          const m100 = 50;
          const updatedCoins = stateRef.current.coinsEarnedThisRun + m100;
          setCoinsEarnedThisRun(updatedCoins);
          stateRef.current.coinsEarnedThisRun = updatedCoins;
          soundEngine.playCoin();
          addFeedback('MILESTONE: 100 PTS!', 'COIN', `+${m100} BONUS COINS! 🪙`, 0, m100);
        }

        // Track consecutive Perfect reactions (Requirement 4)
        if (isPerfect) {
          const newStreak = (stateRef.current.perfectStreak || 0) + 1;
          setPerfectStreak(newStreak);
          stateRef.current.perfectStreak = newStreak;

          if (newStreak === 5) {
            const bonusCoins5 = 15;
            const updated = stateRef.current.coinsEarnedThisRun + bonusCoins5;
            setCoinsEarnedThisRun(updated);
            stateRef.current.coinsEarnedThisRun = updated;
            soundEngine.playCoin();
            try {
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.65 },
                colors: ['#fbbf24', '#f59e0b', '#f97316'],
              });
            } catch {}
            addFeedback('🔥 PERFECT x5 STREAK!', 'PERFECT_STREAK', `+${bonusCoins5} BONUS COINS! 🪙`, 0, bonusCoins5);
          } else if (newStreak === 10) {
            const bonusCoins10 = 30;
            const updated = stateRef.current.coinsEarnedThisRun + bonusCoins10;
            setCoinsEarnedThisRun(updated);
            stateRef.current.coinsEarnedThisRun = updated;
            soundEngine.playFeverActivate();
            try {
              confetti({
                particleCount: 85,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#fbbf24', '#fef08a', '#ffffff', '#ec4899', '#38bdf8'],
              });
            } catch {}
            addFeedback('⚡ PERFECT x10 GODLIKE STREAK! ⚡', 'PERFECT_STREAK', `+${bonusCoins10} COINS & HYPER SPEED!`, 0, bonusCoins10);
          }
        } else {
          setPerfectStreak(0);
          stateRef.current.perfectStreak = 0;
        }

        // Brief Reaction Time Display (Requirement 6)
        const timeSec = (reactionMs / 1000).toFixed(2) + 's';
        const grade = isPerfect ? 'PERFECT' : reactionMs < 550 ? 'GREAT' : 'GOOD';
        const reactStamp = performance.now();
        setLastReaction({ timeSec, grade, timestamp: reactStamp });
        setTimeout(() => {
          setLastReaction((curr) => (curr && curr.timestamp === reactStamp ? null : curr));
        }, 1100);

        // Check active Challenge Mode progress live
        if (stateRef.current.gameMode === 'CHALLENGE' && activeChallengeId !== null) {
          const activeC = challenges.find((c) => c.id === activeChallengeId);
          if (activeC && !activeC.completed) {
            const curSurv = (performance.now() - (runStartTimeRef.current || performance.now())) / 1000;
            const chk = checkChallengeGoalProgress(activeC, {
              score: newScore,
              lives: stateRef.current.lives,
              perfectCount: stateRef.current.perfectCount,
              maxCombo: stateRef.current.maxCombo,
              survivalTimeSec: curSurv,
              bossesDefeated: stateRef.current.bossesDefeated,
              coinsEarnedThisRun: stateRef.current.coinsEarnedThisRun,
              nearMisses: stateRef.current.nearMisses,
            });

            if (chk.isMet) {
              const res = completeChallenge(activeC.id);
              if (res.success) {
                setChallenges(getChallenges());
                soundEngine.playMilestone();
                try {
                  confetti({
                    particleCount: 85,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#38bdf8', '#f59e0b', '#ec4899', '#10b981'],
                  });
                } catch {}
                triggerRewardToast(`CHALLENGE COMPLETE: ${res.challengeTitle}!`, res.coinsAwarded);
                const updated = addCoins(res.coinsAwarded);
                setCoins(updated);
              }
            }
          }
        }

        // Audio feedback: play special Perfect chime or combo chime
        if (isPerfect) {
          soundEngine.playPerfect();
        } else {
          soundEngine.playSuccess(newCombo, stateRef.current.feverActive);
        }

        // Record reaction time
        setReactionTimes((prev) => {
          const list = [...prev, reactionMs];
          setFastestReactionMs((curr) => (curr === 0 ? reactionMs : Math.min(curr, reactionMs)));

          const savedBest = bestReactionTimeMs;
          if (savedBest === 0 || reactionMs < savedBest) {
            setBestReactionTimeMs(reactionMs);
            saveBestReactionTime(reactionMs);
          }

          const avg = Math.round(list.reduce((a, b) => a + b, 0) / list.length);
          setAverageReactionMs(avg);
          return list;
        });

        // Feedback grade popup with coins earned and XP (Compact & clean, Requirement 1, 3 & 6)
        if (isNearMiss) {
          addFeedback('NEAR MISS', 'NEARMISS', `${reactionMs}ms · +${basePts} PTS · +15 XP`, basePts, earnedCoins);
        } else if (isPerfect) {
          addFeedback('PERFECT', 'PERFECT', `+${basePts} PTS · +10 XP`, basePts, earnedCoins);
        } else if (reactionMs < 550) {
          addFeedback('GREAT', 'GOOD', `+${basePts} PTS · +5 XP`, basePts, earnedCoins);
        } else {
          addFeedback('GOOD', 'GOOD', `+${basePts} PTS · +5 XP`, basePts, earnedCoins);
        }

        // Fever charge mechanics (also charges gauge progressively)
        if (!stateRef.current.feverActive && newCombo < 10) {
          const newFeverMeter = Math.min(100, stateRef.current.feverProgress + 10);
          setFeverProgress(newFeverMeter);
          stateRef.current.feverProgress = newFeverMeter;
        }

        // Power-Up Spawn Check: Rare enough to feel special (~1 in 8-10 obstacles, more frequent in Rush mode)
        stateRef.current.obstaclesSincePowerUp += 1;
        if (!stateRef.current.activePowerUpPickup && stateRef.current.obstaclesSincePowerUp >= 7) {
          const spawnThreshold = stateRef.current.isRushMode ? 0.40 : 0.22;
          if (Math.random() < spawnThreshold) {
            const pwr = generateRandomPowerUp();
            setActivePowerUpPickup(pwr);
            stateRef.current.activePowerUpPickup = pwr;
            stateRef.current.obstaclesSincePowerUp = 0;
          }
        }

        // Random Event Trigger Check
        stateRef.current.obstaclesSinceEvent += 1;
        if (
          !stateRef.current.activeEvent &&
          stateRef.current.eventCooldownMs <= 0 &&
          stateRef.current.score >= 10 &&
          stateRef.current.obstaclesSinceEvent >= 7 &&
          Math.random() < 0.45
        ) {
          const event = pickRandomEvent();
          setActiveEvent(event);
          stateRef.current.activeEvent = event;
          stateRef.current.obstaclesSinceEvent = 0;
          stateRef.current.eventCooldownMs = 15000;
          soundEngine.playEvent();
          addFeedback(`EVENT: ${event.name}!`, 'EVENT', event.description);
        }

        // Delay before spawning next obstacle
        const diff = getDifficulty(newScore);
        const interval = stateRef.current.isRushMode
          ? Math.max(260, Math.round(diff.obstacleIntervalMs * 0.75))
          : diff.obstacleIntervalMs;
        stateRef.current.nextObstacleTimer = interval;
        setTimeout(() => {
          if (stateRef.current.gameState === 'PLAYING') {
            setCurrentObstacle(null);
            stateRef.current.currentObstacle = null;
          }
        }, 120);
      } else {
        // WRONG ACTION PRESSED!
        handleMiss('WRONG_ACTION');
      }
    },
    [addFeedback, handleMiss, checkAchievementUnlock, bestReactionTimeMs]
  );

  // Main High-Precision Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const delta = Math.min(time - lastTime, 100);
      lastTime = time;

      if (stateRef.current.gameState === 'PLAYING') {
        // Update live survival time
        const curSurvSec = (performance.now() - (runStartTimeRef.current || performance.now())) / 1000;
        setSurvivalTimeSec(curSurvSec);

        // 1. Update Fever Countdown (10 seconds duration)
        if (stateRef.current.feverActive) {
          const remaining = stateRef.current.feverTimeRemaining - delta;
          if (remaining <= 0) {
            setFeverActive(false);
            stateRef.current.feverActive = false;
            setFeverProgress(0);
            stateRef.current.feverProgress = 0;
            setFeverTimeRemaining(0);
            stateRef.current.feverTimeRemaining = 0;
            const diff = getDifficulty(stateRef.current.score);
            soundEngine.startBgm(diff.speedMultiplier, false);
            addFeedback('FEVER ENDED', 'GOOD');
          } else {
            setFeverTimeRemaining(remaining);
            stateRef.current.feverTimeRemaining = remaining;
          }
        }

        // 2. Update Active Random Event Countdown
        if (stateRef.current.activeEvent) {
          const remainingEvent = stateRef.current.activeEvent.remainingMs - delta;
          if (remainingEvent <= 0) {
            setActiveEvent(null);
            stateRef.current.activeEvent = null;
          } else {
            stateRef.current.activeEvent.remainingMs = remainingEvent;
            setActiveEvent({ ...stateRef.current.activeEvent });
          }
        } else if (stateRef.current.eventCooldownMs > 0) {
          stateRef.current.eventCooldownMs -= delta;
        }

        // 3. Update V4 Power-Ups Timers
        const pu = stateRef.current.activePowerUps;
        let puChanged = false;

        if (pu.slowTimeRemaining > 0) {
          pu.slowTimeRemaining = Math.max(0, pu.slowTimeRemaining - delta);
          puChanged = true;
        }
        if (pu.doubleScoreRemaining > 0) {
          pu.doubleScoreRemaining = Math.max(0, pu.doubleScoreRemaining - delta);
          puChanged = true;
        }
        if (pu.coinMagnetRemaining > 0) {
          pu.coinMagnetRemaining = Math.max(0, pu.coinMagnetRemaining - delta);
          puChanged = true;
        }

        if (puChanged) {
          setActivePowerUps({ ...pu });
        }

        // 4. Update V4 Rush Mode Timer (10 seconds duration)
        if (stateRef.current.isRushMode) {
          const remainingRush = stateRef.current.rushTimeRemaining - delta;
          if (remainingRush <= 0) {
            setIsRushMode(false);
            stateRef.current.isRushMode = false;
            setRushTimeRemaining(0);
            stateRef.current.rushTimeRemaining = 0;
            addFeedback('RUSH MODE ENDED', 'GOOD');
          } else {
            setRushTimeRemaining(remainingRush);
            stateRef.current.rushTimeRemaining = remainingRush;
          }
        }

        // 5. Update Approaching Power-Up Pickup
        const pickup = stateRef.current.activePowerUpPickup;
        if (pickup && !pickup.collected) {
          const spdMult = getDifficulty(stateRef.current.score).speedMultiplier * (stateRef.current.isRushMode ? 1.3 : 1.0);
          pickup.distance = Math.max(0, pickup.distance - (delta / 1000) * 0.42 * spdMult);

          // Auto-collect when reaching player position (or pulled in by Magnet)
          if (
            pickup.distance <= 0.14 ||
            (pu.coinMagnetRemaining > 0 && pickup.distance <= 0.38)
          ) {
            handleCollectPowerUp(pickup.id);
          } else {
            setActivePowerUpPickup({ ...pickup });
          }
        }

        // 6. Update Coin Rain Coins (if active)
        if (stateRef.current.activeEvent?.type === 'COIN_RAIN') {
          setRainCoins((prevCoins) => {
            if (prevCoins.length === 0) {
              return Array.from({ length: 7 }, (_, i) => ({
                id: `rc_${Date.now()}_${i}`,
                x: 0.15 + Math.random() * 0.7,
                y: Math.random() * 0.3,
                speed: 0.2 + Math.random() * 0.25,
                size: 12 + Math.random() * 4,
                collected: false,
              }));
            }
            return prevCoins.map((rc) => {
              if (rc.collected) return rc;
              const newY = rc.y + (delta / 1000) * rc.speed;
              // Magnet collects falling coins near player
              if (pu.coinMagnetRemaining > 0 && newY > 0.55) {
                handleCollectRainCoin(rc.id);
                return { ...rc, collected: true };
              }
              if (newY > 1.0) {
                return { ...rc, y: 0, x: 0.15 + Math.random() * 0.7 };
              }
              return { ...rc, y: newY };
            });
          });
        }

        // 7. Update Runner Animation Progress & Invulnerability
        const p = stateRef.current.player;
        if (p.currentAction !== 'RUNNING') {
          const actionProgress = p.actionProgress + delta / 320;
          if (actionProgress >= 1.0) {
            const resetPlayer: Player = {
              ...p,
              currentAction: 'RUNNING',
              actionProgress: 0,
            };
            setPlayer(resetPlayer);
            stateRef.current.player = resetPlayer;
          } else {
            const updated: Player = {
              ...p,
              actionProgress,
            };
            setPlayer(updated);
            stateRef.current.player = updated;
          }
        }

        if (p.invulnerableTime > 0) {
          const newInv = Math.max(0, p.invulnerableTime - delta);
          p.invulnerableTime = newInv;
        }

        // 7B. Update Ghost Runner State (if playing in GHOST mode)
        if (stateRef.current.gameMode === 'GHOST' && activeGhostRunRef.current) {
          const elapsed = performance.now() - (runStartTimeRef.current || performance.now());
          const events = activeGhostRunRef.current.events;
          if (events && events.length > 0) {
            let latestIdx = -1;
            for (let i = 0; i < events.length; i++) {
              if (events[i].t <= elapsed) {
                latestIdx = i;
              } else {
                break;
              }
            }

            if (latestIdx >= 0) {
              const ev = events[latestIdx];
              const timeSinceEv = elapsed - ev.t;
              const isActing = timeSinceEv < 320;
              const actProgress = Math.min(1, timeSinceEv / 320);

              let gAction: PlayerAction = 'RUNNING';
              if (isActing) {
                if (ev.a === 'JUMP') gAction = 'JUMPING';
                else if (ev.a === 'SLIDE') gAction = 'SLIDING';
                else if (ev.a === 'LEFT') gAction = 'DODGE_LEFT';
                else if (ev.a === 'RIGHT') gAction = 'DODGE_RIGHT';
              }

              setGhostPlayer({
                lane: ev.l,
                targetLane: ev.l,
                currentAction: gAction,
                actionProgress: actProgress,
                invulnerableTime: 0,
                skinId: activeGhostRunRef.current.skinId || 'classic',
              });
              setGhostScore(ev.s);
            }
          }
        }

        // 8. Obstacle Lifecycle & Countdown (Support SLOW_TIME power-up)
        const obs = stateRef.current.currentObstacle;
        if (obs && !obs.cleared && !obs.failed) {
          // Slow down timer decrement if SLOW_TIME power-up is active
          const timerDecrement = pu.slowTimeRemaining > 0 ? delta * 0.65 : delta;
          obs.remainingTime -= timerDecrement;
          obs.distance = Math.max(0, obs.remainingTime / obs.timeLimit);

          if (obs.remainingTime <= 0) {
            obs.failed = true;
            handleMiss('TIMEOUT');
          } else {
            setCurrentObstacle({ ...obs });
          }
        } else {
          if (stateRef.current.nextObstacleTimer > 0) {
            stateRef.current.nextObstacleTimer -= delta;
          } else if (!stateRef.current.bossWarningActive) {
            const curSurvSec = (performance.now() - (runStartTimeRef.current || performance.now())) / 1000;
            const newObs = generateRandomObstacle(
              stateRef.current.score,
              stateRef.current.lastSpawnedAction,
              stateRef.current.activeEvent,
              stateRef.current.isRushMode,
              stateRef.current.gameMode,
              curSurvSec
            );
            stateRef.current.lastSpawnedAction = newObs.action;
            stateRef.current.currentObstacle = newObs;
            setCurrentObstacle(newObs);
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [handleMiss, addFeedback, handleCollectPowerUp, handleCollectRainCoin]);

  // Skin Buying & Equipping
  const handleBuySkin = (skinId: SkinId) => {
    const success = purchaseSkin(skinId);
    if (success) {
      setPurchasedSkins(getPurchasedSkins());
      setCoins(getCoins());
      setEquippedSkin(skinId);
      setEquippedSkinState(skinId);
      triggerRewardToast(`EQUIPPED NEW SKIN!`);
    }
  };

  const handleEquipSkin = (skinId: SkinId) => {
    setEquippedSkin(skinId);
    setEquippedSkinState(skinId);
    triggerRewardToast(`EQUIPPED SKIN!`);
  };

  // Claim Daily Challenge (Requirement 1: +30 XP)
  const handleClaimDaily = () => {
    const success = claimDailyReward();
    if (success) {
      setCoins(getCoins());
      setDailyChallenge(getDailyChallenge());
      const xpRes = addPlayerXp(30);
      setPlayerProgression(getPlayerProgression());
      if (xpRes.coinReward > 0) setCoins(getCoins());
      if (xpRes.leveledUp) {
        setLevelUpModalData({
          level: xpRes.newLevel,
          coinReward: xpRes.coinReward,
          unlockedTitle: xpRes.newlyUnlockedTitles[0] ? TITLES[xpRes.newlyUnlockedTitles[0]]?.name : null,
        });
      }
      triggerRewardPopup({
        type: 'DAILY_REWARD',
        title: 'DAILY CHALLENGE CLAIMED!',
        subtitle: `+${dailyChallenge.rewardCoins} 🪙 · +30 XP`,
      });
    }
  };

  // Claim Mission
  const handleClaimMission = (missionId: string) => {
    const targetMission = missions.find((m) => m.id === missionId);
    const success = claimMissionReward(missionId);
    if (success) {
      setCoins(getCoins());
      setMissions(getMissions());
      triggerRewardToast(`CLAIMED MISSION REWARD!`, targetMission?.rewardCoins);
    }
  };

  const hasUnclaimedDaily = dailyChallenge.completed && !dailyChallenge.claimed;
  const hasUnclaimedMissions = missions.some((m) => m.completed && !m.claimed);

  const currentDiff = getDifficulty(score);

  return (
    <div className="relative w-screen h-screen h-[100dvh] flex flex-col justify-between bg-slate-950 overflow-hidden font-sans select-none touch-none">
      {/* Notifications */}
      <AchievementToast achievement={activeToastAchievement} />
      <RewardToast
        data={rewardToastData}
        message={rewardToast?.message || null}
        coinsAmount={rewardToast?.coins}
      />

      {/* Red screen flash when hurt */}
      {showRedFlash && (
        <div className="absolute inset-0 z-40 bg-rose-600/35 pointer-events-none transition-opacity duration-150 animate-in fade-in" />
      )}

      {/* Fever mode border glow (refined, unobtrusive edge accent) */}
      {feverActive && (
        <div className="absolute inset-0 z-10 pointer-events-none border-2 border-amber-400/60 fever-glow shadow-[inset_0_0_18px_rgba(245,158,11,0.2)]" />
      )}

      {/* Top HUD */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <div className="relative z-20 w-full shrink-0">
          <GameHUD
            lives={lives}
            score={score}
            combo={combo}
            coins={coins + coinsEarnedThisRun}
            bestScore={bestScore}
            feverActive={feverActive}
            feverProgress={feverProgress}
            feverTimeRemaining={feverTimeRemaining}
            currentObstacle={currentObstacle}
            activeEvent={activeEvent}
            activePowerUps={activePowerUps}
            isRushMode={isRushMode}
            rushTimeRemaining={rushTimeRemaining}
            bossWarningActive={bossWarningActive}
            miniBossWarningActive={miniBossWarningActive}
            mode={gameMode}
            survivalTimeSec={survivalTimeSec}
            perfectStreak={perfectStreak}
            lastReaction={lastReaction}
            activeChallenge={challenges.find((c) => c.id === activeChallengeId) || null}
            challengeProgress={
              activeChallengeId !== null && challenges.find((c) => c.id === activeChallengeId)
                ? {
                    current: checkChallengeGoalProgress(
                      challenges.find((c) => c.id === activeChallengeId)!,
                      {
                        score,
                        lives,
                        perfectCount,
                        maxCombo,
                        survivalTimeSec,
                        bossesDefeated,
                        coinsEarnedThisRun,
                        nearMisses,
                      }
                    ).currentVal,
                    target: challenges.find((c) => c.id === activeChallengeId)!.targetValue,
                    label: challenges.find((c) => c.id === activeChallengeId)!.title,
                  }
                : undefined
            }
            isMuted={isMuted}
            ghostScore={gameMode === 'GHOST' ? ghostScore : undefined}
            ghostTargetScore={gameMode === 'GHOST' ? activeGhostRunRef.current?.finalScore : undefined}
            onToggleMute={handleToggleMute}
            onPause={handlePause}
          />
        </div>
      )}

      {/* Main 2.5D Highway Runner Canvas */}
      <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden">
        <GameCanvas
          currentObstacle={currentObstacle}
          player={player}
          feverActive={feverActive}
          isHurtShake={isHurtShake}
          floatingFeedbacks={floatingFeedbacks}
          score={score}
          combo={combo}
          speedMultiplier={currentDiff.speedMultiplier * (isRushMode ? 1.3 : 1)}
          activeEvent={activeEvent}
          activePowerUps={activePowerUps}
          activePowerUpPickup={activePowerUpPickup}
          rainCoins={rainCoins}
          isRushMode={isRushMode}
          ghostPlayer={gameMode === 'GHOST' ? ghostPlayer : null}
          ghostScore={gameMode === 'GHOST' ? ghostScore : undefined}
          onSwipeAction={handlePlayerAction}
          onCollectRainCoin={handleCollectRainCoin}
          onCollectPowerUp={handleCollectPowerUp}
        />
      </div>

      {/* Bottom Large Action Buttons */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <div className="relative z-20 w-full shrink-0 pb-safe">
          <ActionControls
            onAction={handlePlayerAction}
            disabled={lives <= 0 || gameState === 'PAUSED'}
            highlightAction={
              currentObstacle?.isBoss && currentObstacle.bossSteps
                ? currentObstacle.bossSteps[currentObstacle.bossCurrentStepIndex || 0]
                : currentObstacle?.isMiniBoss && currentObstacle.miniBossSteps
                ? currentObstacle.miniBossSteps[currentObstacle.miniBossCurrentStepIndex || 0]
                : currentObstacle?.isTwoStep && currentObstacle.currentStep === 2 && currentObstacle.secondAction
                ? currentObstacle.secondAction
                : currentObstacle?.action
            }
          />
        </div>
      )}

      {/* Start Screen Overlay */}
      {gameState === 'MENU' && (
        <StartScreen
          coins={coins}
          bestScore={bestScore}
          bestReactionTimeMs={bestReactionTimeMs}
          equippedSkin={equippedSkin}
          hasUnclaimedDaily={hasUnclaimedDaily}
          hasUnclaimedMissions={hasUnclaimedMissions}
          hasUnclaimedStreak={!streakData.claimedToday}
          currentStreak={streakData.currentStreak}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPlayClassic={() => handleStartPlay('CLASSIC')}
          onPlayGhost={() => handleStartPlay('GHOST')}
          onPlayEndless={() => handleStartPlay('ENDLESS')}
          onOpenChallenges={() => setIsChallengesOpen(true)}
          onOpenShop={() => setGameState('SHOP')}
          onOpenDaily={() => setGameState('DAILY')}
          onOpenStreak={() => setIsStreakModalOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenMissions={() => setGameState('MISSIONS')}
          onOpenProfile={() => setGameState('PROFILE')}
        />
      )}

      {/* 3, 2, 1, GO! Countdown Overlay */}
      {gameState === 'COUNTDOWN' && <CountdownScreen onComplete={handleCountdownComplete} />}

      {/* Pause Screen Overlay */}
      {gameState === 'PAUSED' && (
        <PauseScreen
          score={score}
          combo={combo}
          lives={lives}
          isMuted={isMuted}
          onResume={handleResume}
          onRestart={() => {
            if (stateRef.current.coinsEarnedThisRun > 0) {
              const updatedTotal = addCoins(stateRef.current.coinsEarnedThisRun);
              setCoins(updatedTotal);
              setCoinsEarnedThisRun(0);
              stateRef.current.coinsEarnedThisRun = 0;
            }
            handleStartPlay(gameMode);
          }}
          onHome={handleGoHome}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Game Over Screen */}
      {gameState === 'GAMEOVER' && (
        <GameOverScreen
          score={score}
          bestScore={bestScore}
          maxCombo={maxCombo}
          bestCombo={bestCombo}
          coinsEarned={coinsEarnedThisRun}
          totalCoins={coins}
          fastestReactionMs={fastestReactionMs}
          bestReactionTimeMs={bestReactionTimeMs}
          averageReactionMs={averageReactionMs}
          totalCleared={totalCleared}
          perfectCount={perfectCount}
          powerUpsCollected={powerUpsCollected}
          nearMisses={nearMisses}
          bossesDefeated={bossesDefeated}
          survivalTimeSec={survivalTimeSec}
          mode={gameMode}
          scoreBreakdown={scoreBreakdown}
          unlockedAchievements={unlockedAchievements}
          isNewRecord={isNewRecord}
          xpEarned={stateRef.current.xpEarnedThisRun || xpEarnedThisRun}
          playerLevel={playerProgression.level}
          playerXp={playerProgression.currentXp}
          playerXpNext={playerProgression.xpForNextLevel}
          hasLeveledUp={levelUpModalData !== null}
          beatGhost={ghostDefeatedState?.beatGhost}
          isCrushed={ghostDefeatedState?.isCrushed}
          ghostTargetScore={ghostDefeatedState?.ghostTargetScore}
          ghostCoinBonus={ghostDefeatedState?.ghostCoinBonus}
          ghostXpBonus={ghostDefeatedState?.ghostXpBonus}
          onShowLevelUp={() => {}}
          onPlayAgain={() => handleStartPlay(gameMode)}
          onHome={handleGoHome}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenShare={(txt) => setShareModalText(txt)}
        />
      )}

      {/* V6 Challenge Mode Select Modal */}
      {isChallengesOpen && (
        <ChallengeSelectModal
          challenges={challenges}
          coins={coins}
          onSelectChallenge={(c) => {
            setActiveChallengeId(c.id);
            setIsChallengesOpen(false);
            handleStartPlay('CHALLENGE');
          }}
          onClose={() => setIsChallengesOpen(false)}
        />
      )}

      {/* Skin Shop Modal */}
      {gameState === 'SHOP' && (
        <ShopModal
          coins={coins}
          purchasedSkins={purchasedSkins}
          equippedSkin={equippedSkin}
          onBuySkin={handleBuySkin}
          onEquipSkin={handleEquipSkin}
          onClose={handleGoHome}
        />
      )}

      {/* Daily Challenge Modal */}
      {gameState === 'DAILY' && (
        <DailyChallengeModal
          challenge={dailyChallenge}
          onClaimReward={handleClaimDaily}
          onStartPlaying={() => handleStartPlay('CLASSIC')}
          onClose={handleGoHome}
        />
      )}

      {/* Missions Modal */}
      {gameState === 'MISSIONS' && (
        <MissionsModal
          missions={missions}
          coins={coins}
          onClaimMission={handleClaimMission}
          onClose={handleGoHome}
        />
      )}

      {/* Profile Modal */}
      {gameState === 'PROFILE' && (
        <ProfileModal
          coins={coins}
          bestScore={bestScore}
          bestCombo={bestCombo}
          bestReactionTimeMs={bestReactionTimeMs}
          userStats={userStats}
          equippedSkin={equippedSkin}
          unlockedAchievements={unlockedAchievements}
          onClose={handleGoHome}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onEquipTitle={() => setPlayerProgression(getPlayerProgression())}
        />
      )}

      {/* V5 Local Leaderboard Modal */}
      {isLeaderboardOpen && (
        <LeaderboardModal
          onClose={() => setIsLeaderboardOpen(false)}
          onOpenProfile={() => {
            setIsLeaderboardOpen(false);
            setGameState('PROFILE');
          }}
        />
      )}

      {/* V5 Rank Up Celebration Modal */}
      {rankUpData && (
        <RankUpModal
          previousRank={rankUpData.previousRank}
          newRank={rankUpData.newRank}
          score={rankUpData.score}
          onClose={() => setRankUpData(null)}
        />
      )}

      {/* V5 Share Score Modal */}
      {shareModalText && (
        <ShareModal
          shareText={shareModalText}
          onClose={() => setShareModalText(null)}
        />
      )}

      {/* V5 Daily Streak Modal */}
      {isStreakModalOpen && (
        <DailyStreakModal
          onClose={() => setIsStreakModalOpen(false)}
          onRewardClaimed={(coinsAwarded) => {
            setCoins(getCoins());
            const updatedStreak = getDailyStreak();
            setStreakData(updatedStreak);
            triggerRewardPopup({
              type: 'DAILY_REWARD',
              title: 'DAILY STREAK CLAIMED!',
              subtitle: `Day ${updatedStreak.currentStreak} Streak · +${coinsAwarded} 🪙`,
            });
          }}
        />
      )}

      {/* Level Up Celebration Modal (Requirement 2 & 10) */}
      {levelUpModalData && (
        <LevelUpModal
          level={levelUpModalData.level}
          coinReward={levelUpModalData.coinReward}
          unlockedTitle={levelUpModalData.unlockedTitle}
          onClose={() => setLevelUpModalData(null)}
        />
      )}
    </div>
  );
}
