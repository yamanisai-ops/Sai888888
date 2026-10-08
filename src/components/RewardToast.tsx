import React from 'react';
import {
  Coins,
  Zap,
  ArrowUpCircle,
  Award,
  Flame,
  Target,
  Trophy,
  Sparkles,
} from 'lucide-react';

export type RewardPopupType =
  | 'COINS'
  | 'XP'
  | 'LEVEL_UP'
  | 'NEW_TITLE'
  | 'DAILY_REWARD'
  | 'CHALLENGE_COMPLETE'
  | 'NEW_RECORD'
  | 'GENERIC';

export interface RewardToastData {
  type?: RewardPopupType;
  title: string;
  subtitle?: string;
  amount?: number;
}

interface RewardToastProps {
  message?: string | null;
  coinsAmount?: number;
  data?: RewardToastData | null;
}

export const RewardToast: React.FC<RewardToastProps> = ({ message, coinsAmount, data }) => {
  if (!data && !message) return null;

  const type = data?.type || (coinsAmount !== undefined ? 'COINS' : 'GENERIC');
  const title = data?.title || message || '';
  const subtitle = data?.subtitle;
  const amount = data?.amount ?? coinsAmount;

  // Render specific theme styling per reward type
  let icon = <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  let badgeStyle =
    'bg-amber-950/90 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]';

  switch (type) {
    case 'XP':
      icon = <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      badgeStyle =
        'bg-cyan-950/90 border-cyan-400/60 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.35)]';
      break;
    case 'LEVEL_UP':
      icon = <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[2.5]" />;
      badgeStyle =
        'bg-emerald-950/90 border-emerald-400/80 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.45)]';
      break;
    case 'NEW_TITLE':
      icon = <Award className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      badgeStyle =
        'bg-purple-950/90 border-purple-400/80 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.45)]';
      break;
    case 'DAILY_REWARD':
      icon = <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 shrink-0" />;
      badgeStyle =
        'bg-orange-950/90 border-orange-500/70 text-orange-300 shadow-[0_0_18px_rgba(249,115,22,0.4)]';
      break;
    case 'CHALLENGE_COMPLETE':
      icon = <Target className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      badgeStyle =
        'bg-sky-950/90 border-sky-400/70 text-sky-300 shadow-[0_0_18px_rgba(14,165,233,0.4)]';
      break;
    case 'NEW_RECORD':
      icon = <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
      badgeStyle =
        'bg-amber-950/90 border-yellow-400/80 text-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.4)]';
      break;
    case 'COINS':
    default:
      icon = <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      badgeStyle =
        'bg-amber-950/90 border-amber-400/70 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)]';
      break;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-13 left-1/2 -translate-x-1/2 z-50 pointer-events-none max-w-[90vw] sm:max-w-xs animate-in slide-in-from-top-2 fade-in duration-200"
    >
      <div
        className={`px-3 py-1.5 rounded-2xl backdrop-blur-md font-display font-black text-xs flex items-center gap-2 border ${badgeStyle}`}
      >
        {icon}
        <div className="flex flex-col min-w-0 text-left">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="tracking-wide truncate uppercase text-[11px] sm:text-xs">
              {title}
            </span>
            {amount !== undefined && amount > 0 && (
              <span className="font-mono-numbers px-1 py-0.2 rounded bg-black/30 text-[10px] font-black shrink-0">
                +{amount} {type === 'XP' ? 'XP' : '🪙'}
              </span>
            )}
          </div>
          {subtitle && (
            <span className="text-[9px] font-sans font-bold opacity-85 truncate leading-tight">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
