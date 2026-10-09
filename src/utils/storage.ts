import {
  Challenge,
  DailyChallenge,
  DailyStreakData,
  GameMode,
  LeaderboardEntry,
  Mission,
  SkinId,
  UserStats,
  GhostRun,
  GhostEvent,
} from '../types/game';
import { SKINS } from './skins';

// In-memory fallback in case localStorage is disabled or throws in restrictive iframes
const memoryStore: Record<string, string> = {};

export function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
  } catch {
    // fallback
  }
  return memoryStore[key] || null;
}

export function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
  } catch {
    // fallback
  }
  memoryStore[key] = value;
}

// --- BEST RECORDS & REACTION TIMES ---

export function getBestScore(): number {
  const val = safeGetItem('one_second_best_score');
  return val ? parseInt(val, 10) || 0 : 0;
}

export function saveBestScore(score: number): void {
  safeSetItem('one_second_best_score', score.toString());
}

export function getBestCombo(): number {
  const val = safeGetItem('one_second_best_combo');
  return val ? parseInt(val, 10) || 0 : 0;
}

export function saveBestCombo(combo: number): void {
  safeSetItem('one_second_best_combo', combo.toString());
}

export function getBestReactionTime(): number {
  const val = safeGetItem('one_second_best_reaction_ms');
  return val ? parseInt(val, 10) || 0 : 0;
}

export function saveBestReactionTime(ms: number): void {
  safeSetItem('one_second_best_reaction_ms', ms.toString());
}

// --- COIN SYSTEM ---

export function getCoins(): number {
  const val = safeGetItem('one_second_coins');
  return val ? parseInt(val, 10) || 0 : 0;
}

export function addCoins(amount: number): number {
  if (amount <= 0) return getCoins();
  const current = getCoins();
  const updated = current + amount;
  safeSetItem('one_second_coins', updated.toString());

  // Also track total coins earned over lifetime
  const stats = getUserStats();
  stats.totalCoinsEarned += amount;
  saveUserStats(stats);

  return updated;
}

export function spendCoins(amount: number): boolean {
  const current = getCoins();
  if (current < amount) return false;
  const updated = current - amount;
  safeSetItem('one_second_coins', updated.toString());
  return true;
}

// --- SKIN SHOP & INVENTORY ---

export function getPurchasedSkins(): SkinId[] {
  const raw = safeGetItem('one_second_purchased_skins');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && !parsed.includes('classic')) {
        parsed.unshift('classic');
      }
      return parsed;
    } catch {
      // ignore
    }
  }
  return ['classic'];
}

export function purchaseSkin(skinId: SkinId): boolean {
  const skin = SKINS[skinId];
  if (!skin) return false;
  const purchased = getPurchasedSkins();
  if (purchased.includes(skinId)) return true; // Already owned

  if (spendCoins(skin.price)) {
    purchased.push(skinId);
    safeSetItem('one_second_purchased_skins', JSON.stringify(purchased));
    return true;
  }
  return false;
}

export function getEquippedSkin(): SkinId {
  const raw = safeGetItem('one_second_equipped_skin') as SkinId | null;
  if (raw && SKINS[raw]) {
    const purchased = getPurchasedSkins();
    if (purchased.includes(raw)) return raw;
  }
  return 'classic';
}

export function setEquippedSkin(skinId: SkinId): void {
  const purchased = getPurchasedSkins();
  if (purchased.includes(skinId)) {
    safeSetItem('one_second_equipped_skin', skinId);
  }
}

// --- USER STATS ---

export function getUserStats(): UserStats {
  const raw = safeGetItem('one_second_user_stats');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          totalGames: Number(parsed.totalGames) || 0,
          totalPerfects: Number(parsed.totalPerfects) || 0,
          totalObstaclesAvoided: Number(parsed.totalObstaclesAvoided) || 0,
          totalCoinsEarned: Number(parsed.totalCoinsEarned) || 0,
          totalPowerUpsCollected: Number(parsed.totalPowerUpsCollected) || 0,
          totalNearMisses: Number(parsed.totalNearMisses) || 0,
          totalBossChallenges: Number(parsed.totalBossChallenges) || 0,
          bossesDefeated: Number(parsed.bossesDefeated) || 0,
          longestSurvivalTimeSec: Number(parsed.longestSurvivalTimeSec) || 0,
        };
      }
    } catch {
      // ignore corrupt data
    }
  }
  return {
    totalGames: 0,
    totalPerfects: 0,
    totalObstaclesAvoided: 0,
    totalCoinsEarned: 0,
    totalPowerUpsCollected: 0,
    totalNearMisses: 0,
    totalBossChallenges: 0,
    bossesDefeated: 0,
    longestSurvivalTimeSec: 0,
  };
}

export function saveUserStats(stats: UserStats): void {
  safeSetItem('one_second_user_stats', JSON.stringify(stats));
}

export function recordGameStats(
  perfectsInGame: number,
  obstaclesAvoided: number,
  powerUpsCollected: number = 0,
  nearMisses: number = 0,
  bossChallenges: number = 0,
  bossesDefeated: number = 0,
  survivalTimeSec: number = 0
): UserStats {
  const stats = getUserStats();
  stats.totalGames += 1;
  stats.totalPerfects += perfectsInGame;
  stats.totalObstaclesAvoided += obstaclesAvoided;
  stats.totalPowerUpsCollected += powerUpsCollected;
  stats.totalNearMisses += nearMisses;
  stats.totalBossChallenges += bossChallenges;
  stats.bossesDefeated += bossesDefeated;
  if (survivalTimeSec > stats.longestSurvivalTimeSec) {
    stats.longestSurvivalTimeSec = Math.round(survivalTimeSec);
  }
  saveUserStats(stats);
  return stats;
}

// --- DAILY CHALLENGE ---

export function getTodayDateKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const DAILY_TEMPLATES = [
  {
    title: 'Score Crusher',
    description: 'Score 30 points in a single run',
    targetType: 'score' as const,
    targetValue: 30,
    rewardCoins: 60,
  },
  {
    title: 'Reflex Maestro',
    description: 'Perform 6 Perfect reactions in a run',
    targetType: 'perfects' as const,
    targetValue: 6,
    rewardCoins: 75,
  },
  {
    title: 'Combo Striker',
    description: 'Reach a x10 Combo streak',
    targetType: 'combo' as const,
    targetValue: 10,
    rewardCoins: 80,
  },
  {
    title: 'Obstacle Hopper',
    description: 'Avoid 25 obstacles in a run',
    targetType: 'cleared' as const,
    targetValue: 25,
    rewardCoins: 70,
  },
];

export function getDailyChallenge(): DailyChallenge {
  const dateKey = getTodayDateKey();
  const raw = safeGetItem(`one_second_daily_${dateKey}`);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  // Deterministically select template using date characters hash
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash << 5) - hash + dateKey.charCodeAt(i);
    hash |= 0;
  }
  const templateIdx = Math.abs(hash) % DAILY_TEMPLATES.length;
  const tmpl = DAILY_TEMPLATES[templateIdx];

  const challenge: DailyChallenge = {
    dateKey,
    title: tmpl.title,
    description: tmpl.description,
    targetType: tmpl.targetType,
    targetValue: tmpl.targetValue,
    rewardCoins: tmpl.rewardCoins,
    progress: 0,
    completed: false,
    claimed: false,
  };

  safeSetItem(`one_second_daily_${dateKey}`, JSON.stringify(challenge));
  return challenge;
}

export function updateDailyChallengeProgress(score: number, perfects: number, combo: number, cleared: number): DailyChallenge {
  const challenge = getDailyChallenge();
  if (challenge.completed) return challenge;

  let currentVal = 0;
  switch (challenge.targetType) {
    case 'score':
      currentVal = score;
      break;
    case 'perfects':
      currentVal = perfects;
      break;
    case 'combo':
      currentVal = combo;
      break;
    case 'cleared':
      currentVal = cleared;
      break;
  }

  if (currentVal > challenge.progress) {
    challenge.progress = Math.min(challenge.targetValue, currentVal);
    if (challenge.progress >= challenge.targetValue) {
      challenge.completed = true;
    }
    safeSetItem(`one_second_daily_${challenge.dateKey}`, JSON.stringify(challenge));
  }

  return challenge;
}

export function claimDailyReward(): boolean {
  const challenge = getDailyChallenge();
  if (challenge.completed && !challenge.claimed) {
    challenge.claimed = true;
    safeSetItem(`one_second_daily_${challenge.dateKey}`, JSON.stringify(challenge));
    addCoins(challenge.rewardCoins);
    return true;
  }
  return false;
}

// --- MISSIONS SYSTEM ---

const DEFAULT_MISSIONS: Mission[] = [
  {
    id: 'mission_score_20',
    title: 'Precision Run',
    description: 'Score 20 points in a single run',
    targetType: 'single_score',
    targetValue: 20,
    progress: 0,
    rewardCoins: 40,
    completed: false,
    claimed: false,
  },
  {
    id: 'mission_perfect_10',
    title: 'Lightning Focus',
    description: 'Perform 10 Perfect reactions total',
    targetType: 'total_perfects',
    targetValue: 10,
    progress: 0,
    rewardCoins: 50,
    completed: false,
    claimed: false,
  },
  {
    id: 'mission_combo_8',
    title: 'Rhythm Master',
    description: 'Reach a x8 Combo streak',
    targetType: 'max_combo',
    targetValue: 8,
    progress: 0,
    rewardCoins: 45,
    completed: false,
    claimed: false,
  },
];

export function getMissions(): Mission[] {
  const raw = safeGetItem('one_second_missions_v1');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return DEFAULT_MISSIONS.map((tmpl) => {
          const saved = parsed.find((p: any) => p && p.id === tmpl.id);
          if (saved) {
            return {
              ...tmpl,
              progress: typeof saved.progress === 'number' ? saved.progress : 0,
              completed: Boolean(saved.completed),
              claimed: Boolean(saved.claimed),
            };
          }
          return tmpl;
        });
      }
    } catch {
      // ignore corrupt data
    }
  }
  safeSetItem('one_second_missions_v1', JSON.stringify(DEFAULT_MISSIONS));
  return DEFAULT_MISSIONS;
}

export function updateMissionsProgress(score: number, perfectsInRun: number, maxCombo: number): { missions: Mission[]; newlyCompleted: Mission[] } {
  const missions = getMissions();
  const newlyCompleted: Mission[] = [];

  missions.forEach((m) => {
    if (m.completed) return;

    if (m.targetType === 'single_score') {
      if (score > m.progress) {
        m.progress = Math.min(m.targetValue, score);
      }
    } else if (m.targetType === 'total_perfects') {
      m.progress = Math.min(m.targetValue, m.progress + perfectsInRun);
    } else if (m.targetType === 'max_combo') {
      if (maxCombo > m.progress) {
        m.progress = Math.min(m.targetValue, maxCombo);
      }
    }

    if (m.progress >= m.targetValue && !m.completed) {
      m.completed = true;
      newlyCompleted.push({ ...m });
    }
  });

  safeSetItem('one_second_missions_v1', JSON.stringify(missions));
  return { missions, newlyCompleted };
}

export function claimMissionReward(missionId: string): boolean {
  const missions = getMissions();
  const mission = missions.find((m) => m.id === missionId);
  if (mission && mission.completed && !mission.claimed) {
    mission.claimed = true;
    safeSetItem('one_second_missions_v1', JSON.stringify(missions));
    addCoins(mission.rewardCoins);
    return true;
  }
  return false;
}

// --- V5 PLAYER NICKNAME ---

export function getPlayerNickname(): string {
  const val = safeGetItem('one_second_player_nickname');
  return val && val.trim().length > 0 ? val.trim().slice(0, 15) : 'YOU';
}

export function savePlayerNickname(name: string): string {
  const cleaned = (name || '').trim().slice(0, 15) || 'YOU';
  safeSetItem('one_second_player_nickname', cleaned);
  // Also update player name in leaderboard entries
  const currentLeaderboard = getLeaderboard();
  const updated = currentLeaderboard.map((entry) =>
    entry.isPlayer ? { ...entry, playerName: cleaned } : entry
  );
  saveLeaderboard(updated);
  return cleaned;
}

// --- V5 ENDLESS MODE RECORDS ---

export function getEndlessBestScore(): number {
  const val = safeGetItem('one_second_endless_best_score');
  return val ? parseInt(val, 10) || 0 : 0;
}

export function saveEndlessBestScore(score: number): void {
  const current = getEndlessBestScore();
  if (score > current) {
    safeSetItem('one_second_endless_best_score', score.toString());
  }
}

export function getEndlessBestSurvival(): number {
  const val = safeGetItem('one_second_endless_best_survival');
  return val ? parseInt(val, 10) || 0 : 0;
}

export function saveEndlessBestSurvival(seconds: number): void {
  const current = getEndlessBestSurvival();
  if (seconds > current) {
    safeSetItem('one_second_endless_best_survival', Math.round(seconds).toString());
  }
}

// --- V5 LOCAL LEADERBOARD ---

const DEFAULT_AI_OPPONENTS: LeaderboardEntry[] = [
  { id: 'ai_flash', playerName: 'Flash', score: 215, mode: 'CLASSIC', date: '2026-10-01' },
  { id: 'ai_speedx', playerName: 'SpeedX', score: 168, mode: 'CLASSIC', date: '2026-10-02' },
  { id: 'ai_shadow', playerName: 'Shadow', score: 124, mode: 'CLASSIC', date: '2026-10-03' },
  { id: 'ai_nova', playerName: 'Nova', score: 88, mode: 'CLASSIC', date: '2026-10-04' },
  { id: 'ai_blaze', playerName: 'Blaze', score: 54, mode: 'CLASSIC', date: '2026-10-05' },
  { id: 'ai_apex', playerName: 'Apex', score: 36, mode: 'CLASSIC', date: '2026-10-06' },
  { id: 'ai_phantom', playerName: 'Phantom', score: 22, mode: 'CLASSIC', date: '2026-10-06' },
  { id: 'ai_rush', playerName: 'Rush', score: 12, mode: 'CLASSIC', date: '2026-10-07' },
];

export function getLeaderboard(): LeaderboardEntry[] {
  const raw = safeGetItem('one_second_leaderboard_v5');
  const playerName = getPlayerNickname();
  const playerScore = getBestScore();

  let entries: LeaderboardEntry[] = [];
  if (raw) {
    try {
      entries = JSON.parse(raw);
    } catch {
      entries = [];
    }
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    entries = [...DEFAULT_AI_OPPONENTS];
  }

  // Ensure player entry exists and reflects current nickname & best score
  const playerIndex = entries.findIndex((e) => e.isPlayer || e.id === 'player_you');
  if (playerIndex >= 0) {
    entries[playerIndex].playerName = playerName;
    if (playerScore > entries[playerIndex].score) {
      entries[playerIndex].score = playerScore;
    }
  } else {
    entries.push({
      id: 'player_you',
      playerName,
      score: playerScore,
      mode: 'CLASSIC',
      date: getTodayDateKey(),
      isPlayer: true,
    });
  }

  // Sort descending by score
  entries.sort((a, b) => b.score - a.score);

  return entries;
}

export function saveLeaderboard(entries: LeaderboardEntry[]): void {
  safeSetItem('one_second_leaderboard_v5', JSON.stringify(entries));
}

export function updatePlayerLeaderboardScore(score: number, mode: GameMode = 'CLASSIC'): LeaderboardEntry[] {
  const entries = getLeaderboard();
  const playerName = getPlayerNickname();
  const playerIndex = entries.findIndex((e) => e.isPlayer || e.id === 'player_you');

  if (playerIndex >= 0) {
    entries[playerIndex].playerName = playerName;
    if (score > entries[playerIndex].score) {
      entries[playerIndex].score = score;
      entries[playerIndex].mode = mode;
      entries[playerIndex].date = getTodayDateKey();
    }
  } else {
    entries.push({
      id: 'player_you',
      playerName,
      score,
      mode,
      date: getTodayDateKey(),
      isPlayer: true,
    });
  }

  entries.sort((a, b) => b.score - a.score);
  saveLeaderboard(entries);
  return entries;
}

// --- V5 DAILY STREAK SYSTEM ---

export const STREAK_REWARDS: Record<number, number> = {
  1: 10,
  2: 15,
  3: 20,
  4: 30,
  5: 40,
  6: 50,
  7: 100,
};

export function getDailyStreak(): DailyStreakData {
  const today = getTodayDateKey();
  const raw = safeGetItem('one_second_streak_v5');

  let data = {
    currentStreak: 0,
    lastClaimDateKey: '',
    claimedToday: false,
  };

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      data.currentStreak = typeof parsed.currentStreak === 'number' ? parsed.currentStreak : 0;
      data.lastClaimDateKey = parsed.lastClaimDateKey || '';
    } catch {
      // fallback
    }
  }

  data.claimedToday = data.lastClaimDateKey === today;

  // Check if streak was broken (missed more than 1 day)
  if (data.lastClaimDateKey && !data.claimedToday) {
    const [ly, lm, ld] = data.lastClaimDateKey.split('-').map(Number);
    const [ty, tm, td] = today.split('-').map(Number);
    const lastDate = new Date(ly, (lm || 1) - 1, ld || 1);
    const nowDate = new Date(ty, (tm || 1) - 1, td || 1);
    const diffDays = Math.round((nowDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 1) {
      // Streak lapsed, reset to 0 (so next claim is Day 1)
      data.currentStreak = 0;
    }
  }

  return data;
}

export function claimDailyStreakReward(): {
  success: boolean;
  coinsAwarded: number;
  streak: number;
  message: string;
} {
  const today = getTodayDateKey();
  const streakData = getDailyStreak();

  if (streakData.claimedToday) {
    return {
      success: false,
      coinsAwarded: 0,
      streak: streakData.currentStreak,
      message: 'Already claimed today! Return tomorrow for the next streak reward.',
    };
  }

  // Calculate new streak count (cycles after 7, or resets if broken)
  const nextStreak = (streakData.currentStreak % 7) + 1;
  const coinsAwarded = STREAK_REWARDS[nextStreak] || 15;

  const updatedData = {
    currentStreak: nextStreak,
    lastClaimDateKey: today,
    claimedToday: true,
  };

  safeSetItem('one_second_streak_v5', JSON.stringify(updatedData));
  addCoins(coinsAwarded);

  return {
    success: true,
    coinsAwarded,
    streak: nextStreak,
    message: nextStreak === 7
      ? `🎉 DAY 7 JACKPOT CLAIMED! +${coinsAwarded} Coins!`
      : `🔥 DAY ${nextStreak} STREAK! +${coinsAwarded} Coins!`,
  };
}

// --- V6 CHALLENGE MODE SYSTEM ---

export const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 1,
    title: 'Score Master',
    subtitle: '[01] Score Master',
    description: 'Score 15 points without losing a life',
    rewardCoins: 35,
    targetType: 'score_no_death',
    targetValue: 15,
    unlocked: true,
    completed: false,
  },
  {
    id: 2,
    title: 'Perfect Hands',
    subtitle: '[02] Perfect Hands',
    description: 'Get 5 PERFECT reactions in one run',
    rewardCoins: 45,
    targetType: 'perfect_count',
    targetValue: 5,
    unlocked: false,
    completed: false,
  },
  {
    id: 3,
    title: 'Combo King',
    subtitle: '[03] Combo King',
    description: 'Reach a x10 combo streak',
    rewardCoins: 50,
    targetType: 'combo_reach',
    targetValue: 10,
    unlocked: false,
    completed: false,
  },
  {
    id: 4,
    title: 'Survivor',
    subtitle: '[04] Survivor',
    description: 'Survive for 45 seconds',
    rewardCoins: 60,
    targetType: 'survival_time',
    targetValue: 45,
    unlocked: false,
    completed: false,
  },
  {
    id: 5,
    title: 'Boss Hunter',
    subtitle: '[05] Boss Hunter',
    description: 'Defeat 1 Boss or Mini Boss',
    rewardCoins: 75,
    targetType: 'boss_defeat',
    targetValue: 1,
    unlocked: false,
    completed: false,
  },
  {
    id: 6,
    title: 'Coin Collector',
    subtitle: '[06] Coin Collector',
    description: 'Collect 30 coins in one run',
    rewardCoins: 50,
    targetType: 'coins_collect',
    targetValue: 30,
    unlocked: false,
    completed: false,
  },
  {
    id: 7,
    title: 'Close Call',
    subtitle: '[07] Close Call',
    description: 'Get 3 Near Misses in one run',
    rewardCoins: 65,
    targetType: 'near_miss',
    targetValue: 3,
    unlocked: false,
    completed: false,
  },
  {
    id: 8,
    title: 'Speed Demon',
    subtitle: '[08] Speed Demon',
    description: 'Score 50 points in one run',
    rewardCoins: 100,
    targetType: 'score_reach',
    targetValue: 50,
    unlocked: false,
    completed: false,
  },
];

export function getChallenges(): Challenge[] {
  const raw = safeGetItem('one_second_challenges_v6');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return INITIAL_CHALLENGES.map((tmpl, idx) => {
          const saved = parsed.find((p: any) => p && p.id === tmpl.id);
          if (saved) {
            return {
              ...tmpl,
              unlocked: saved.unlocked ?? (idx === 0),
              completed: Boolean(saved.completed),
            };
          }
          return {
            ...tmpl,
            unlocked: idx === 0,
            completed: false,
          };
        });
      }
    } catch {
      // fallback
    }
  }

  // Save initial template
  safeSetItem('one_second_challenges_v6', JSON.stringify(INITIAL_CHALLENGES));
  return INITIAL_CHALLENGES;
}

export function saveChallenges(challenges: Challenge[]): void {
  safeSetItem('one_second_challenges_v6', JSON.stringify(challenges));
}

export function completeChallenge(challengeId: number): {
  success: boolean;
  coinsAwarded: number;
  nextUnlockedId?: number;
  challengeTitle: string;
} {
  const challenges = getChallenges();
  const index = challenges.findIndex((c) => c.id === challengeId);
  if (index === -1) {
    return { success: false, coinsAwarded: 0, challengeTitle: '' };
  }

  const challenge = challenges[index];
  if (challenge.completed) {
    return { success: false, coinsAwarded: 0, challengeTitle: challenge.title };
  }

  // Mark current completed
  challenge.completed = true;
  addCoins(challenge.rewardCoins);

  // Unlock next challenge if exists
  let nextUnlockedId: number | undefined = undefined;
  if (index + 1 < challenges.length) {
    challenges[index + 1].unlocked = true;
    nextUnlockedId = challenges[index + 1].id;
  }

  saveChallenges(challenges);

  return {
    success: true,
    coinsAwarded: challenge.rewardCoins,
    nextUnlockedId,
    challengeTitle: challenge.title,
  };
}

export function checkChallengeGoalProgress(
  challenge: Challenge,
  stats: {
    score: number;
    lives: number;
    perfectCount: number;
    maxCombo: number;
    survivalTimeSec: number;
    bossesDefeated: number;
    coinsEarnedThisRun: number;
    nearMisses: number;
  }
): { isMet: boolean; currentVal: number; targetVal: number } {
  let currentVal = 0;
  const targetVal = challenge.targetValue;
  let isMet = false;

  switch (challenge.targetType) {
    case 'score_no_death':
      currentVal = stats.score;
      isMet = stats.score >= targetVal && stats.lives === 3;
      break;
    case 'perfect_count':
      currentVal = stats.perfectCount;
      isMet = stats.perfectCount >= targetVal;
      break;
    case 'combo_reach':
      currentVal = stats.maxCombo;
      isMet = stats.maxCombo >= targetVal;
      break;
    case 'survival_time':
      currentVal = Math.floor(stats.survivalTimeSec);
      isMet = stats.survivalTimeSec >= targetVal;
      break;
    case 'boss_defeat':
      currentVal = stats.bossesDefeated;
      isMet = stats.bossesDefeated >= targetVal;
      break;
    case 'coins_collect':
      currentVal = stats.coinsEarnedThisRun;
      isMet = stats.coinsEarnedThisRun >= targetVal;
      break;
    case 'near_miss':
      currentVal = stats.nearMisses;
      isMet = stats.nearMisses >= targetVal;
      break;
    case 'score_reach':
      currentVal = stats.score;
      isMet = stats.score >= targetVal;
      break;
  }

  return { isMet, currentVal, targetVal };
}

// --- GHOST RUN STORAGE (Requirement 1, 2, 6, 9) ---

export function getGhostRun(): GhostRun | null {
  const raw = safeGetItem('one_second_ghost_run');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.finalScore === 'number' && Array.isArray(parsed.events)) {
      return parsed as GhostRun;
    }
  } catch {
    // ignore corrupt data
  }
  return null;
}

export function saveGhostRun(run: GhostRun): void {
  try {
    // Keep events array bounded for safety and performance (max 350 events)
    const boundedRun: GhostRun = {
      ...run,
      events: run.events.slice(0, 350),
    };
    safeSetItem('one_second_ghost_run', JSON.stringify(boundedRun));
  } catch {
    // fallback
  }
}

export function hasGhostRun(): boolean {
  return getGhostRun() !== null;
}

// --- V9 DATA SAFETY & MIGRATION INITIALIZER ---

export function initializeSaveDataMigration(): void {
  try {
    const version = safeGetItem('one_second_schema_version');
    const numericVersion = version ? parseInt(version, 10) : 0;

    if (numericVersion < 9) {
      // Safe migration: verify and normalize all player progression and gameplay records
      getLeaderboard();
      getDailyStreak();
      getChallenges();
      getMissions();
      getUserStats();
      getPurchasedSkins();

      // Ensure progression primitives have safe numeric/string values
      const level = safeGetItem('one_second_player_level');
      if (!level || isNaN(parseInt(level, 10)) || parseInt(level, 10) < 1) {
        safeSetItem('one_second_player_level', '1');
      }

      const xp = safeGetItem('one_second_player_xp');
      if (!xp || isNaN(parseInt(xp, 10)) || parseInt(xp, 10) < 0) {
        safeSetItem('one_second_player_xp', '0');
      }

      const totalXp = safeGetItem('one_second_total_xp');
      if (!totalXp || isNaN(parseInt(totalXp, 10)) || parseInt(totalXp, 10) < 0) {
        safeSetItem('one_second_total_xp', '0');
      }

      const equippedTitle = safeGetItem('one_second_equipped_title');
      if (!equippedTitle) {
        safeSetItem('one_second_equipped_title', 'ROOKIE');
      }

      const unlockedTitles = safeGetItem('one_second_unlocked_titles');
      if (!unlockedTitles) {
        safeSetItem('one_second_unlocked_titles', JSON.stringify(['ROOKIE']));
      } else {
        try {
          const parsedTitles = JSON.parse(unlockedTitles);
          if (!Array.isArray(parsedTitles) || !parsedTitles.includes('ROOKIE')) {
            safeSetItem('one_second_unlocked_titles', JSON.stringify(['ROOKIE']));
          }
        } catch {
          safeSetItem('one_second_unlocked_titles', JSON.stringify(['ROOKIE']));
        }
      }

      // Ensure equipped skin is valid
      const equippedSkin = safeGetItem('one_second_equipped_skin');
      if (!equippedSkin || !(equippedSkin in SKINS)) {
        safeSetItem('one_second_equipped_skin', 'classic');
      }

      safeSetItem('one_second_schema_version', '9');
    }
  } catch {
    // Fail-safe recovery: safeGetItem handles corrupt fallback transparently
  }
}

// Performance mode settings (Requirement 9: Smooth performance on low-end Android phones)
export function getPerformanceMode(): boolean {
  const saved = safeGetItem('one_second_perf_mode');
  if (saved !== null) {
    return saved === 'true';
  }
  // Auto-detect budget mobile hardware
  if (typeof navigator !== 'undefined') {
    const nav = navigator as any;
    if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4) {
      return true;
    }
    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4) {
      return true;
    }
  }
  return false;
}

export function savePerformanceMode(enabled: boolean): void {
  safeSetItem('one_second_perf_mode', enabled ? 'true' : 'false');
}

// Run migration check on module load
initializeSaveDataMigration();


