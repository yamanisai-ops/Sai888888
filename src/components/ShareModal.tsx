import React, { useState } from 'react';
import { Copy, Check, X, Share2, Sparkles } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface ShareModalProps {
  shareText: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ shareText, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    soundEngine.playClick();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // clipboard write error
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl flex flex-col items-center gap-3 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Share Icon */}
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-md">
          <Share2 className="w-6 h-6" />
        </div>

        <h3 className="font-display text-2xl font-black text-white tracking-tight">
          SHARE YOUR SCORE
        </h3>

        <p className="text-xs text-slate-400">
          Copy this text to challenge your friends on WhatsApp, Discord, X, or anywhere!
        </p>

        {/* Formatted Text Box */}
        <div className="w-full p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left font-mono-numbers text-xs text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
          {shareText}
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className={`w-full h-12 rounded-2xl font-display text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
            copied
              ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
              : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 hover:brightness-110 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>COPIED TO CLIPBOARD!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 stroke-[2]" />
              <span>COPY TO CLIPBOARD</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
