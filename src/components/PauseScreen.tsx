import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface PauseScreenProps {
  score: number;
  combo: number;
  lives: number;
  isMuted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  onToggleMute: () => void;
}

export const PauseScreen: React.FC<PauseScreenProps> = ({
  score,
  combo,
  lives,
  isMuted,
  onResume,
  onRestart,
  onHome,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md text-white select-none">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* Paused Badge */}
        <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold font-mono-numbers uppercase tracking-widest mb-2">
          GAME PAUSED
        </div>

        <h2 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-white mb-6">
          TAKE A BREATH
        </h2>

        {/* Current Run Quick Stats */}
        <div className="grid grid-cols-3 gap-2 w-full mb-6">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SCORE</span>
            <span className="font-display text-2xl font-black text-cyan-400 font-mono-numbers">{score}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">COMBO</span>
            <span className="font-display text-2xl font-black text-amber-400 font-mono-numbers">{combo}x</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">LIVES</span>
            <span className="font-display text-2xl font-black text-rose-400 font-mono-numbers">{lives}/3</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onResume();
            }}
            className="w-full h-14 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display text-xl font-black tracking-wide flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all cursor-pointer active:scale-95"
          >
            <Play className="w-5 h-5 fill-slate-950 stroke-[2]" />
            <span>RESUME</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onRestart();
            }}
            className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>RESTART</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onHome();
            }}
            className="w-full h-12 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-300 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4 text-purple-400" />
            <span>HOME</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span>{isMuted ? 'Sound: OFF (Click to Unmute)' : 'Sound: ON (Click to Mute)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
