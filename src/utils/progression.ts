import { PlayerProgression, PlayerTitle, PlayerTitleId } from '../types/game';
import { getStoredAchievements } from './achievements';
import { addCoins, getBestCombo, getBestReactionTime, getBestScore, getUserStats, safeGetItem, safeSetItem } from './storage';

export const TITLES: Record<PlayerTitleId, PlayerTitle> = {
  ROOKIE: {
    id: 'ROOKIE',
    name: 'ROOKIE',
    description: 'Starting runner title',
    badgeColor: '#94a3b8',
  },
  FAST_HANDS: {
    id: 'FAST_HANDS',
    name: 'FAST HANDS',
    description: 'Reaction time under 250ms or Fast Hands achievement',
    badgeColor: '#06b6d4',
  },
  COMBO_MASTER: {
    id: 'COMBO_MASTER',
    name: 'COMBO MASTER',
    description: 'Reach a x10 combo streak in a run',
    badgeColor: '#ec4899',
  },
  BOSS_HUNTER: {
    id: 'BOSS_HUNTER',
    name: 'BOSS HUNTER',
    description: 'Defeat at least 1 Boss or Mini Boss',
    badgeColor: '#f97316',
  },
  SPEED_DEMON: {
    id: 'SPEED_DEMON',
    name: 'SPEED DEMON',
    description: 'Score 50 or more points in a single run',
    badgeColor: '#eab308',
  },
  ONE_SECOND_LEGEND: {
    id: 'ONE_SECOND_LEGEND',
    name: 'ONE SECOND LEGEND',
    description: 'Reach Level 10 or score 100+ points',
    badgeColor: '#a855f7',
  },
};

/**
 * Calculates XP required to advance from current level to level + 1.
 * Level 1 requires 100 XP. Each subsequent level requires +50 more XP.
 * Level 1 -> 100 XP
 * Level 2 -> 150 XP
 * Level 3 -> 200 XP
 * Level 4 -> 250 XP
 */
export function getXpRequiredForLevel(level: number): number {
  const safeLvl = Math.max(1, level);
  return 100 + (safeLvl - 1) * 50;
}

export function getPlayerLevel(): number {
  const raw = safeGetItem('one_second_player_level');
  return raw ? Math.max(1, parseInt(raw, 10) || 1) : 1;
}

export function getPlayerCurrentXp(): number {
  const raw = safeGetItem('one_second_player_xp');
  return raw ? Math.max(0, parseInt(raw, 10) || 0) : 0;
}

export function getPlayerTotalXp(): number {
  const raw = safeGetItem('one_second_total_xp');
  return raw ? Math.max(0, parseInt(raw, 10) || 0) : 0;
}

export function getEquippedTitle(): PlayerTitleId {
  const raw = safeGetItem('one_second_equipped_title') as PlayerTitleId | null;
  if (raw && TITLES[raw]) {
    return raw;
  }
  return 'ROOKIE';
}

export function setEquippedTitle(titleId: PlayerTitleId): void {
  if (TITLES[titleId]) {
    safeSetItem('one_second_equipped_title', titleId);
  }
}

/**
 * Evaluates which titles are unlocked based on user stats, records, achievements, and level.
 */
export function getUnlockedTitles(levelOverride?: number): PlayerTitleId[] {
  const level = levelOverride ?? getPlayerLevel();
  const achievements = getStoredAchievements();
  const stats = getUserStats();
  const bestScore = getBestScore();
  const bestCombo = getBestCombo();
  const bestReaction = getBestReactionTime();

  const unlocked: PlayerTitleId[] = ['ROOKIE']; // Rookie is always unlocked

  if (achievements.includes('fast_hands') || (bestReaction > 0 && bestReaction <= 250)) {
    unlocked.push('FAST_HANDS');
  }

  if (achievements.includes('combo_master') || bestCombo >= 10) {
    unlocked.push('COMBO_MASTER');
  }

  if (achievements.includes('boss_hunter') || stats.bossesDefeated >= 1) {
    unlocked.push('BOSS_HUNTER');
  }

  if (achievements.includes('speed_demon') || bestScore >= 50) {
    unlocked.push('SPEED_DEMON');
  }

  if (achievements.includes('legend') || level >= 10 || bestScore >= 100) {
    unlocked.push('ONE_SECOND_LEGEND');
  }

  // Persist unlocked titles cache
  safeSetItem('one_second_unlocked_titles', JSON.stringify(unlocked));
  return unlocked;
}

export function getPlayerProgression(): PlayerProgression {
  const level = getPlayerLevel();
  const currentXp = getPlayerCurrentXp();
  const totalXp = getPlayerTotalXp();
  const xpForNextLevel = getXpRequiredForLevel(level);
  const equippedTitle = getEquippedTitle();
  const unlockedTitles = getUnlockedTitles(level);

  return {
    level,
    currentXp,
    xpForNextLevel,
    totalXp,
    equippedTitle,
    unlockedTitles,
  };
}

export interface AddXpResult {
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
  currentXp: number;
  xpForNextLevel: number;
  totalXp: number;
  coinReward: number;
  xpAdded: number;
  newlyUnlockedTitles: PlayerTitleId[];
}

/**
 * Safely awards XP to the player and handles multi-level progression.
 */
export function addPlayerXp(amount: number): AddXpResult {
  if (amount <= 0) {
    const prog = getPlayerProgression();
    return {
      previousLevel: prog.level,
      newLevel: prog.level,
      leveledUp: false,
      currentXp: prog.currentXp,
      xpForNextLevel: prog.xpForNextLevel,
      totalXp: prog.totalXp,
      coinReward: 0,
      xpAdded: 0,
      newlyUnlockedTitles: [],
    };
  }

  const initialTitles = getUnlockedTitles();
  let level = getPlayerLevel();
  let currentXp = getPlayerCurrentXp() + amount;
  const totalXp = getPlayerTotalXp() + amount;

  const previousLevel = level;
  let totalCoinReward = 0;

  // Process level-up threshold loops
  let requiredXp = getXpRequiredForLevel(level);
  while (currentXp >= requiredXp) {
    currentXp -= requiredXp;
    level += 1;
    // Level up reward: 25 coins per level
    const rewardForThisLevel = level * 25;
    totalCoinReward += rewardForThisLevel;
    requiredXp = getXpRequiredForLevel(level);
  }

  const leveledUp = level > previousLevel;

  // Save new values
  safeSetItem('one_second_player_level', level.toString());
  safeSetItem('one_second_player_xp', currentXp.toString());
  safeSetItem('one_second_total_xp', totalXp.toString());

  if (totalCoinReward > 0) {
    addCoins(totalCoinReward);
  }

  // Check for newly unlocked titles
  const updatedTitles = getUnlockedTitles(level);
  const newlyUnlockedTitles = updatedTitles.filter((t) => !initialTitles.includes(t));

  return {
    previousLevel,
    newLevel: level,
    leveledUp,
    currentXp,
    xpForNextLevel: requiredXp,
    totalXp,
    coinReward: totalCoinReward,
    xpAdded: amount,
    newlyUnlockedTitles,
  };
}
