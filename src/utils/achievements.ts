import { Achievement, AchievementId } from '../types/game';
import { safeGetItem, safeSetItem } from './storage';

export const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Score 10 points',
    iconName: 'Footprints',
  },
  {
    id: 'fast_hands',
    title: 'Fast Hands',
    description: 'Get 5 Perfect reactions',
    iconName: 'Zap',
  },
  {
    id: 'combo_master',
    title: 'Combo Master',
    description: 'Reach x10 Combo & Fever',
    iconName: 'Flame',
  },
  {
    id: 'survivor',
    title: 'Survivor',
    description: 'Reach 30 score',
    iconName: 'ShieldCheck',
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Reach 50 score',
    iconName: 'Trophy',
  },
  {
    id: 'close_call',
    title: 'Close Call',
    description: 'Perform 10 Near Misses',
    iconName: 'AlertTriangle',
  },
  {
    id: 'power_player',
    title: 'Power Player',
    description: 'Collect 25 Power-Ups',
    iconName: 'Sparkles',
  },
  {
    id: 'boss_hunter',
    title: 'Boss Hunter',
    description: 'Defeat 3 Boss Challenges',
    iconName: 'Swords',
  },
  {
    id: 'untouchable',
    title: 'Untouchable',
    description: 'Reach x20 Combo streak',
    iconName: 'Flame',
  },
  {
    id: 'legend',
    title: 'Legend',
    description: 'Score 100 points',
    iconName: 'Crown',
  },
];

export function getStoredAchievements(): string[] {
  const raw = safeGetItem('one_second_achievements');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  return [];
}

export function saveAchievement(id: AchievementId): boolean {
  const current = getStoredAchievements();
  if (!current.includes(id)) {
    current.push(id);
    safeSetItem('one_second_achievements', JSON.stringify(current));
    return true; // Newly unlocked!
  }
  return false;
}
