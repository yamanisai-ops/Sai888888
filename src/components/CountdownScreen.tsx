import React, { useEffect, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';

interface CountdownScreenProps {
  onComplete: () => void;
}

export const CountdownScreen: React.FC<CountdownScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(3); // 3, 2, 1, 0 (GO!)

  useEffect(() => {
    // Play sound for 3
    soundEngine.playCountdown(3);

    const timer1 = setTimeout(() => {
      setStep(2);
      soundEngine.playCountdown(2);
    }, 850);

    const timer2 = setTimeout(() => {
      setStep(1);
      soundEngine.playCountdown(1);
    }, 1700);

    const timer3 = setTimeout(() => {
      setStep(0);
      soundEngine.playCountdown('GO!');
    }, 2550);

    const timer4 = setTimeout(() => {
      onComplete();
    }, 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  const label = step === 0 ? 'GO!' : step.toString();

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-[2px] select-none pointer-events-none">
      <div className="relative flex flex-col items-center">
        {/* Pulsing ring */}
        <div className="absolute w-48 h-48 rounded-full border-4 border-cyan-400/40 animate-ping" />

        <div
          key={step}
          className="font-display font-black text-8xl sm:text-9xl text-white tracking-tight drop-shadow-[0_0_40px_rgba(56,189,248,0.9)] animate-in zoom-in-50 duration-200"
        >
          {label}
        </div>

        <p className="mt-4 text-xs font-mono-numbers uppercase tracking-widest text-cyan-300 font-bold">
          GET READY TO REACT
        </p>
      </div>
    </div>
  );
};
