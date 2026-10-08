import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Action } from '../types/game';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface ActionControlsProps {
  onAction: (action: Action) => void;
  disabled?: boolean;
  highlightAction?: Action | null;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
  onAction,
  disabled = false,
  highlightAction = null,
}) => {
  const [activeBtn, setActiveBtn] = useState<Action | null>(null);
  const touchHandledRef = useRef<number>(0);

  const handleTrigger = useCallback(
    (action: Action) => {
      if (disabled) return;
      setActiveBtn(action);
      soundEngine.triggerHaptic('light');
      onAction(action);
      setTimeout(() => {
        setActiveBtn((prev) => (prev === action ? null : prev));
      }, 100);
    },
    [disabled, onAction]
  );

  const handleTouchStart = (action: Action, e: React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    touchHandledRef.current = performance.now();
    handleTrigger(action);
  };

  const handleTouchEnd = (action: Action, e: React.TouchEvent) => {
    e.preventDefault();
    setActiveBtn((prev) => (prev === action ? null : prev));
  };

  const handleTouchCancel = (action: Action) => {
    setActiveBtn((prev) => (prev === action ? null : prev));
  };

  const handleClick = (action: Action) => {
    // Prevent duplicated trigger if touch event just occurred
    if (performance.now() - touchHandledRef.current < 350) return;
    handleTrigger(action);
  };

  // Keyboard navigation listener (Arrow keys, WASD, Space for Jump)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      const key = e.key.toLowerCase();
      if (key === 'arrowup' || key === 'w' || key === ' ') {
        e.preventDefault();
        handleTrigger('JUMP');
      } else if (key === 'arrowdown' || key === 's') {
        e.preventDefault();
        handleTrigger('SLIDE');
      } else if (key === 'arrowleft' || key === 'a') {
        e.preventDefault();
        handleTrigger('LEFT');
      } else if (key === 'arrowright' || key === 'd') {
        e.preventDefault();
        handleTrigger('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, handleTrigger]);

  return (
    <div className="w-full max-w-md mx-auto px-2.5 sm:px-4 pb-2.5 sm:pb-3.5 pt-0.5 select-none touch-none">
      {/* 4 Responsive Arcade Action Buttons with instant tactile tap feedback */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        {/* LEFT BUTTON */}
        <button
          type="button"
          disabled={disabled}
          onTouchStart={(e) => handleTouchStart('LEFT', e)}
          onTouchEnd={(e) => handleTouchEnd('LEFT', e)}
          onTouchCancel={() => handleTouchCancel('LEFT')}
          onClick={() => handleClick('LEFT')}
          className={`relative flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 min-h-[54px] sm:min-h-[62px] rounded-2xl border-2 transition-all duration-75 select-none touch-none cursor-pointer ${
            activeBtn === 'LEFT'
              ? 'bg-purple-600 text-white border-purple-200 border-b-2 ring-2 ring-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.7)] translate-y-1 scale-[0.96]'
              : highlightAction === 'LEFT'
              ? 'bg-purple-950/90 border-purple-400 border-b-4 border-b-purple-600 text-white ring-2 ring-purple-400/80 shadow-[0_4px_16px_rgba(168,85,247,0.35)]'
              : 'bg-slate-900/90 hover:bg-purple-950/70 border-purple-500/60 border-b-4 border-b-purple-700/80 text-purple-100 shadow-[0_4px_12px_rgba(0,0,0,0.4)] active:translate-y-1 active:border-b-2 active:scale-[0.96]'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
              activeBtn === 'LEFT' ? 'bg-purple-400 text-slate-950 border-white' : 'bg-purple-900/60 border-purple-400/50 text-purple-200'
            }`}>
              <ArrowLeft className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[3.5]" />
            </div>
            <div className="text-left">
              <span className="block font-display text-sm sm:text-base font-black tracking-wider text-white">LEFT</span>
              <span className="block text-[9.5px] sm:text-[10px] text-purple-200/90 font-bold uppercase tracking-tight">Dodge Left</span>
            </div>
          </div>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/60 text-[10px] font-mono-numbers text-purple-200 font-bold">
            A / ←
          </span>
        </button>

        {/* RIGHT BUTTON */}
        <button
          type="button"
          disabled={disabled}
          onTouchStart={(e) => handleTouchStart('RIGHT', e)}
          onTouchEnd={(e) => handleTouchEnd('RIGHT', e)}
          onTouchCancel={() => handleTouchCancel('RIGHT')}
          onClick={() => handleClick('RIGHT')}
          className={`relative flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 min-h-[54px] sm:min-h-[62px] rounded-2xl border-2 transition-all duration-75 select-none touch-none cursor-pointer ${
            activeBtn === 'RIGHT'
              ? 'bg-orange-600 text-white border-orange-200 border-b-2 ring-2 ring-orange-300 shadow-[0_0_20px_rgba(249,115,22,0.7)] translate-y-1 scale-[0.96]'
              : highlightAction === 'RIGHT'
              ? 'bg-orange-950/90 border-orange-400 border-b-4 border-b-orange-600 text-white ring-2 ring-orange-400/80 shadow-[0_4px_16px_rgba(249,115,22,0.35)]'
              : 'bg-slate-900/90 hover:bg-orange-950/70 border-orange-500/60 border-b-4 border-b-orange-700/80 text-orange-100 shadow-[0_4px_12px_rgba(0,0,0,0.4)] active:translate-y-1 active:border-b-2 active:scale-[0.96]'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
              activeBtn === 'RIGHT' ? 'bg-orange-400 text-slate-950 border-white' : 'bg-orange-900/60 border-orange-400/50 text-orange-200'
            }`}>
              <ArrowRight className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[3.5]" />
            </div>
            <div className="text-left">
              <span className="block font-display text-sm sm:text-base font-black tracking-wider text-white">RIGHT</span>
              <span className="block text-[9.5px] sm:text-[10px] text-orange-200/90 font-bold uppercase tracking-tight">Dodge Right</span>
            </div>
          </div>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-orange-950/80 border border-orange-500/60 text-[10px] font-mono-numbers text-orange-200 font-bold">
            D / →
          </span>
        </button>

        {/* JUMP BUTTON */}
        <button
          type="button"
          disabled={disabled}
          onTouchStart={(e) => handleTouchStart('JUMP', e)}
          onTouchEnd={(e) => handleTouchEnd('JUMP', e)}
          onTouchCancel={() => handleTouchCancel('JUMP')}
          onClick={() => handleClick('JUMP')}
          className={`relative flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 min-h-[54px] sm:min-h-[62px] rounded-2xl border-2 transition-all duration-75 select-none touch-none cursor-pointer ${
            activeBtn === 'JUMP'
              ? 'bg-amber-500 text-slate-950 border-amber-100 border-b-2 ring-2 ring-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.7)] translate-y-1 scale-[0.96]'
              : highlightAction === 'JUMP'
              ? 'bg-amber-950/90 border-amber-400 border-b-4 border-b-amber-600 text-white ring-2 ring-amber-400/80 shadow-[0_4px_16px_rgba(245,158,11,0.35)]'
              : 'bg-slate-900/90 hover:bg-amber-950/70 border-amber-500/60 border-b-4 border-b-amber-700/80 text-amber-100 shadow-[0_4px_12px_rgba(0,0,0,0.4)] active:translate-y-1 active:border-b-2 active:scale-[0.96]'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
              activeBtn === 'JUMP' ? 'bg-amber-300 text-slate-950 border-white' : 'bg-amber-900/60 border-amber-400/50 text-amber-200'
            }`}>
              <ArrowUp className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[3.5]" />
            </div>
            <div className="text-left">
              <span className="block font-display text-sm sm:text-base font-black tracking-wider text-white">JUMP</span>
              <span className="block text-[9.5px] sm:text-[10px] text-amber-200/90 font-bold uppercase tracking-tight">Leap Over</span>
            </div>
          </div>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-[10px] font-mono-numbers text-amber-200 font-bold">
            W / ↑
          </span>
        </button>

        {/* SLIDE BUTTON */}
        <button
          type="button"
          disabled={disabled}
          onTouchStart={(e) => handleTouchStart('SLIDE', e)}
          onTouchEnd={(e) => handleTouchEnd('SLIDE', e)}
          onTouchCancel={() => handleTouchCancel('SLIDE')}
          onClick={() => handleClick('SLIDE')}
          className={`relative flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 min-h-[54px] sm:min-h-[62px] rounded-2xl border-2 transition-all duration-75 select-none touch-none cursor-pointer ${
            activeBtn === 'SLIDE'
              ? 'bg-cyan-500 text-slate-950 border-cyan-100 border-b-2 ring-2 ring-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.7)] translate-y-1 scale-[0.96]'
              : highlightAction === 'SLIDE'
              ? 'bg-cyan-950/90 border-cyan-400 border-b-4 border-b-cyan-600 text-white ring-2 ring-cyan-400/80 shadow-[0_4px_16px_rgba(6,182,212,0.35)]'
              : 'bg-slate-900/90 hover:bg-cyan-950/70 border-cyan-500/60 border-b-4 border-b-cyan-700/80 text-cyan-100 shadow-[0_4px_12px_rgba(0,0,0,0.4)] active:translate-y-1 active:border-b-2 active:scale-[0.96]'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
              activeBtn === 'SLIDE' ? 'bg-cyan-300 text-slate-950 border-white' : 'bg-cyan-900/60 border-cyan-400/50 text-cyan-200'
            }`}>
              <ArrowDown className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[3.5]" />
            </div>
            <div className="text-left">
              <span className="block font-display text-sm sm:text-base font-black tracking-wider text-white">SLIDE</span>
              <span className="block text-[9.5px] sm:text-[10px] text-cyan-200/90 font-bold uppercase tracking-tight">Duck Under</span>
            </div>
          </div>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/60 text-[10px] font-mono-numbers text-cyan-200 font-bold">
            S / ↓
          </span>
        </button>
      </div>
    </div>
  );
};
