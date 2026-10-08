import { RankId, RankInfo } from '../types/game';

export const RANKS: RankInfo[] = [
  {
    id: 'ROOKIE',
    name: 'ROOKIE',
    minScore: 0,
    maxScore: 9,
    color: '#94a3b8',
    badgeBg: 'bg-slate-800',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-700',
    iconName: 'Footprints',
    quote: 'Taking the first reflex steps',
  },
  {
    id: 'RUNNER',
    name: 'RUNNER',
    minScore: 10,
    maxScore: 24,
    color: '#38bdf8',
    badgeBg: 'bg-sky-950/60',
    textColor: 'text-sky-300',
    borderColor: 'border-sky-500/40',
    iconName: 'Zap',
    quote: 'Finding your arcade rhythm',
  },
  {
    id: 'FAST',
    name: 'FAST',
    minScore: 25,
    maxScore: 49,
    color: '#a855f7',
    badgeBg: 'bg-purple-950/60',
    textColor: 'text-purple-300',
    borderColor: 'border-purple-500/40',
    iconName: 'Sparkles',
    quote: 'Sub-second decision making',
  },
  {
    id: 'ELITE',
    name: 'ELITE',
    minScore: 50,
    maxScore: 99,
    color: '#eab308',
    badgeBg: 'bg-amber-950/60',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-500/40',
    iconName: 'ShieldCheck',
    quote: 'Incredible focus and agility',
  },
  {
    id: 'MASTER',
    name: 'MASTER',
    minScore: 100,
    maxScore: 199,
    color: '#f97316',
    badgeBg: 'bg-orange-950/60',
    textColor: 'text-orange-300',
    borderColor: 'border-orange-500/40',
    iconName: 'Flame',
    quote: 'Near-instantaneous reflexes',
  },
  {
    id: 'LEGEND',
    name: 'LEGEND',
    minScore: 200,
    maxScore: 499,
    color: '#ec4899',
    badgeBg: 'bg-pink-950/60',
    textColor: 'text-pink-300',
    borderColor: 'border-pink-500/40',
    iconName: 'Crown',
    quote: 'A myth on the neon tracks',
  },
  {
    id: 'GOD',
    name: 'ONE SECOND GOD',
    minScore: 500,
    maxScore: 99999,
    color: '#facc15',
    badgeBg: 'bg-yellow-950/70',
    textColor: 'text-yellow-300',
    borderColor: 'border-yellow-400',
    iconName: 'Trophy',
    quote: 'Transcending the speed of thought',
  },
];

export function getRankForScore(score: number): RankInfo {
  const safeScore = Math.max(0, score || 0);
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (safeScore >= RANKS[i].minScore) {
      return RANKS[i];
    }
  }
  return RANKS[0];
}

export function getNextRank(currentRankId: RankId): RankInfo | null {
  const idx = RANKS.findIndex((r) => r.id === currentRankId);
  if (idx !== -1 && idx < RANKS.length - 1) {
    return RANKS[idx + 1];
  }
  return null;
}

export function getRankProgress(score: number): {
  current: RankInfo;
  next: RankInfo | null;
  progressPercent: number;
  pointsToNext: number;
} {
  const current = getRankForScore(score);
  const next = getNextRank(current.id);

  if (!next) {
    return {
      current,
      next: null,
      progressPercent: 100,
      pointsToNext: 0,
    };
  }

  const range = next.minScore - current.minScore;
  const currentProgress = Math.max(0, score - current.minScore);
  const percent = Math.min(100, Math.round((currentProgress / range) * 100));
  const pointsToNext = Math.max(0, next.minScore - score);

  return {
    current,
    next,
    progressPercent: percent,
    pointsToNext,
  };
}

export function hasRankedUp(oldBestScore: number, newScore: number): boolean {
  if (newScore <= oldBestScore) return false;
  const oldRank = getRankForScore(oldBestScore);
  const newRank = getRankForScore(newScore);
  const oldIdx = RANKS.findIndex((r) => r.id === oldRank.id);
  const newIdx = RANKS.findIndex((r) => r.id === newRank.id);
  return newIdx > oldIdx;
}
