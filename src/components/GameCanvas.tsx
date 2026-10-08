import React, { useEffect, useRef } from 'react';
import {
  Action,
  ActiveEvent,
  ActivePowerUpState,
  FloatingFeedback,
  Obstacle,
  Player,
  PowerUp,
  RainCoin,
} from '../types/game';
import { SKINS } from '../utils/skins';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  isSparkle?: boolean;
}

interface SpeedLine {
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
}

interface GameCanvasProps {
  currentObstacle: Obstacle | null;
  player: Player;
  feverActive: boolean;
  isHurtShake: boolean;
  floatingFeedbacks: FloatingFeedback[];
  score: number;
  combo: number;
  speedMultiplier: number;
  activeEvent?: ActiveEvent | null;
  activePowerUps?: ActivePowerUpState;
  activePowerUpPickup?: PowerUp | null;
  rainCoins?: RainCoin[];
  isRushMode?: boolean;
  ghostPlayer?: Player | null;
  ghostScore?: number;
  onSwipeAction?: (action: Action) => void;
  onCollectRainCoin?: (id: string) => void;
  onCollectPowerUp?: (id: string) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  currentObstacle,
  player,
  feverActive,
  isHurtShake,
  floatingFeedbacks,
  score,
  combo,
  speedMultiplier,
  activeEvent = null,
  activePowerUps,
  activePowerUpPickup = null,
  rainCoins = [],
  isRushMode = false,
  ghostPlayer = null,
  ghostScore,
  onSwipeAction,
  onCollectRainCoin,
  onCollectPowerUp,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // References for persistent animation variables
  const animationFrameRef = useRef<number | null>(null);
  const roadOffsetRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const speedLinesRef = useRef<SpeedLine[]>([]);
  const runnerLaneXRef = useRef<number>(0); // Smooth interpolated lane X
  const ghostLaneXRef = useRef<number>(0); // Smooth interpolated ghost lane X
  const prevObstacleIdRef = useRef<string | null>(null);
  const prevFeedbacksCountRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Initialize background star speed lines
  useEffect(() => {
    const lines: SpeedLine[] = [];
    for (let i = 0; i < 35; i++) {
      lines.push({
        x: Math.random() * 500,
        y: Math.random() * 800,
        length: 15 + Math.random() * 45,
        speed: 4 + Math.random() * 10,
        alpha: 0.15 + Math.random() * 0.45,
      });
    }
    speedLinesRef.current = lines;
  }, []);

  // Spawn celebration particles on feedback changes (compact, lateral, non-obstructive)
  useEffect(() => {
    if (floatingFeedbacks.length > prevFeedbacksCountRef.current) {
      const latest = floatingFeedbacks[floatingFeedbacks.length - 1];
      const canvas = canvasRef.current;
      const width = canvas ? canvas.width / (window.devicePixelRatio || 1) : 400;
      const height = canvas ? canvas.height / (window.devicePixelRatio || 1) : 600;

      if (latest.type === 'PERFECT' || latest.type === 'NEARMISS' || latest.type === 'BOSS') {
        // Kept lightweight & non-obstructive for smooth Android performance
        const pCount = latest.type === 'BOSS' ? 18 : latest.type === 'PERFECT' ? 12 : 8;
        const colorPalette =
          latest.type === 'BOSS'
            ? ['#f59e0b', '#ec4899', '#38bdf8']
            : latest.type === 'PERFECT'
            ? ['#fbbf24', '#ffffff', '#38bdf8']
            : ['#f97316', '#fbbf24'];

        for (let i = 0; i < pCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = 2.5 + Math.random() * 6;
          // Spawn to the sides of the player, keeping the oncoming obstacle lane 100% clear
          const sideOffset = (Math.random() < 0.5 ? -1 : 1) * (25 + Math.random() * 35);
          particlesRef.current.push({
            x: width / 2 + sideOffset,
            y: height * 0.72 + (Math.random() - 0.5) * 20,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            size: 1.5 + Math.random() * 2.5,
            color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
            alpha: 0.75,
            decay: 0.04 + Math.random() * 0.03,
            isSparkle: Math.random() < 0.5,
          });
        }
      }
    }
    prevFeedbacksCountRef.current = floatingFeedbacks.length;
  }, [floatingFeedbacks]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Handle device pixel ratio for crystal clear rendering
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const displayWidth = Math.floor(rect.width * dpr);
      const displayHeight = Math.floor(rect.height * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const width = rect.width;
      const height = rect.height;

      // Screen shake translation on mistakes
      if (isHurtShake) {
        const shakeX = (Math.random() - 0.5) * 14;
        const shakeY = (Math.random() - 0.5) * 14;
        ctx.translate(shakeX, shakeY);
      }

      // --- 1. SKY & HORIZON GRADIENT ---
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (isRushMode) {
        skyGrad.addColorStop(0, '#3b0764');
        skyGrad.addColorStop(0.35, '#881337');
        skyGrad.addColorStop(0.36, '#be123c');
        skyGrad.addColorStop(1, '#1c051d');
      } else if (feverActive) {
        skyGrad.addColorStop(0, '#1e1136');
        skyGrad.addColorStop(0.35, '#3b0764');
        skyGrad.addColorStop(0.36, '#701a75');
        skyGrad.addColorStop(1, '#0f051d');
      } else if (activeEvent?.type === 'SLOW_MOTION') {
        skyGrad.addColorStop(0, '#042f2e');
        skyGrad.addColorStop(0.35, '#0f766e');
        skyGrad.addColorStop(1, '#021e24');
      } else if (activeEvent?.type === 'SPEED_UP' || activeEvent?.type === 'SPEED_BURST') {
        skyGrad.addColorStop(0, '#431407');
        skyGrad.addColorStop(0.35, '#9a3412');
        skyGrad.addColorStop(1, '#1c0903');
      } else {
        skyGrad.addColorStop(0, '#020617');
        skyGrad.addColorStop(0.35, '#090d16');
        skyGrad.addColorStop(0.36, '#111827');
        skyGrad.addColorStop(1, '#030712');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // --- 2. DISTANT NEON CITY SILHOUETTES & STARS ---
      const horizonY = height * 0.35;

      // Distant stars
      ctx.fillStyle = feverActive || isRushMode ? 'rgba(250, 204, 21, 0.7)' : 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 22; i++) {
        const sx = (i * 37) % width;
        const sy = (i * 19) % (horizonY - 20);
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Distant neon sun / horizon glow (toned down so incoming obstacles remain 100% visible)
      const sunGrad = ctx.createRadialGradient(
        width / 2, horizonY, 8,
        width / 2, horizonY, width * 0.4
      );
      if (isRushMode) {
        sunGrad.addColorStop(0, 'rgba(244, 63, 94, 0.24)');
        sunGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.10)');
        sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (feverActive) {
        sunGrad.addColorStop(0, 'rgba(236, 72, 153, 0.22)');
        sunGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.08)');
        sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        sunGrad.addColorStop(0, 'rgba(56, 189, 248, 0.16)');
        sunGrad.addColorStop(0.6, 'rgba(99, 102, 241, 0.05)');
        sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, width, horizonY + 50);

      // Horizon line
      ctx.strokeStyle = isRushMode ? '#f43f5e' : feverActive ? '#ec4899' : activeEvent ? activeEvent.color : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(width, horizonY);
      ctx.stroke();

      // --- 3. 3-LANE PERSPECTIVE HIGHWAY ---
      const trackTopWidth = width * 0.22;
      const trackBottomWidth = width * 0.92;
      const trackTopLeft = (width - trackTopWidth) / 2;
      const trackTopRight = trackTopLeft + trackTopWidth;
      const trackBottomLeft = (width - trackBottomWidth) / 2;
      const trackBottomRight = trackBottomLeft + trackBottomWidth;

      // Track surface
      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      if (isRushMode) {
        roadGrad.addColorStop(0, '#4c0519');
        roadGrad.addColorStop(1, '#1e0108');
      } else if (feverActive) {
        roadGrad.addColorStop(0, '#2e1065');
        roadGrad.addColorStop(1, '#0f051d');
      } else {
        roadGrad.addColorStop(0, '#0f172a');
        roadGrad.addColorStop(1, '#020617');
      }
      ctx.fillStyle = roadGrad;
      ctx.beginPath();
      ctx.moveTo(trackTopLeft, horizonY);
      ctx.lineTo(trackTopRight, horizonY);
      ctx.lineTo(trackBottomRight, height);
      ctx.lineTo(trackBottomLeft, height);
      ctx.closePath();
      ctx.fill();

      // Dynamic scrolling horizontal grid lines (speed modulated)
      let effectiveSpeed = speedMultiplier;
      if (activePowerUps && activePowerUps.slowTimeRemaining > 0) effectiveSpeed *= 0.65;
      if (activeEvent?.type === 'SLOW_MOTION') effectiveSpeed *= 0.65;
      if (activeEvent?.type === 'SPEED_UP' || activeEvent?.type === 'SPEED_BURST') effectiveSpeed *= 1.35;
      if (feverActive) effectiveSpeed *= 1.35;
      if (isRushMode) effectiveSpeed *= 1.45;

      const baseSpeed = 400 * effectiveSpeed;
      roadOffsetRef.current = (roadOffsetRef.current + delta * baseSpeed) % 100;
      const numHorizLines = 14;

      ctx.strokeStyle = isRushMode
        ? 'rgba(244, 63, 94, 0.5)'
        : feverActive
        ? 'rgba(236, 72, 153, 0.4)'
        : 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1;

      for (let i = 0; i < numHorizLines; i++) {
        const t = ((i * 7 + (roadOffsetRef.current * 0.07)) % 100) / 100;
        const py = horizonY + Math.pow(t, 2.2) * (height - horizonY);
        const wAtY = trackTopWidth + Math.pow(t, 2.2) * (trackBottomWidth - trackTopWidth);
        const lx = (width - wAtY) / 2;
        const rx = lx + wAtY;

        ctx.beginPath();
        ctx.moveTo(lx, py);
        ctx.lineTo(rx, py);
        ctx.stroke();
      }

      // 4 Lane Dividers (Lane -1, 0, 1)
      const laneProportions = [0, 1 / 3, 2 / 3, 1];
      laneProportions.forEach((prop, idx) => {
        const isBorder = idx === 0 || idx === 3;
        ctx.strokeStyle = isBorder
          ? isRushMode
            ? '#f43f5e'
            : feverActive
            ? '#ec4899'
            : '#38bdf8'
          : isRushMode
          ? 'rgba(251, 113, 133, 0.5)'
          : feverActive
          ? 'rgba(244, 114, 182, 0.5)'
          : 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = isBorder ? 3 : 1.5;

        if (!isBorder) {
          ctx.setLineDash([8, 12]);
        } else {
          ctx.setLineDash([]);
        }

        const startX = trackTopLeft + prop * trackTopWidth;
        const endX = trackBottomLeft + prop * trackBottomWidth;

        ctx.beginPath();
        ctx.moveTo(startX, horizonY);
        ctx.lineTo(endX, height);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // --- 4. SPEED LINES (WARP EFFECT - subtle, non-obstructive) ---
      ctx.strokeStyle = isRushMode
        ? 'rgba(244, 63, 94, 0.32)'
        : feverActive
        ? 'rgba(251, 191, 36, 0.25)'
        : activeEvent?.type === 'SPEED_UP'
        ? 'rgba(249, 115, 22, 0.30)'
        : 'rgba(148, 163, 184, 0.16)';
      ctx.lineWidth = 1;
      speedLinesRef.current.forEach((line) => {
        line.y += line.speed * (effectiveSpeed * 0.9);
        if (line.y > height) {
          line.y = horizonY - 10;
          line.x = Math.random() * width;
        }

        const angle = Math.atan2(line.y - horizonY, line.x - width / 2);
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(line.x + Math.cos(angle) * line.length, line.y + Math.sin(angle) * line.length);
        ctx.stroke();
      });

      // --- 4B. SUBTLE FEVER PARTICLES (GENTLE AMBIENCE, NEVER OBSTRUCTS GAMEPLAY) ---
      if ((feverActive || isRushMode) && Math.random() < 0.25) {
        particlesRef.current.push({
          x: width * 0.15 + Math.random() * width * 0.7,
          y: height * 0.78,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -1.5 - Math.random() * 2, // Float upwards gently
          size: 1.5 + Math.random() * 2,
          color: isRushMode ? '#f43f5e' : Math.random() < 0.5 ? '#f59e0b' : '#ec4899',
          alpha: 0.35,
          decay: 0.025,
        });
      }

      // --- 5. RENDER APPROACHING POWER-UP PICKUP IF PRESENT ---
      if (activePowerUpPickup && !activePowerUpPickup.collected) {
        const d = Math.max(0, Math.min(1, activePowerUpPickup.distance));
        const approachT = 1.0 - d;
        const pwrScale = 0.35 + Math.pow(approachT, 1.8) * 0.85;

        const pwrY = horizonY + Math.pow(approachT, 1.8) * (height * 0.74 - horizonY);
        const roadWAtY = trackTopWidth + Math.pow(approachT, 1.8) * (trackBottomWidth - trackTopWidth);
        const laneW = roadWAtY / 3;
        const pwrX = width / 2 + activePowerUpPickup.lane * laneW;

        renderPowerUpPickup(ctx, pwrX, pwrY, pwrScale, activePowerUpPickup.type, time);
      }

      // --- 6. RENDER OBSTACLE ---
      if (currentObstacle && !currentObstacle.cleared) {
        const d = Math.max(0, Math.min(1, currentObstacle.distance));
        const approachT = 1.0 - d;
        const obsScale = currentObstacle.isBoss
          ? 0.4 + Math.pow(approachT, 1.6) * 1.15
          : 0.25 + Math.pow(approachT, 1.8) * 0.85;

        const obsY = horizonY + Math.pow(approachT, 1.8) * (height * 0.72 - horizonY);
        const roadWAtY = trackTopWidth + Math.pow(approachT, 1.8) * (trackBottomWidth - trackTopWidth);
        const laneWidthAtY = roadWAtY / 3;

        let targetLaneIndex = 0;
        if (!currentObstacle.isBoss) {
          if (currentObstacle.action === 'LEFT') targetLaneIndex = 0.5;
          else if (currentObstacle.action === 'RIGHT') targetLaneIndex = -0.5;
        }

        const obsX = width / 2 + targetLaneIndex * laneWidthAtY;

        ctx.save();
        ctx.translate(obsX, obsY);
        ctx.scale(obsScale, obsScale);

        // Distraction glitch jitter / Fake Warning
        if (currentObstacle.distraction === 'GLITCH' || currentObstacle.fakeWarningActive) {
          if (Math.random() < 0.25) {
            ctx.translate((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 8);
          }
        }

        renderObstacleGraphics(ctx, currentObstacle, feverActive || isRushMode);

        const remainingRatio = Math.max(0, currentObstacle.remainingTime / currentObstacle.timeLimit);
        renderReactionTimerHUD(ctx, remainingRatio, currentObstacle);

        ctx.restore();
      }

      // --- 7. RENDER RUNNER CHARACTER ---
      const targetLaneX = player.lane * (trackBottomWidth / 3.4);
      runnerLaneXRef.current += (targetLaneX - runnerLaneXRef.current) * Math.min(delta * 22, 1);

      const runnerBaseY = height * 0.74;
      const runnerBaseX = width / 2 + runnerLaneXRef.current;

      renderRunnerCharacter(ctx, runnerBaseX, runnerBaseY, player, feverActive || isRushMode, delta, activePowerUps);

      // --- 8. RENDER COIN RAIN COINS IF ACTIVE ---
      if (rainCoins && rainCoins.length > 0) {
        rainCoins.forEach((rc) => {
          if (rc.collected) return;
          const px = rc.x * width;
          const py = rc.y * height;

          ctx.save();
          ctx.translate(px, py);
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.ellipse(0, 0, rc.size, rc.size * (0.6 + Math.sin(time * 0.008 + rc.speed) * 0.4), 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Sparkle shine
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-2, -2, 2, 2);
          ctx.restore();
        });
      }

      // --- 9. PARTICLES UPDATE & DRAW ---
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.size *= 0.96;

        if (p.alpha <= 0 || p.size < 0.5) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        if (p.isSparkle) {
          ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
        } else {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // --- 10. FLOATING TEXT FEEDBACK & COMPACT NOTIFICATIONS (Requirement 1 & 3) ---
      // Positioned high in the sky zone (height * 0.09) to NEVER hide the player, obstacle, or action requirement
      const now = performance.now();
      const activeFbs = floatingFeedbacks.filter((fb) => {
        const isScoreOrCoin = fb.type === 'COIN' || fb.scoreBonus !== undefined;
        const maxAge = isScoreOrCoin ? 0.5 : 0.65; // Score/coin popups are short-lived (0.5s)
        return (now - fb.createdAt) / 1000 <= maxAge;
      });

      activeFbs.forEach((fb, idx) => {
        const age = (now - fb.createdAt) / 1000;
        const isScoreOrCoin = fb.type === 'COIN' || fb.scoreBonus !== undefined;
        const maxAge = isScoreOrCoin ? 0.5 : 0.65;

        // Positioned high in the upper sky zone, well above the road horizon (0.35)
        // With smooth drift and vertical spacing if multiple notifications coincide
        const baseY = height * 0.09;
        const stackOffset = (activeFbs.length - 1 - idx) * 22;
        const y = baseY + stackOffset - age * 12;

        // Reduced opacity (peaks at 0.55-0.60, soft translucent fade)
        const peakAlpha = isScoreOrCoin ? 0.6 : 0.55;
        const alpha = Math.max(0, (1 - age / maxAge) * peakAlpha);

        ctx.save();
        ctx.translate(width / 2, y);
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';

        const color =
          fb.type === 'PERFECT'
            ? '#fbbf24'
            : fb.type === 'NEARMISS'
            ? '#f97316'
            : fb.type === 'POWERUP'
            ? '#eab308'
            : fb.type === 'BOSS'
            ? '#ec4899'
            : fb.type === 'FEVER'
            ? '#f59e0b'
            : fb.type === 'MILESTONE'
            ? '#ec4899'
            : fb.type === 'EVENT'
            ? '#06b6d4'
            : fb.type === 'COIN'
            ? '#eab308'
            : fb.type === 'MISS'
            ? '#ef4444'
            : '#10b981';

        // Compact size & restrained pill backdrop
        const textToDisplay = fb.text;
        ctx.font = isScoreOrCoin
          ? '800 11px "JetBrains Mono", monospace'
          : '800 12px "Chakra Petch", sans-serif';

        const textMetrics = ctx.measureText(textToDisplay);
        const pillW = isScoreOrCoin
          ? Math.max(48, textMetrics.width + 14)
          : Math.max(54, textMetrics.width + 16);
        const pillH = isScoreOrCoin ? 18 : fb.subtext ? 28 : 20;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.50)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.fillText(textToDisplay, 0, fb.subtext ? -2 : 3.5);

        if (fb.subtext) {
          ctx.font = '700 8.5px "JetBrains Mono", monospace';
          ctx.fillStyle = '#cbd5e1';
          ctx.fillText(fb.subtext, 0, 9);
        }

        ctx.restore();
      });

      ctx.restore();
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    currentObstacle,
    player,
    feverActive,
    isHurtShake,
    floatingFeedbacks,
    score,
    combo,
    speedMultiplier,
    activeEvent,
    activePowerUps,
    activePowerUpPickup,
    rainCoins,
    isRushMode,
  ]);

  // Touch & Click Handlers (Swipe, Coin Rain click, Power-up click)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: performance.now(),
      };

      // Check if user tapped a falling rain coin or power-up directly
      checkDirectTap(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !onSwipeAction) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = performance.now() - touchStartRef.current.time;

    const minSwipeDist = 26;
    const maxSwipeTime = 380;

    if (dt < maxSwipeTime) {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX > minSwipeDist || absY > minSwipeDist) {
        if (absX > absY) {
          if (dx > 0) onSwipeAction('RIGHT');
          else onSwipeAction('LEFT');
        } else {
          if (dy < 0) onSwipeAction('JUMP');
          else onSwipeAction('SLIDE');
        }
      }
    }
    touchStartRef.current = null;
  };

  const checkDirectTap = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const tapX = clientX - rect.left;
    const tapY = clientY - rect.top;

    // Check Rain Coins
    if (rainCoins && onCollectRainCoin) {
      for (const coin of rainCoins) {
        if (!coin.collected) {
          const coinX = coin.x * rect.width;
          const coinY = coin.y * rect.height;
          if (Math.hypot(tapX - coinX, tapY - coinY) < 55) {
            onCollectRainCoin(coin.id);
            break;
          }
        }
      }
    }

    // Check Approaching Power-Up Pickup
    if (activePowerUpPickup && !activePowerUpPickup.collected && onCollectPowerUp) {
      const trackTopW = rect.width * 0.22;
      const trackBotW = rect.width * 0.92;
      const horY = rect.height * 0.35;
      const d = Math.max(0, Math.min(1, activePowerUpPickup.distance));
      const t = 1.0 - d;
      const py = horY + Math.pow(t, 1.8) * (rect.height * 0.74 - horY);
      const rw = trackTopW + Math.pow(t, 1.8) * (trackBotW - trackTopW);
      const px = rect.width / 2 + activePowerUpPickup.lane * (rw / 3);

      if (Math.hypot(tapX - px, tapY - py) < 65) {
        onCollectPowerUp(activePowerUpPickup.id);
      }
    }
  };

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none select-none cursor-pointer"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => checkDirectTap(e.clientX, e.clientY)}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

// Helper: Render Approaching Power-Up Pickup
function renderPowerUpPickup(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  type: string,
  time: number
) {
  ctx.save();
  ctx.translate(x, y + Math.sin(time * 0.006) * 6);
  ctx.scale(scale, scale);

  const color =
    type === 'SHIELD'
      ? '#06b6d4'
      : type === 'SLOW_TIME'
      ? '#10b981'
      : type === 'DOUBLE_SCORE'
      ? '#f59e0b'
      : type === 'EXTRA_LIFE'
      ? '#f43f5e'
      : '#eab308';

  // Radiant outer aura
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.fillStyle = `${color}44`;
  ctx.beginPath();
  ctx.arc(0, 0, 28, 0, Math.PI * 2);
  ctx.fill();

  // Glass orb body
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw Icon Inside
  ctx.fillStyle = color;
  ctx.font = '900 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const icon =
    type === 'SHIELD'
      ? '🛡️'
      : type === 'SLOW_TIME'
      ? '⏱️'
      : type === 'DOUBLE_SCORE'
      ? '🔥'
      : type === 'EXTRA_LIFE'
      ? '❤️'
      : '🧲';
  ctx.fillText(icon, 0, 2);

  ctx.restore();
}

// Helper: Render Obstacle Graphics with V4 Patterns & Boss Mode
function renderObstacleGraphics(ctx: CanvasRenderingContext2D, obs: Obstacle, isBoosted: boolean) {
  // BOSS OBSTACLE
  if (obs.isBoss && obs.bossSteps) {
    const currentStepAction = obs.bossSteps[obs.bossCurrentStepIndex || 0] || obs.action;
    const w = 240;
    const h = 130;

    ctx.save();
    ctx.translate(0, -30);

    // Boss Shadow
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 30;

    // Boss Cyber Chassis
    ctx.fillStyle = '#09090b';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 16);
    ctx.fill();
    ctx.stroke();

    // Hazard Stripes on top
    ctx.fillStyle = '#f59e0b';
    for (let i = -w / 2 + 10; i < w / 2 - 10; i += 28) {
      ctx.beginPath();
      ctx.moveTo(i, -h / 2);
      ctx.lineTo(i + 14, -h / 2);
      ctx.lineTo(i + 4, -h / 2 + 12);
      ctx.lineTo(i - 10, -h / 2 + 12);
      ctx.closePath();
      ctx.fill();
    }

    // Menacing glowing core
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    // Scanning eye
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(Math.sin(performance.now() * 0.008) * 8, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Boss Title
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 13px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ TITAN OVERLORD ⚡', 0, -h / 2 - 14);

    // Required Action Pill
    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 24px "Chakra Petch", sans-serif';
    ctx.fillText(`REQUIRED: ${currentStepAction}`, 0, h / 2 + 32);

    ctx.restore();
    return;
  }

  // MINI BOSS OBSTACLE (2-Action Sequence, Requirement 3)
  if (obs.isMiniBoss && obs.miniBossSteps) {
    const currentStepAction = obs.miniBossSteps[obs.miniBossCurrentStepIndex || 0] || obs.action;
    const w = 210;
    const h = 110;

    ctx.save();
    ctx.translate(0, -25);

    // Mini Boss Shadow
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 24;

    // Mini Boss Chassis
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 14);
    ctx.fill();
    ctx.stroke();

    // Hazard Stripes
    ctx.fillStyle = '#f59e0b';
    for (let i = -w / 2 + 8; i < w / 2 - 8; i += 24) {
      ctx.beginPath();
      ctx.moveTo(i, -h / 2);
      ctx.lineTo(i + 12, -h / 2);
      ctx.lineTo(i + 2, -h / 2 + 10);
      ctx.lineTo(i - 10, -h / 2 + 10);
      ctx.closePath();
      ctx.fill();
    }

    // Mini Boss Title
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 12px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⚠️ MINI BOSS: ${(obs.miniBossCurrentStepIndex || 0) + 1}/2 ⚠️`, 0, -h / 2 - 10);

    // Sequence preview
    ctx.font = '800 14px "JetBrains Mono", monospace';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`${obs.miniBossSteps[0]} ➔ ${obs.miniBossSteps[1]}`, 0, -4);

    // Current Action Required
    ctx.fillStyle = '#f97316';
    ctx.font = '900 22px "Chakra Petch", sans-serif';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 14;
    ctx.fillText(`NEXT: ${currentStepAction}`, 0, 26);

    ctx.restore();
    return;
  }

  const currentAction = obs.isTwoStep && obs.currentStep === 2 && obs.secondAction ? obs.secondAction : obs.action;

  // Draw Two-Step Banner if applicable
  if (obs.isTwoStep) {
    ctx.save();
    ctx.translate(0, -90);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-85, -20, 170, 36, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = '800 12px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`DOUBLE THREAT: ${obs.currentStep}/2`, 0, -2);

    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`${obs.action} ➔ ${obs.secondAction}`, 0, 11);
    ctx.restore();
  }

  // Draw Specific Obstacle Patterns (High-Contrast Backing for 100% Visibility, Requirement 2)
  if (currentAction === 'JUMP') {
    // LOW OBSTACLE -> JUMP (Spiked barrier on ground)
    const w = 155;
    const h = 48;

    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(245, 158, 11, 0.95)';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 6);
    ctx.fill();

    // Spikes pointing up
    ctx.fillStyle = '#ea580c';
    for (let i = -w / 2 + 10; i < w / 2 - 5; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, -h / 2);
      ctx.lineTo(i + 10, -h / 2 - 14);
      ctx.lineTo(i + 20, -h / 2);
      ctx.closePath();
      ctx.fill();
    }

    // High-contrast prompt pill (never washed out by bright effects)
    ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-85, -h / 2 - 38, 170, 28, 8);
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#fef08a';
    ctx.font = '900 16px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▲ JUMP OVER ▲', 0, -h / 2 - 19);
    ctx.shadowBlur = 0;
  } else if (currentAction === 'SLIDE') {
    // HIGH OBSTACLE -> SLIDE (Overhead electric beam)
    const w = 180;
    const h = 55;

    ctx.save();
    ctx.translate(0, -60);
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 14;
    ctx.fillStyle = 'rgba(6, 182, 212, 0.95)';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 8);
    ctx.fill();

    // High-contrast overhead drone prompt
    ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-88, -16, 176, 32, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 16px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▼ SLIDE UNDER ▼', 0, 6);

    // Hanging laser beam downwards
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-w / 2 + 15, h / 2, 8, 32);
    ctx.fillRect(w / 2 - 23, h / 2, 8, 32);
    ctx.restore();
  } else if (currentAction === 'LEFT') {
    // RIGHT BARRIER -> DODGE LEFT
    const w = 165;
    const h = 80;

    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 14;
    ctx.fillStyle = 'rgba(147, 51, 234, 0.95)';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 8);
    ctx.fill();

    // High-contrast prompt pill
    ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-85, -16, 170, 32, 8);
    ctx.fill();
    ctx.stroke();

    // Moving chevron arrows on left
    const shift = (performance.now() * 0.05) % 18;
    ctx.fillStyle = '#f3e8ff';
    ctx.font = '900 16px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('◀ ◀ DODGE LEFT', -shift * 0.4, 6);
  } else if (currentAction === 'RIGHT') {
    // LEFT BARRIER -> DODGE RIGHT
    const w = 165;
    const h = 80;

    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 14;
    ctx.fillStyle = 'rgba(234, 88, 12, 0.95)';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 8);
    ctx.fill();

    // High-contrast prompt pill
    ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-85, -16, 170, 32, 8);
    ctx.fill();
    ctx.stroke();

    const shift = (performance.now() * 0.05) % 18;
    ctx.fillStyle = '#fff7ed';
    ctx.font = '900 16px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DODGE RIGHT ▶ ▶', shift * 0.4, 6);
  }

  // Draw Distraction Caution Badge if present
  if (obs.distraction === 'CAUTION' || obs.fakeWarningActive) {
    ctx.save();
    ctx.translate(0, 48);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.beginPath();
    ctx.roundRect(-52, -12, 104, 24, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('! CAUTION !', 0, 4);
    ctx.restore();
  }
}

// Helper: Render Reaction Timer HUD
function renderReactionTimerHUD(ctx: CanvasRenderingContext2D, ratio: number, obs: Obstacle) {
  ctx.save();
  ctx.translate(0, -78);

  const timerColor = ratio > 0.4 ? '#22c55e' : ratio > 0.2 ? '#eab308' : '#ef4444';

  const radius = 18;
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = timerColor;
  ctx.shadowColor = timerColor;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(0, 0, radius, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 11px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${(obs.remainingTime / 1000).toFixed(1)}s`, 0, 4);

  ctx.restore();
}

// Helper: Render Runner Character with V4 Power-Up Auras (Shield, Magnet, Flames)
function renderRunnerCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  player: Player,
  isFever: boolean,
  delta: number,
  activePowerUps?: ActivePowerUpState
) {
  ctx.save();
  ctx.translate(x, y);

  let jumpY = 0;
  if (player.currentAction === 'JUMPING') {
    jumpY = -Math.sin(player.actionProgress * Math.PI) * 70;
  }

  let scaleY = 1.0;
  let scaleX = 1.0;
  if (player.currentAction === 'SLIDING') {
    scaleY = 0.45;
    scaleX = 1.35;
  }

  if (player.invulnerableTime > 0) {
    const blink = Math.floor(player.invulnerableTime / 80) % 2 === 0;
    if (blink) {
      ctx.globalAlpha = 0.35;
    }
  }

  // 1. Cast Ground Shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.scale(1, 0.3);
  ctx.beginPath();
  const shadowRadius = 22 * (1 - Math.abs(jumpY) / 120);
  ctx.arc(0, 0, Math.max(10, shadowRadius), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Fever Aura / After-images
  if (isFever) {
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 25;
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, jumpY - 26, 32, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 3. Power-Up Auras
  // A. Shield Forcefield Bubble
  if (activePowerUps?.hasShield) {
    ctx.save();
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.16)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, jumpY - 26, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // B. Coin Magnet Aura Rings
  if (activePowerUps && activePowerUps.coinMagnetRemaining > 0) {
    ctx.save();
    const pulse = (performance.now() * 0.003) % 1;
    ctx.strokeStyle = `rgba(234, 179, 8, ${0.8 - pulse * 0.7})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, jumpY - 26, 26 + pulse * 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 4. Draw Runner Sprite
  ctx.translate(0, jumpY);
  ctx.scale(scaleX, scaleY);

  const skin = SKINS[player.skinId] || SKINS.classic;

  // Jet exhaust flames
  const flameLength = 12 + Math.random() * 8;
  ctx.fillStyle = isFever ? '#f59e0b' : skin.trailColor;
  ctx.beginPath();
  ctx.moveTo(-10, 4);
  ctx.lineTo(0, 4 + flameLength);
  ctx.lineTo(10, 4);
  ctx.closePath();
  ctx.fill();

  if (player.currentAction === 'SLIDING') {
    ctx.fillStyle = skin.trailColor;
    for (let i = 0; i < 4; i++) {
      ctx.fillRect((Math.random() - 0.5) * 40, 10 + Math.random() * 6, 4, 4);
    }
  }

  // Torso / Suit
  const suitColor = isFever ? '#ec4899' : player.currentAction === 'HURT' ? '#ef4444' : skin.suitColor;
  ctx.fillStyle = suitColor;
  ctx.beginPath();
  ctx.roundRect(-14, -36, 28, 38, 8);
  ctx.fill();

  // Chest energy core
  ctx.fillStyle = isFever ? '#fef08a' : skin.coreColor;
  ctx.beginPath();
  ctx.arc(0, -22, 6, 0, Math.PI * 2);
  ctx.fill();

  // Helmet
  ctx.fillStyle = isFever ? '#3b0764' : skin.helmetColor;
  ctx.beginPath();
  ctx.roundRect(-16, -58, 32, 26, 12);
  ctx.fill();

  // Special accessories based on skin
  if (player.skinId === 'robot') {
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-2, -66, 4, 9);
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, -68, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else if (player.skinId === 'ninja') {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(12, -48);
    ctx.lineTo(24 + Math.sin(performance.now() * 0.02) * 4, -44);
    ctx.stroke();
  } else if (player.skinId === 'fire') {
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(-8, -58);
    ctx.lineTo(0, -68);
    ctx.lineTo(8, -58);
    ctx.closePath();
    ctx.fill();
  } else if (player.skinId === 'galaxy') {
    ctx.fillStyle = '#f472b6';
    const orbitAngle = performance.now() * 0.005;
    ctx.fillRect(Math.cos(orbitAngle) * 20 - 2, -45 + Math.sin(orbitAngle) * 8 - 2, 4, 4);
  }

  // Glowing Visor
  ctx.fillStyle = isFever ? '#fbbf24' : player.currentAction === 'HURT' ? '#ef4444' : skin.visorColor;
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.roundRect(-13, -50, 26, 10, 4);
  ctx.fill();
  ctx.shadowBlur = 0;

  if (player.currentAction === 'RUNNING') {
    const stride = Math.sin(performance.now() * 0.018) * 12;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    // Left leg
    ctx.beginPath();
    ctx.moveTo(-8, 2);
    ctx.lineTo(-8 - stride * 0.5, 14);
    ctx.stroke();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(8, 2);
    ctx.lineTo(8 + stride * 0.5, 14);
    ctx.stroke();
  }

  ctx.restore();
}
