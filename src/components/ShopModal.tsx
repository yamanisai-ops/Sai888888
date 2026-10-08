import React, { useState } from 'react';
import { ArrowLeft, Check, Coins, Sparkles, Lock, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Skin, SkinId } from '../types/game';
import { ALL_SKINS_LIST } from '../utils/skins';
import { soundEngine } from '../audio/soundEngine';

interface ShopModalProps {
  coins: number;
  purchasedSkins: SkinId[];
  equippedSkin: SkinId;
  onBuySkin: (skinId: SkinId) => void;
  onEquipSkin: (skinId: SkinId) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  coins,
  purchasedSkins,
  equippedSkin,
  onBuySkin,
  onEquipSkin,
  onClose,
}) => {
  const [selectedPreview, setSelectedPreview] = useState<SkinId>(equippedSkin);
  const [justPurchased, setJustPurchased] = useState<SkinId | null>(null);

  const handleBuy = (skin: Skin) => {
    if (coins >= skin.price && !purchasedSkins.includes(skin.id)) {
      soundEngine.playPurchase();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.5 },
          colors: ['#f59e0b', '#38bdf8', '#10b981', '#ec4899'],
        });
      } catch {
        // Fallback
      }
      onBuySkin(skin.id);
      setSelectedPreview(skin.id);
      setJustPurchased(skin.id);
      setTimeout(() => setJustPurchased(null), 1600);
    } else {
      soundEngine.playHit();
    }
  };

  const handleEquip = (skinId: SkinId) => {
    soundEngine.playClick();
    onEquipSkin(skinId);
  };

  const previewSkin = ALL_SKINS_LIST.find((s) => s.id === selectedPreview) || ALL_SKINS_LIST[0];

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
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>SKIN SHOP</span>
        </div>

        {/* Current Coin Balance */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 font-mono-numbers font-black text-sm shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <Coins className="w-4 h-4 text-amber-400" />
          <span>{coins}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-8">
        {/* Large Skin Showcase Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center relative overflow-hidden mb-5">
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono-numbers border border-slate-700 bg-slate-900/80 text-slate-300">
            {previewSkin.accentBadge}
          </div>

          {/* Visual Avatar Preview */}
          <div className="w-24 h-24 mx-auto my-2 rounded-2xl flex items-center justify-center relative shadow-lg" style={{ backgroundColor: `${previewSkin.suitColor}22` }}>
            <div className="relative flex flex-col items-center">
              {/* Special accessory preview */}
              {previewSkin.id === 'robot' && (
                <div className="w-1.5 h-3 bg-slate-400 rounded-t-full -mb-0.5 relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-2 -left-0.5 shadow-[0_0_8px_#10b981]" />
                </div>
              )}
              {previewSkin.id === 'fire' && (
                <div className="w-4 h-3 bg-gradient-to-t from-orange-500 to-amber-300 rounded-t-full -mb-1 animate-pulse" />
              )}
              {previewSkin.id === 'galaxy' && (
                <div className="absolute -inset-2 rounded-full border border-pink-400/40 animate-spin" />
              )}
              {/* Helmet */}
              <div
                className="w-11 h-9 rounded-xl flex items-center justify-center relative shadow-md"
                style={{ backgroundColor: previewSkin.helmetColor }}
              >
                {/* Visor */}
                <div
                  className="w-8 h-3.5 rounded-md shadow-sm"
                  style={{
                    backgroundColor: previewSkin.visorColor,
                    boxShadow: `0 0 10px ${previewSkin.visorColor}`,
                  }}
                />
              </div>
              {/* Torso */}
              <div
                className="w-9 h-10 rounded-xl mt-1 flex items-center justify-center relative"
                style={{ backgroundColor: previewSkin.suitColor }}
              >
                {/* Core */}
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{
                    backgroundColor: previewSkin.coreColor,
                    boxShadow: `0 0 8px ${previewSkin.coreColor}`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="font-display text-2xl font-black text-white mt-2">
            {previewSkin.name}
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mt-0.5">
            {previewSkin.description}
          </p>
        </div>

        {/* 6 Skin Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {ALL_SKINS_LIST.map((skin) => {
            const isOwned = purchasedSkins.includes(skin.id);
            const isEquipped = equippedSkin === skin.id;
            const canAfford = coins >= skin.price;

            return (
              <div
                key={skin.id}
                onClick={() => setSelectedPreview(skin.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  selectedPreview === skin.id
                    ? 'border-cyan-400 bg-slate-900/90 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                    : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900/80'
                }`}
              >
                {/* Just Purchased Celebration Overlay */}
                {justPurchased === skin.id && (
                  <div className="absolute inset-0 z-20 bg-gradient-to-tr from-amber-500/95 via-yellow-400/95 to-amber-300/95 flex flex-col items-center justify-center text-slate-950 font-display font-black text-xs animate-in zoom-in-95 duration-200">
                    <Sparkles className="w-6 h-6 animate-spin text-slate-950 mb-0.5" />
                    <span>UNLOCKED!</span>
                  </div>
                )}

                {/* Top Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono-numbers font-bold text-slate-400 uppercase">
                    {skin.accentBadge}
                  </span>
                  {isEquipped ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> EQUIPPED
                    </span>
                  ) : isOwned ? (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                      OWNED
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono-numbers text-[10px] font-bold flex items-center gap-0.5">
                      <Coins className="w-3 h-3 text-amber-400" /> {skin.price}
                    </span>
                  )}
                </div>

                {/* Mini Skin Icon */}
                <div className="my-2 flex justify-center">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center relative shadow-sm"
                    style={{ backgroundColor: `${skin.suitColor}33` }}
                  >
                    <div
                      className="w-6 h-5 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: skin.helmetColor }}
                    >
                      <div
                        className="w-4 h-2 rounded-sm"
                        style={{ backgroundColor: skin.visorColor }}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-center mt-1">
                  <div className="font-display font-black text-sm text-white">
                    {skin.name}
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-3">
                  {isEquipped ? (
                    <div className="w-full py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> ACTIVE
                    </div>
                  ) : isOwned ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEquip(skin.id);
                      }}
                      className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-black transition-colors cursor-pointer active:scale-95 shadow-sm"
                    >
                      EQUIP
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuy(skin);
                      }}
                      className={`w-full py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 active:scale-95 ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-70'
                      }`}
                    >
                      {canAfford ? (
                        <>
                          <Coins className="w-3.5 h-3.5 fill-slate-950" />
                          <span>BUY</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>{skin.price} COINS</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
