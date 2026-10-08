export type Action = 'JUMP' | 'SLIDE' | 'LEFT' | 'RIGHT';

export type GameMode = 'CLASSIC' | 'ENDLESS' | 'CHALLENGE' | 'GHOST';

export interface GhostEvent {
  t: number; // millisecond timestamp relative to run start
  a: Action; // action taken: 'JUMP' | 'SLIDE' | 'LEFT' | 'RIGHT'
  l: -1 | 0 | 1; // player lane: -1 | 0 | 1
  s: number; // score at this event
}

export interface GhostRun {
  id: string;
  date: string;
  finalScore: number;
  survivalTimeSec: number;
  skinId: SkinId;
  events: GhostEvent[];
}

export type GameState =
  | 'MENU'
  | 'COUNTDOWN'
  | 'PLAYING'
  | 'PAUSED'
  | 'GAMEOVER'
  | 'SHOP'
  | 'DAILY'
  | 'MISSIONS'
  | 'PROFILE'
  | 'LEADERBOARD';

export type DistractionType = 'GLITCH' | 'CAUTION';

export type RandomEventType =
  | 'SPEED_UP'
  | 'SLOW_MOTION'
  | 'DOUBLE_SCORE'
  | 'FAKE_WARNING'
  | 'LIGHTNING_ROUND'
  | 'COIN_RAIN'
  | 'SPEED_BURST'
  | 'PERFECT_STREAK';

export type PowerUpType = 'SHIELD' | 'SLOW_TIME' | 'DOUBLE_SCORE' | 'EXTRA_LIFE' | 'COIN_MAGNET';

export interface PowerUp {
  id: string;
  type: PowerUpType;
  lane: -1 | 0 | 1;
  distance: number; // 1.0 (horizon) down to 0.0 (player)
  collected: boolean;
  spawnTimestamp: number;
}

export interface ActivePowerUpState {
  hasShield: boolean;
  slowTimeRemaining: number;
  doubleScoreRemaining: number;
  coinMagnetRemaining: number;
}

export interface RainCoin {
  id: string;
  x: number; // relative 0..1
  y: number; // relative 0..1
  speed: number;
  size: number;
  collected: boolean;
}

export type SkinId = 'classic' | 'neon' | 'robot' | 'ninja' | 'fire' | 'galaxy';

export interface Skin {
  id: SkinId;
  name: string;
  price: number;
  description: string;
  suitColor: string;
  visorColor: string;
  coreColor: string;
  helmetColor: string;
  trailColor: string;
  accentBadge: string;
}

export interface DailyChallenge {
  dateKey: string; // YYYY-MM-DD
  title: string;
  description: string;
  targetType: 'score' | 'perfects' | 'combo' | 'cleared';
  targetValue: number;
  rewardCoins: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  targetType: 'single_score' | 'total_perfects' | 'max_combo';
  targetValue: number;
  progress: number;
  rewardCoins: number;
  completed: boolean;
  claimed: boolean;
}

export interface UserStats {
  totalGames: number;
  totalPerfects: number;
  totalObstaclesAvoided: number;
  totalCoinsEarned: number;
  totalPowerUpsCollected: number;
  totalNearMisses: number;
  totalBossChallenges: number;
  bossesDefeated: number;
  longestSurvivalTimeSec: number;
}

export interface ActiveEvent {
  type: RandomEventType;
  name: string;
  description: string;
  durationMs: number;
  remainingMs: number;
  color: string;
  bgColor: string;
}

export type AchievementId =
  | 'first_step'
  | 'fast_hands'
  | 'combo_master'
  | 'survivor'
  | 'speed_demon'
  | 'close_call'
  | 'power_player'
  | 'boss_hunter'
  | 'untouchable'
  | 'legend';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  iconName: string;
}

export type ObstacleStyle =
  | 'LOW'        // Low obstacle -> JUMP
  | 'HIGH'       // High obstacle -> SLIDE
  | 'LEFT_WALL'  // Left barrier -> RIGHT
  | 'RIGHT_WALL' // Right barrier -> LEFT
  | 'MOVING'     // Moving obstacle
  | 'FAKE_WARN'  // Fake warning
  | 'DOUBLE_SEQ' // Double sequence
  | 'MINI_BOSS'  // Mini Boss sequence (2 actions)
  | 'BOSS';      // Boss obstacle (3 actions)

export interface Obstacle {
  id: string;
  action: Action;
  isTwoStep: boolean;
  secondAction?: Action;
  currentStep: 1 | 2;
  timeLimit: number; // in milliseconds
  remainingTime: number; // in milliseconds
  spawnTimestamp: number;
  distraction?: DistractionType;
  fakeWarningActive?: boolean; // For FAKE_WARNING event
  style?: ObstacleStyle;
  isBoss?: boolean;
  bossSteps?: Action[];
  bossCurrentStepIndex?: number;
  bossTotalSteps?: number;
  isMiniBoss?: boolean;
  miniBossSteps?: Action[];
  miniBossCurrentStepIndex?: number;
  miniBossTotalSteps?: number;
  /**
   * Distance from player:
   * 1.0 = at the horizon approaching
   * 0.0 = collision point (exact moment to execute action)
   */
  distance: number;
  cleared: boolean;
  failed: boolean;
}

export type PlayerAction = 'RUNNING' | 'JUMPING' | 'SLIDING' | 'DODGE_LEFT' | 'DODGE_RIGHT' | 'HURT';

export interface Player {
  lane: -1 | 0 | 1; // -1: Left, 0: Center, 1: Right
  targetLane: -1 | 0 | 1;
  currentAction: PlayerAction;
  actionProgress: number; // 0 to 1
  invulnerableTime: number; // ms remaining of invulnerability
  skinId: SkinId;
}

export interface FloatingFeedback {
  id: string;
  text: string;
  subtext?: string;
  scoreBonus?: number;
  coinBonus?: number;
  type:
    | 'PERFECT'
    | 'GREAT'
    | 'GOOD'
    | 'MISS'
    | 'FEVER'
    | 'COMBO'
    | 'MILESTONE'
    | 'EVENT'
    | 'COIN'
    | 'POWERUP'
    | 'NEARMISS'
    | 'RUSH'
    | 'MINIBOSS'
    | 'BOSS'
    | 'PERFECT_STREAK'
    | 'REACTION'
    | 'XP'
    | 'LEVELUP';
  yOffset: number;
  createdAt: number;
}

export interface GameStats {
  score: number;
  combo: number;
  maxCombo: number;
  lives: number;
  coinsEarnedThisRun: number;
  bestScore: number;
  bestCombo: number;
  feverActive: boolean;
  feverProgress: number; // 0 to 100%
  feverTimeRemaining: number; // in ms
  totalCleared: number;
  perfectCount: number;
  nearMissCount: number;
  powerUpsCollected: number;
  bossesDefeatedThisRun: number;
  survivalTimeSec: number;
  reactionTimes: number[];
  fastestReactionMs: number;
  bestReactionTimeMs: number;
  averageReactionMs: number;
}

export interface ActionConfig {
  key: Action;
  label: string;
  keyboardKeys: string[];
  color: string;
  borderClass: string;
  bgClass: string;
  glowClass: string;
  textClass: string;
  iconName: string;
  description: string;
}

export type RankId = 'ROOKIE' | 'RUNNER' | 'FAST' | 'ELITE' | 'MASTER' | 'LEGEND' | 'GOD';

export interface RankInfo {
  id: RankId;
  name: string;
  minScore: number;
  maxScore: number;
  color: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  iconName: string;
  quote: string;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  mode: GameMode;
  date: string;
  isPlayer?: boolean;
}

export interface DailyStreakData {
  currentStreak: number;
  lastClaimDateKey: string;
  claimedToday: boolean;
}

export interface ScoreBreakdown {
  finalScore: number;
  baseScore: number;
  perfectBonus: number;
  comboBonus: number;
  feverBonus: number;
  coinsEarned: number;
  survivalBonusCoins?: number;
  survivalTimeSec?: number;
}

export interface Challenge {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  rewardCoins: number;
  targetType:
    | 'score_no_death'
    | 'perfect_count'
    | 'combo_reach'
    | 'survival_time'
    | 'boss_defeat'
    | 'coins_collect'
    | 'near_miss'
    | 'score_reach';
  targetValue: number;
  unlocked: boolean;
  completed: boolean;
}

export type PlayerTitleId =
  | 'ROOKIE'
  | 'FAST_HANDS'
  | 'COMBO_MASTER'
  | 'BOSS_HUNTER'
  | 'SPEED_DEMON'
  | 'ONE_SECOND_LEGEND';

export interface PlayerTitle {
  id: PlayerTitleId;
  name: string;
  description: string;
  badgeColor: string;
}

export interface PlayerProgression {
  level: number;
  currentXp: number;
  xpForNextLevel: number;
  totalXp: number;
  equippedTitle: PlayerTitleId;
  unlockedTitles: PlayerTitleId[];
}




