import React, { useState } from 'react';
import { ArrowLeft, Trophy, Medal, Sparkles, User, Globe2 } from 'lucide-react';
import { GameMode, LeaderboardEntry } from '../types/game';
import { getLeaderboard, getPlayerNickname } from '../utils/storage';
import { soundEngine } from '../audio/soundEngine';

interface LeaderboardModalProps {
  onClose: () => void;
  onOpenProfile?: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose, onOpenProfile }) => {
  const [filterMode, setFilterMode] = useState<GameMode | 'ALL'>('ALL');
  const entries: LeaderboardEntry[] = getLeaderboard();
  const currentNickname = getPlayerNickname();

  const filteredEntries = entries.filter((entry) => {
    if (filterMode === 'ALL') return true;
    return entry.mode === filterMode;
  });

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-black text-xs shadow-[0_0_10px_rgba(245,158,11,0.3)]">
          🥇 1
        </div>
      );
    }
    if (index === 1) {
      return (
        <div className="w-7 h-7 rounded-lg bg-slate-300/20 border border-slate-300/40 text-slate-200 flex items-center justify-center font-black text-xs">
          🥈 2
        </div>
      );
    }
    if (index === 2) {
      return (
        <div className="w-7 h-7 rounded-lg bg-amber-700/20 border border-amber-700/40 text-amber-400 flex items-center justify-center font-black text-xs">
          🥉 3
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center font-mono-numbers font-bold text-xs">
        #{index + 1}
      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-slate-950/98 backdrop-blur-xl text-white select-none overflow-hidden animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-900/60">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>BACK</span>
        </button>

        <div className="font-display text-xl font-black tracking-tight text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>LEADERBOARD</span>
        </div>

        {onOpenProfile && (
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onOpenProfile();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>NAME</span>
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full pb-8 flex flex-col gap-3">
        {/* Subtitle Notice: Local / Demo Opponents */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
          <Globe2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block">LOCAL ARCADE BENCHMARKS</span>
            <span className="text-[11px] text-slate-400">
              Compete against realistic AI benchmark runners offline. Change your runner nickname in Profile.
            </span>
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-900/90 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setFilterMode('ALL');
            }}
            className={`flex-1 py-1.5 text-xs font-bold font-display rounded-xl transition-all cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ALL
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setFilterMode('CLASSIC');
            }}
            className={`flex-1 py-1.5 text-xs font-bold font-display rounded-xl transition-all cursor-pointer ${
              filterMode === 'CLASSIC'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            CLASSIC
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setFilterMode('ENDLESS');
            }}
            className={`flex-1 py-1.5 text-xs font-bold font-display rounded-xl transition-all cursor-pointer ${
              filterMode === 'ENDLESS'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ENDLESS
          </button>
        </div>

        {/* Table Header */}
        <div className="flex items-center justify-between px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          <span className="w-12">RANK</span>
          <span className="flex-1 ml-2">PLAYER</span>
          <span className="text-right">SCORE</span>
        </div>

        {/* Rankings List */}
        <div className="flex flex-col gap-2">
          {filteredEntries.map((entry, index) => {
            const isPlayer = entry.isPlayer || entry.playerName === currentNickname;
            return (
              <div
                key={entry.id || `${entry.playerName}_${index}`}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isPlayer
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/40'
                    : 'bg-slate-900/70 border-slate-800'
                }`}
              >
                {/* Rank Badge */}
                <div className="w-12 flex items-center">{getRankBadge(index)}</div>

                {/* Player Name & Tag */}
                <div className="flex-1 min-w-0 mx-2 flex items-center gap-2">
                  <span
                    className={`font-display font-black text-sm truncate ${
                      isPlayer ? 'text-cyan-300' : 'text-white'
                    }`}
                  >
                    {entry.playerName}
                  </span>
                  {isPlayer ? (
                    <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-[9px] font-black uppercase tracking-wider shrink-0">
                      YOU
                    </span>
                  ) : (
                    <span className="px-1 py-0.5 rounded bg-slate-800/80 text-slate-500 text-[9px] font-mono-numbers shrink-0">
                      BOT
                    </span>
                  )}
                  {entry.mode && (
                    <span className="text-[9px] font-mono-numbers text-slate-500 uppercase shrink-0">
                      {entry.mode}
                    </span>
                  )}
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <span
                    className={`font-display text-lg font-black font-mono-numbers ${
                      isPlayer ? 'text-cyan-300' : 'text-amber-300'
                    }`}
                  >
                    {entry.score}
                  </span>
                  <span className="block text-[9px] text-slate-500 uppercase font-mono-numbers">
                    PTS
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
