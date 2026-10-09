import React, { useEffect, useRef } from 'react';
import {
  Action,
  ActiveEvent,
  ActivePowerUpState,
  FloatingFeedback,
  GameMode,
  Obstacle,
  Player,
  PowerUp,
  RainCoin,
} from '../types/game';
import { SKINS } from '../utils/skins';
import {
  EnvironmentTheme,
  getEnvironmentTheme,
  lerpColor,
  THEME_CYBER_MIDNIGHT,
} from '../utils/environmentThemes';

interface PooledParticle {
  active: boolean;
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

// Low-overhead glow/shadow helper (Requirement 3 & 9: bypass CPU gaussian blur passes in perf mode & high speed)
function setGlow(ctx: CanvasRenderingContext2D, color: string, blur: number, disableGlow?: boolean) {
  if (disableGlow) {
    ctx.shadowBlur = 0;
  } else {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
  }
}

interface SpeedLine {
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
}

interface StarSeed {
  xR: number;
  yR: number;
  size: number;
  phase: number;
}

interface BuildingSeed {
  xR: number;
  w: number;
  h: number;
  hasAntenna: boolean;
  windows: Array<{ rx: number; ry: number; color: string }>;
}

interface PeakSeed {
  xR: number;
  h: number;
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
  gameMode?: GameMode;
  survivalTimeSec?: number;
  performanceMode?: boolean;
  isGamePlaying?: boolean;
  onGameTick?: (deltaSec: number) => void;
  gameStateRef?: React.MutableRefObject<any>;
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
  gameMode = 'CLASSIC',
  survivalTimeSec = 0,
  performanceMode = false,
  isGamePlaying = false,
  onGameTick,
  gameStateRef,
  onSwipeAction,
  onCollectRainCoin,
  onCollectPowerUp,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // References for persistent animation variables
  const animationFrameRef = useRef<number | null>(null);
  const roadOffsetRef = useRef<number>(0);
  const particlePoolRef = useRef<PooledParticle[]>([]);
  const speedLinesRef = useRef<SpeedLine[]>([]);
  const runnerLaneXRef = useRef<number>(0); // Smooth interpolated lane X
  const ghostLaneXRef = useRef<number>(0); // Smooth interpolated ghost lane X
  const prevObstacleIdRef = useRef<string | null>(null);
  const prevFeedbacksCountRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const canvasSizeRef = useRef<{ width: number; height: number; dpr: number }>({
    width: 400,
    height: 600,
    dpr: 1,
  });

  // Dynamic Environment Theme References
  const currentThemeRef = useRef<EnvironmentTheme>(THEME_CYBER_MIDNIGHT);
  const targetThemeRef = useRef<EnvironmentTheme>(THEME_CYBER_MIDNIGHT);
  const prevThemeRef = useRef<EnvironmentTheme>(THEME_CYBER_MIDNIGHT);
  const themeTransitionProgressRef = useRef<number>(1);
  const shoulderOffsetRef = useRef<number>(0);

  // Deterministic seeds for background stars, city skyline, and mountain peaks
  const starsSeedRef = useRef<StarSeed[]>([]);
  const buildingsSeedRef = useRef<BuildingSeed[]>([]);
  const mountainPeaksSeedRef = useRef<PeakSeed[]>([]);

  // Initialize deterministic seeds once on mount
  useEffect(() => {
    // 1. Fixed Stars (32 stars with steady coordinates)
    if (starsSeedRef.current.length === 0) {
      const stars: StarSeed[] = [];
      for (let i = 0; i < 32; i++) {
        stars.push({
          xR: ((i * 37) % 100) / 100,
          yR: ((i * 19) % 85) / 100,
          size: 1.0 + (i % 3) * 0.65,
          phase: (i * 1.3) % (Math.PI * 2),
        });
      }
      starsSeedRef.current = stars;
    }

    // 2. City buildings (22 procedural skyline silhouettes)
    if (buildingsSeedRef.current.length === 0) {
      const blds: BuildingSeed[] = [];
      const windowPalettes = ['#38bdf8', '#facc15', '#ec4899', '#34d399', '#c084fc'];
      for (let i = 0; i < 22; i++) {
        const w = 20 + ((i * 7) % 26);
        const h = 28 + ((i * 13) % 58);
        const wins: Array<{ rx: number; ry: number; color: string }> = [];
        const rows = Math.floor(h / 12);
        const cols = Math.floor(w / 8);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if ((r + c + i) % 3 !== 0) {
              wins.push({
                rx: 4 + c * 7,
                ry: 5 + r * 10,
                color: windowPalettes[(i + r + c) % windowPalettes.length],
              });
            }
          }
        }
        blds.push({
          xR: i / 21,
          w,
          h,
          hasAntenna: i % 3 === 0,
          windows: wins,
        });
      }
      buildingsSeedRef.current = blds;
    }

    // 3. Mountain peaks (14 outrun ridge vertices)
    if (mountainPeaksSeedRef.current.length === 0) {
      const peaks: PeakSeed[] = [];
      for (let i = 0; i < 14; i++) {
        peaks.push({
          xR: i / 13,
          h: 24 + Math.sin(i * 1.8) * 18 + ((i * 11) % 18),
        });
      }
      mountainPeaksSeedRef.current = peaks;
    }

    // Background star speed lines
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

    // Pre-allocate fixed Particle Pool (Requirement 4: zero object allocations during gameplay)
    if (particlePoolRef.current.length === 0) {
      particlePoolRef.current = Array.from({ length: 48 }, () => ({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 0,
        color: '#ffffff',
        alpha: 0,
        decay: 0.05,
        isSparkle: false,
      }));
    }
  }, []);

  // Spawn pooled particle helper
  const spawnPooledParticle = (
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    color: string,
    alpha: number,
    decay: number,
    isSparkle?: boolean
  ) => {
    const pool = particlePoolRef.current;
    if (pool.length === 0) return;
    let slot = pool.find((p) => !p.active);
    if (!slot) slot = pool[0];
    slot.active = true;
    slot.x = x;
    slot.y = y;
    slot.vx = vx;
    slot.vy = vy;
    slot.size = size;
    slot.color = color;
    slot.alpha = alpha;
    slot.decay = decay;
    slot.isSparkle = Boolean(isSparkle);
  };

  // Handle canvas sizing without forced synchronous layout on every frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const maxDpr = performanceMode ? 1.0 : 2.0;
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const w = rect.width || 400;
      const h = rect.height || 600;
      canvasSizeRef.current = { width: w, height: h, dpr };
      const dw = Math.floor(w * dpr);
      const dh = Math.floor(h * dpr);
      if (canvas.width !== dw || canvas.height !== dh) {
        canvas.width = dw;
        canvas.height = dh;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [performanceMode]);

  // Spawn celebration particles on feedback changes (pooled, compact, lateral, non-obstructive)
  useEffect(() => {
    if (floatingFeedbacks.length > prevFeedbacksCountRef.current) {
      const latest = floatingFeedbacks[floatingFeedbacks.length - 1];
      const { width, height } = canvasSizeRef.current;

      if (latest.type === 'PERFECT' || latest.type === 'NEARMISS' || latest.type === 'BOSS') {
        const speedScale = Math.max(0.4, 1.0 - (speedMultiplier - 1.0) * 0.5);
        const baseCount = latest.type === 'BOSS' ? 14 : latest.type === 'PERFECT' ? 10 : 6;
        const pCount = Math.max(2, Math.round((performanceMode ? baseCount * 0.5 : baseCount) * speedScale));

        const colorPalette =
          latest.type === 'BOSS'
            ? ['#f59e0b', '#ec4899', '#38bdf8']
            : latest.type === 'PERFECT'
            ? ['#fbbf24', '#ffffff', '#38bdf8']
            : ['#f97316', '#fbbf24'];

        for (let i = 0; i < pCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = 2.5 + Math.random() * 5;
          const sideOffset = (Math.random() < 0.5 ? -1 : 1) * (25 + Math.random() * 35);
          spawnPooledParticle(
            width / 2 + sideOffset,
            height * 0.72 + (Math.random() - 0.5) * 20,
            Math.cos(angle) * spd,
            Math.sin(angle) * spd,
            1.5 + Math.random() * 2.5,
            colorPalette[Math.floor(Math.random() * colorPalette.length)],
            0.75,
            0.04 + Math.random() * 0.03,
            Math.random() < 0.5
          );
        }
      }
    }
    prevFeedbacksCountRef.current = floatingFeedbacks.length;
  }, [floatingFeedbacks, performanceMode, speedMultiplier]);

  // Synchronize latest props in ref for continuous 60fps render loop without re-triggering useEffect
  const propsRef = useRef({
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
    ghostPlayer,
    ghostScore,
    gameMode,
    survivalTimeSec,
    performanceMode,
    isGamePlaying,
    onGameTick,
    gameStateRef,
  });

  propsRef.current = {
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
    ghostPlayer,
    ghostScore,
    gameMode,
    survivalTimeSec,
    performanceMode,
    isGamePlaying,
    onGameTick,
    gameStateRef,
  };

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

      // Single Unified Game Engine Loop (Requirement 1 & 5: eliminates duplicate requestAnimationFrame)
      if (propsRef.current.isGamePlaying && propsRef.current.onGameTick) {
        propsRef.current.onGameTick(delta);
      }

      // Read current live state from gameStateRef if available, else propsRef
      const state = propsRef.current.gameStateRef?.current || propsRef.current;
      const {
        currentObstacle,
        player,
        feverActive,
        isHurtShake,
        floatingFeedbacks,
        score,
        speedMultiplier,
        activeEvent,
        activePowerUps,
        activePowerUpPickup,
        rainCoins,
        isRushMode,
        ghostPlayer,
        ghostScore,
        gameMode,
        survivalTimeSec,
      } = state;

      const { width, height, dpr } = canvasSizeRef.current;
      const disableGlow = performanceMode || speedMultiplier > 1.35;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Screen shake translation on mistakes (reduced in performance mode and high speed)
      if (isHurtShake) {
        const shakeIntensity = performanceMode || speedMultiplier > 1.3 ? 6 : 14;
        const shakeX = (Math.random() - 0.5) * shakeIntensity;
        const shakeY = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(shakeX, shakeY);
      }

      // --- 1. DYNAMIC ENVIRONMENT THEME RESOLUTION ---
      const activeTargetTheme = getEnvironmentTheme(score, gameMode, survivalTimeSec);
      if (activeTargetTheme.id !== targetThemeRef.current.id) {
        prevThemeRef.current = { ...currentThemeRef.current };
        targetThemeRef.current = activeTargetTheme;
        themeTransitionProgressRef.current = 0;
      }

      themeTransitionProgressRef.current = Math.min(1, themeTransitionProgressRef.current + delta * 1.4);
      const tProgress = themeTransitionProgressRef.current;
      const prevT = prevThemeRef.current;
      const nextT = targetThemeRef.current;

      // Smoothly interpolated colors across active biome transition
      const curSkyTop = lerpColor(prevT.skyTop, nextT.skyTop, tProgress);
      const curSkyMid = lerpColor(prevT.skyMid, nextT.skyMid, tProgress);
      const curSkyHorizon = lerpColor(prevT.skyHorizon, nextT.skyHorizon, tProgress);
      const curSkyBottom = lerpColor(prevT.skyBottom, nextT.skyBottom, tProgress);
      const curHorizonGlow = lerpColor(prevT.horizonGlowColor, nextT.horizonGlowColor, tProgress);
      const curHorizonGlowInner = lerpColor(prevT.horizonGlowInner, nextT.horizonGlowInner, tProgress);
      const curHorizonLine = lerpColor(prevT.horizonLineColor, nextT.horizonLineColor, tProgress);
      const curRoadTop = lerpColor(prevT.roadTop, nextT.roadTop, tProgress);
      const curRoadBottom = lerpColor(prevT.roadBottom, nextT.roadBottom, tProgress);
      const curGridLine = lerpColor(prevT.gridLineColor, nextT.gridLineColor, tProgress);
      const curTrackEdge = lerpColor(prevT.trackEdgeColor, nextT.trackEdgeColor, tProgress);
      const curShoulderLight = lerpColor(prevT.shoulderLightColor, nextT.shoulderLightColor, tProgress);
      const curLaneDivider = lerpColor(prevT.laneDividerColor, nextT.laneDividerColor, tProgress);

      currentThemeRef.current = {
        ...nextT,
        skyTop: curSkyTop,
        skyMid: curSkyMid,
        skyHorizon: curSkyHorizon,
        skyBottom: curSkyBottom,
        horizonGlowColor: curHorizonGlow,
        horizonGlowInner: curHorizonGlowInner,
        horizonLineColor: curHorizonLine,
        roadTop: curRoadTop,
        roadBottom: curRoadBottom,
        gridLineColor: curGridLine,
        trackEdgeColor: curTrackEdge,
        shoulderLightColor: curShoulderLight,
        laneDividerColor: curLaneDivider,
      };

      // --- 2. DYNAMIC SKY GRADIENT ---
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
        skyGrad.addColorStop(0, curSkyTop);
        skyGrad.addColorStop(0.35, curSkyMid);
        skyGrad.addColorStop(0.36, curSkyHorizon);
        skyGrad.addColorStop(1, curSkyBottom);
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      const horizonY = height * 0.35;

      // --- 3. PARALLAX TWINKLING STARS ---
      ctx.save();
      const starBaseColor = feverActive || isRushMode ? '#fde047' : nextT.starColor;
      const starCount = performanceMode ? 14 : starsSeedRef.current.length;
      for (let i = 0; i < starCount; i++) {
        const s = starsSeedRef.current[i];
        const sx = ((s.xR * width + runnerLaneXRef.current * 0.05) % width + width) % width;
        const sy = s.yR * (horizonY - 8);
        const twinkle = Math.sin(time * 0.003 + s.phase) * 0.35;
        const alpha = Math.max(0.2, Math.min(0.95, 0.55 + twinkle));
        ctx.fillStyle = starBaseColor;
        ctx.globalAlpha = alpha;
        ctx.fillRect(sx, sy, s.size, s.size);
      }
      ctx.restore();

      // --- 4. DYNAMIC CELESTIAL PHENOMENON (Synth Sun, Digital Moon, Aurora, Ringed Planet, Solar Corona) ---
      renderCelestialWonder(ctx, width, horizonY, nextT.celestialType, nextT.accentColor, curSkyHorizon, time, disableGlow);

      // --- 5. DISTANT HORIZON SILHOUETTES (2.5D PARALLAX DEPTH) ---
      renderDistantSilhouette(
        ctx,
        width,
        horizonY,
        nextT.silhouetteType,
        nextT.accentColor,
        curSkyHorizon,
        buildingsSeedRef.current,
        mountainPeaksSeedRef.current,
        runnerLaneXRef.current,
        time
      );

      // --- 6. HORIZON GLOW & DIVIDING NEON LINE ---
      const sunGrad = ctx.createRadialGradient(
        width / 2, horizonY, 8,
        width / 2, horizonY, width * 0.42
      );
      if (isRushMode) {
        sunGrad.addColorStop(0, 'rgba(244, 63, 94, 0.28)');
        sunGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.12)');
        sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (feverActive) {
        sunGrad.addColorStop(0, 'rgba(236, 72, 153, 0.25)');
        sunGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.10)');
        sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        sunGrad.addColorStop(0, curHorizonGlowInner);
        sunGrad.addColorStop(0.55, curHorizonGlow);
        sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, width, horizonY + 50);

      // Horizon line
      ctx.strokeStyle = isRushMode ? '#f43f5e' : feverActive ? '#ec4899' : activeEvent ? activeEvent.color : curHorizonLine;
      ctx.lineWidth = 2;
      setGlow(ctx, ctx.strokeStyle as string, 6, disableGlow);
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(width, horizonY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Sector / Biome Callout on the distant skyline
      renderSectorReadout(ctx, width, horizonY, nextT.code, nextT.name);

      // --- 7. 3-LANE PERSPECTIVE HIGHWAY ---
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
        roadGrad.addColorStop(0, curRoadTop);
        roadGrad.addColorStop(1, curRoadBottom);
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
      shoulderOffsetRef.current = (shoulderOffsetRef.current + delta * baseSpeed * 0.24) % 100;

      const numHorizLines = 14;
      ctx.strokeStyle = isRushMode
        ? 'rgba(244, 63, 94, 0.5)'
        : feverActive
        ? 'rgba(236, 72, 153, 0.4)'
        : curGridLine;
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
            : curTrackEdge
          : isRushMode
          ? 'rgba(251, 113, 133, 0.5)'
          : feverActive
          ? 'rgba(244, 114, 182, 0.5)'
          : curLaneDivider;
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

      // Lateral Speed Reflector Beacons rushing past track shoulders
      renderShoulderSpeedPillars(
        ctx,
        width,
        height,
        horizonY,
        trackTopWidth,
        trackBottomWidth,
        shoulderOffsetRef.current,
        isRushMode ? '#f43f5e' : feverActive ? '#ec4899' : curShoulderLight,
        disableGlow
      );

      // --- 4. SPEED LINES (WARP EFFECT - delta-time scaled, reduced in perf mode) ---
      ctx.strokeStyle = isRushMode
        ? 'rgba(244, 63, 94, 0.32)'
        : feverActive
        ? 'rgba(251, 191, 36, 0.25)'
        : activeEvent?.type === 'SPEED_UP'
        ? 'rgba(249, 115, 22, 0.30)'
        : 'rgba(148, 163, 184, 0.16)';
      ctx.lineWidth = 1;
      const linesCount = performanceMode ? 12 : speedLinesRef.current.length;
      for (let i = 0; i < linesCount; i++) {
        const line = speedLinesRef.current[i];
        line.y += line.speed * (effectiveSpeed * 0.9) * (delta * 60);
        if (line.y > height) {
          line.y = horizonY - 10;
          line.x = Math.random() * width;
        }

        const angle = Math.atan2(line.y - horizonY, line.x - width / 2);
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(line.x + Math.cos(angle) * line.length, line.y + Math.sin(angle) * line.length);
        ctx.stroke();
      }

      // --- 4B. SUBTLE FEVER PARTICLES (GENTLE AMBIENCE, POOLED) ---
      const feverSpawnChance = performanceMode ? 0.08 : speedMultiplier > 1.35 ? 0.12 : 0.22;
      if ((feverActive || isRushMode) && Math.random() < feverSpawnChance) {
        spawnPooledParticle(
          width * 0.15 + Math.random() * width * 0.7,
          height * 0.78,
          (Math.random() - 0.5) * 1.2,
          -1.5 - Math.random() * 2,
          1.5 + Math.random() * 2,
          isRushMode ? '#f43f5e' : Math.random() < 0.5 ? '#f59e0b' : '#ec4899',
          0.35,
          0.025
        );
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

        renderPowerUpPickup(ctx, pwrX, pwrY, pwrScale, activePowerUpPickup.type, time, disableGlow);
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

        renderObstacleGraphics(ctx, currentObstacle, feverActive || isRushMode, disableGlow);

        const remainingRatio = Math.max(0, currentObstacle.remainingTime / currentObstacle.timeLimit);
        renderReactionTimerHUD(ctx, remainingRatio, currentObstacle, disableGlow);

        ctx.restore();
      }

      // --- 7. RENDER RUNNER CHARACTER ---
      const targetLaneX = player.lane * (trackBottomWidth / 3.4);
      runnerLaneXRef.current += (targetLaneX - runnerLaneXRef.current) * Math.min(delta * 22, 1);

      const runnerBaseY = height * 0.74;
      const runnerBaseX = width / 2 + runnerLaneXRef.current;

      renderRunnerCharacter(ctx, runnerBaseX, runnerBaseY, player, feverActive || isRushMode, delta, activePowerUps, false, disableGlow);

      // --- 7B. RENDER GHOST RUNNER IF ACTIVE (Requirement 7: Ethereal glow, distinctive, 👻 GHOST label) ---
      if (ghostPlayer) {
        const targetGhostLaneX = ghostPlayer.lane * (trackBottomWidth / 3.4);
        ghostLaneXRef.current += (targetGhostLaneX - ghostLaneXRef.current) * Math.min(delta * 22, 1);

        // Subtle ethereal floating undulation so ghost feels spectral
        const ghostHoverOffset = Math.sin(time * 0.007) * 4;
        const ghostBaseY = height * 0.74 + ghostHoverOffset;
        const ghostBaseX = width / 2 + ghostLaneXRef.current;

        // Ethereal Ghost Halo & Label
        ctx.save();
        ctx.fillStyle = 'rgba(26, 16, 49, 0.85)';
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.2;
        setGlow(ctx, '#c084fc', 10, disableGlow);
        ctx.beginPath();
        const labelW = typeof ghostScore === 'number' ? 78 : 64;
        ctx.roundRect(ghostBaseX - labelW / 2, ghostBaseY - 88, labelW, 18, 5);
        ctx.fill();
        ctx.stroke();

        ctx.font = '800 9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#f3e8ff';
        ctx.textAlign = 'center';
        const ghostLabel = typeof ghostScore === 'number' ? `👻 GHOST · ${ghostScore}` : '👻 GHOST';
        ctx.fillText(ghostLabel, ghostBaseX, ghostBaseY - 76);
        ctx.restore();

        // Render Ghost Runner with semi-transparency and spectral glowing aura
        ctx.save();
        ctx.globalAlpha = 0.52;
        setGlow(ctx, '#a855f7', 14, disableGlow);
        renderRunnerCharacter(ctx, ghostBaseX, ghostBaseY, ghostPlayer, false, delta, undefined, true, disableGlow);
        ctx.restore();
      }

      // --- 8. RENDER COIN RAIN COINS IF ACTIVE ---
      if (rainCoins && rainCoins.length > 0) {
        rainCoins.forEach((rc) => {
          if (rc.collected) return;
          const px = rc.x * width;
          const py = rc.y * height;

          ctx.save();
          ctx.translate(px, py);
          setGlow(ctx, '#f59e0b', 8, disableGlow);
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

      // --- 9. PARTICLES UPDATE & DRAW (Object pooled, zero GC allocations) ---
      const deltaFactor = delta * 60;
      const pool = particlePoolRef.current;
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i];
        if (!p.active) continue;
        p.x += p.vx * deltaFactor;
        p.y += p.vy * deltaFactor;
        p.alpha -= p.decay * deltaFactor;
        p.size *= Math.pow(0.96, deltaFactor);

        if (p.alpha <= 0 || p.size < 0.5) {
          p.active = false;
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.isSparkle ? p.size * 1.2 : p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

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

    const handleVisibility = () => {
      if (!document.hidden) {
        lastTime = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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
    const { rainCoins: liveCoins, activePowerUpPickup: livePowerUp } = propsRef.current;

    // Check Rain Coins
    if (liveCoins && onCollectRainCoin) {
      for (const coin of liveCoins) {
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
    if (livePowerUp && !livePowerUp.collected && onCollectPowerUp) {
      const trackTopW = rect.width * 0.22;
      const trackBotW = rect.width * 0.92;
      const horY = rect.height * 0.35;
      const d = Math.max(0, Math.min(1, livePowerUp.distance));
      const t = 1.0 - d;
      const py = horY + Math.pow(t, 1.8) * (rect.height * 0.74 - horY);
      const rw = trackTopW + Math.pow(t, 1.8) * (trackBotW - trackTopW);
      const px = rect.width / 2 + livePowerUp.lane * (rw / 3);

      if (Math.hypot(tapX - px, tapY - py) < 65) {
        onCollectPowerUp(livePowerUp.id);
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
  time: number,
  disableGlow?: boolean
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
  setGlow(ctx, color, 20, disableGlow);
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
function renderObstacleGraphics(ctx: CanvasRenderingContext2D, obs: Obstacle, isBoosted: boolean, disableGlow?: boolean) {
  // BOSS OBSTACLE
  if (obs.isBoss && obs.bossSteps) {
    const currentStepAction = obs.bossSteps[obs.bossCurrentStepIndex || 0] || obs.action;
    const w = 240;
    const h = 130;

    ctx.save();
    ctx.translate(0, -30);

    // Boss Shadow
    setGlow(ctx, '#ef4444', 30, disableGlow);

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
    setGlow(ctx, '#ef4444', 25, disableGlow);
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    // Scanning eye
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(Math.sin(performance.now() * 0.008) * 8, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Boss Title
    if (disableGlow) ctx.shadowBlur = 0;
    else ctx.shadowBlur = 10;
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
    setGlow(ctx, '#f97316', 24, disableGlow);

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
    if (disableGlow) ctx.shadowBlur = 0;
    else ctx.shadowBlur = 10;
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
    setGlow(ctx, '#f97316', 14, disableGlow);
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

    setGlow(ctx, '#f59e0b', 12, disableGlow);
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

    setGlow(ctx, '#f59e0b', 6, disableGlow);
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
    setGlow(ctx, '#06b6d4', 14, disableGlow);
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

    setGlow(ctx, '#a855f7', 14, disableGlow);
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

    setGlow(ctx, '#f97316', 14, disableGlow);
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
function renderReactionTimerHUD(ctx: CanvasRenderingContext2D, ratio: number, obs: Obstacle, disableGlow?: boolean) {
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
  setGlow(ctx, timerColor, 8, disableGlow);
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
  activePowerUps?: ActivePowerUpState,
  isGhost?: boolean,
  disableGlow?: boolean
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
    setGlow(ctx, '#f59e0b', 25, disableGlow);
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
    setGlow(ctx, '#06b6d4', 18, disableGlow);
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
  const suitColor = isGhost
    ? '#9333ea'
    : isFever
    ? '#ec4899'
    : player.currentAction === 'HURT'
    ? '#ef4444'
    : skin.suitColor;
  ctx.fillStyle = suitColor;
  ctx.beginPath();
  ctx.roundRect(-14, -36, 28, 38, 8);
  ctx.fill();

  // Chest energy core
  ctx.fillStyle = isGhost ? '#e9d5ff' : isFever ? '#fef08a' : skin.coreColor;
  ctx.beginPath();
  ctx.arc(0, -22, 6, 0, Math.PI * 2);
  ctx.fill();

  // Helmet
  ctx.fillStyle = isGhost ? '#581c87' : isFever ? '#3b0764' : skin.helmetColor;
  ctx.beginPath();
  ctx.roundRect(-16, -58, 32, 26, 12);
  ctx.fill();

  // Special accessories based on skin
  if (player.skinId === 'robot') {
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-2, -66, 4, 9);
    ctx.fillStyle = '#10b981';
    setGlow(ctx, '#10b981', 8, disableGlow);
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
  ctx.fillStyle = isGhost
    ? '#38bdf8'
    : isFever
    ? '#fbbf24'
    : player.currentAction === 'HURT'
    ? '#ef4444'
    : skin.visorColor;
  setGlow(ctx, isGhost ? '#38bdf8' : ctx.fillStyle, isGhost ? 14 : 10, disableGlow);
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

// Helper: Render Dynamic Celestial Wonder (Synth Sun, Digital Moon, Aurora, Ringed Planet, Solar Corona, etc.)
function renderCelestialWonder(
  ctx: CanvasRenderingContext2D,
  width: number,
  horizonY: number,
  celestialType: string,
  accentColor: string,
  skyHorizonColor: string,
  time: number,
  disableGlow?: boolean
) {
  if (celestialType === 'DIGITAL_MOON') {
    const moonX = width * 0.74;
    const moonY = horizonY * 0.44;
    ctx.save();
    ctx.translate(moonX, moonY);
    setGlow(ctx, accentColor, 18, disableGlow);
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(0, 0, 18, -Math.PI * 0.6, Math.PI * 0.6, false);
    ctx.arc(7, 0, 15, Math.PI * 0.55, -Math.PI * 0.55, true);
    ctx.closePath();
    ctx.fill();

    // Digital orbit ring
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  } else if (celestialType === 'SYNTH_SUN') {
    const sunX = width / 2;
    const sunY = horizonY - 4;
    const sunR = Math.min(68, width * 0.17);
    ctx.save();
    setGlow(ctx, '#f43f5e', 24, disableGlow);
    const grad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.3, '#facc15');
    grad.addColorStop(0.65, '#f43f5e');
    grad.addColorStop(1, '#9333ea');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Horizontal cuts (slits)
    ctx.fillStyle = skyHorizonColor;
    const cuts = [
      { offset: sunR * 0.12, h: 2.2 },
      { offset: sunR * 0.32, h: 3.5 },
      { offset: sunR * 0.52, h: 5.0 },
      { offset: sunR * 0.72, h: 7.0 },
      { offset: sunR * 0.90, h: 9.0 },
    ];
    cuts.forEach((c) => {
      ctx.fillRect(sunX - sunR - 4, sunY + c.offset, (sunR + 4) * 2, c.h);
    });
    ctx.restore();
  } else if (celestialType === 'AURORA_SPIRES') {
    ctx.save();
    for (let a = 0; a < 3; a++) {
      const wavePhase = time * 0.0012 + a * 1.8;
      ctx.beginPath();
      ctx.moveTo(0, horizonY * 0.15 + a * 14);
      for (let x = 0; x <= width; x += 16) {
        const y =
          horizonY * (0.2 + a * 0.12) +
          Math.sin(x * 0.012 + wavePhase) * 16 +
          Math.cos(x * 0.024 - wavePhase * 0.8) * 10;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, horizonY * 0.85);
      ctx.lineTo(0, horizonY * 0.85);
      ctx.closePath();
      const aGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      aGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      aGrad.addColorStop(0.4, a % 2 === 0 ? 'rgba(16, 185, 129, 0.18)' : 'rgba(6, 182, 212, 0.15)');
      aGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = aGrad;
      ctx.fill();
    }
    ctx.restore();
  } else if (celestialType === 'RINGED_PLANET') {
    const pX = width * 0.28;
    const pY = horizonY * 0.44;
    const pR = 24;
    ctx.save();
    ctx.translate(pX, pY);
    const nebGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 65);
    nebGrad.addColorStop(0, 'rgba(192, 132, 252, 0.35)');
    nebGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.15)');
    nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nebGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 65, 0, Math.PI * 2);
    ctx.fill();

    const pGrad = ctx.createLinearGradient(-pR, -pR, pR, pR);
    pGrad.addColorStop(0, '#e9d5ff');
    pGrad.addColorStop(0.45, '#818cf8');
    pGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = pGrad;
    setGlow(ctx, '#c084fc', 15, disableGlow);
    ctx.beginPath();
    ctx.arc(0, 0, pR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.rotate(-Math.PI * 0.14);
    ctx.strokeStyle = 'rgba(233, 213, 255, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 48, 12, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 56, 15, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (celestialType === 'SOLAR_CORONA') {
    const sX = width / 2;
    const sY = horizonY - 2;
    const sR = Math.min(65, width * 0.17);
    ctx.save();
    const numRays = 12;
    for (let r = 0; r < numRays; r++) {
      const rayAngle = (r / numRays) * Math.PI + time * 0.0004;
      if (rayAngle > Math.PI) continue;
      const rayLen = sR * (1.35 + Math.sin(time * 0.004 + r) * 0.25);
      ctx.strokeStyle = r % 2 === 0 ? 'rgba(250, 204, 21, 0.25)' : 'rgba(249, 115, 22, 0.2)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sX, sY);
      ctx.lineTo(sX + Math.cos(rayAngle) * rayLen, sY - Math.sin(rayAngle) * rayLen);
      ctx.stroke();
    }
    setGlow(ctx, '#facc15', 30, disableGlow);
    const cGrad = ctx.createRadialGradient(sX, sY, 4, sX, sY, sR);
    cGrad.addColorStop(0, '#ffffff');
    cGrad.addColorStop(0.3, '#fef08a');
    cGrad.addColorStop(0.65, '#f59e0b');
    cGrad.addColorStop(1, '#ea580c');
    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.arc(sX, sY, sR, Math.PI, 0, false);
    ctx.fill();
    ctx.restore();
  } else if (celestialType === 'SPECTRAL_ECLIPSE') {
    const eX = width / 2;
    const eY = horizonY - 12;
    const eR = 36;
    ctx.save();
    setGlow(ctx, '#c084fc', 28, disableGlow);
    const gGrad = ctx.createRadialGradient(eX, eY, eR * 0.8, eX, eY, eR * 1.9);
    gGrad.addColorStop(0, 'rgba(216, 180, 254, 0.9)');
    gGrad.addColorStop(0.4, 'rgba(168, 85, 247, 0.4)');
    gGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gGrad;
    ctx.beginPath();
    ctx.arc(eX, eY, eR * 1.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#06010d';
    ctx.beginPath();
    ctx.arc(eX, eY, eR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#e9d5ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  } else if (celestialType === 'COSMIC_SINGULARITY') {
    const cX = width / 2;
    const cY = horizonY - 14;
    const cR = 22;
    ctx.save();
    setGlow(ctx, '#38bdf8', 22, disableGlow);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(cX, cY, 68, 14, -0.15, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(cX, cY, 78, 17, -0.15, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cX, cY, cR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  } else if (celestialType === 'HOLO_RADAR') {
    const rX = width / 2;
    const rY = horizonY * 0.46;
    ctx.save();
    ctx.translate(rX, rY);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
    ctx.lineWidth = 1;
    [18, 36, 54].forEach((r) => {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    });
    const armAngle = time * 0.0018;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(armAngle) * 54, Math.sin(armAngle) * 54);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
    ctx.beginPath();
    ctx.moveTo(-60, 0);
    ctx.lineTo(60, 0);
    ctx.moveTo(0, -60);
    ctx.lineTo(0, 60);
    ctx.stroke();
    ctx.restore();
  }
}

// Helper: Render Distant Silhouette (Skyscrapers, Wireframe Peaks, Techno Spires, Solar Pylons, etc.)
function renderDistantSilhouette(
  ctx: CanvasRenderingContext2D,
  width: number,
  horizonY: number,
  silhouetteType: string,
  accentColor: string,
  skyHorizonColor: string,
  buildingsSeed: BuildingSeed[],
  peaksSeed: PeakSeed[],
  runnerLaneOffset: number,
  time: number
) {
  const parallaxX = runnerLaneOffset * 0.06;
  ctx.save();

  if (silhouetteType === 'WIREFRAME_PEAKS') {
    ctx.translate(parallaxX, 0);
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    peaksSeed.forEach((p) => {
      const px = p.xR * width;
      const py = horizonY - p.h;
      ctx.lineTo(px, py);
    });
    ctx.lineTo(width, horizonY);
    ctx.closePath();
    ctx.fillStyle = 'rgba(15, 3, 24, 0.9)';
    ctx.fill();

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.strokeStyle = `${accentColor}44`;
    ctx.lineWidth = 1;
    peaksSeed.forEach((p, idx) => {
      if (idx % 2 === 0) {
        ctx.beginPath();
        ctx.moveTo(p.xR * width, horizonY - p.h);
        ctx.lineTo(p.xR * width, horizonY);
        ctx.stroke();
      }
    });
  } else if (silhouetteType === 'SKYSCRAPERS' || silhouetteType === 'TECHNO_SPIRES') {
    ctx.translate(parallaxX, 0);
    buildingsSeed.forEach((b) => {
      const bx = b.xR * (width + 60) - 30;
      const by = horizonY - b.h;

      ctx.fillStyle = '#080d1a';
      ctx.fillRect(bx, by, b.w, b.h);

      ctx.fillStyle = accentColor;
      ctx.fillRect(bx, by, b.w, 1.5);

      b.windows.forEach((w) => {
        if (by + w.ry < horizonY - 4 && bx + w.rx < bx + b.w - 3) {
          ctx.fillStyle = w.color;
          ctx.fillRect(bx + w.rx, by + w.ry, 2.5, 3.5);
        }
      });

      if (b.hasAntenna) {
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx + b.w / 2, by);
        ctx.lineTo(bx + b.w / 2, by - 14);
        ctx.stroke();

        const blink = Math.sin(time * 0.005 + b.xR * 20) > 0.3;
        ctx.fillStyle = blink ? '#ef4444' : '#1e293b';
        ctx.beginPath();
        ctx.arc(bx + b.w / 2, by - 14, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  } else if (silhouetteType === 'CRYSTAL_RIDGES' || silhouetteType === 'SPECTRAL_RUINS') {
    ctx.translate(parallaxX, 0);
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    for (let i = 0; i < 16; i++) {
      const cx = (i / 15) * width;
      const ch = 20 + Math.sin(i * 2.3 + time * 0.0008) * 14 + (i % 3) * 12;
      ctx.lineTo(cx, horizonY - ch);
    }
    ctx.lineTo(width, horizonY);
    ctx.closePath();
    ctx.fillStyle = 'rgba(10, 4, 25, 0.92)';
    ctx.fill();

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (silhouetteType === 'SOLAR_PYLONS') {
    ctx.translate(parallaxX, 0);
    const pylonCount = 6;
    for (let p = 0; p < pylonCount; p++) {
      const px = (p / (pylonCount - 1)) * (width * 0.85) + width * 0.075;
      const ph = 50 + (p % 2) * 22;
      ctx.fillStyle = '#1c0804';
      ctx.beginPath();
      ctx.moveTo(px - 6, horizonY);
      ctx.lineTo(px - 2, horizonY - ph);
      ctx.lineTo(px + 2, horizonY - ph);
      ctx.lineTo(px + 6, horizonY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.fillRect(px - 1, horizonY - ph + 6, 2, ph - 12);
    }
  } else if (silhouetteType === 'HOLO_DEM') {
    ctx.translate(parallaxX, 0);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 30) {
      const yh = horizonY - 15 - Math.sin(x * 0.02) * 12;
      ctx.moveTo(x, horizonY);
      ctx.lineTo(x, yh);
    }
    ctx.stroke();
  }

  ctx.restore();
}

// Helper: Render Sector / Biome Readout
function renderSectorReadout(
  ctx: CanvasRenderingContext2D,
  width: number,
  horizonY: number,
  code: string,
  name: string
) {
  ctx.save();
  ctx.font = '800 8.5px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.textAlign = 'center';
  ctx.fillText(`// ${code} · ${name}`, width / 2, horizonY - 7);
  ctx.restore();
}

// Helper: Render Lateral Speed Reflector Beacons rushing past track shoulders
function renderShoulderSpeedPillars(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  horizonY: number,
  trackTopWidth: number,
  trackBottomWidth: number,
  offset: number,
  shoulderColor: string,
  disableGlow?: boolean
) {
  ctx.save();
  const numPillars = 8;
  for (let i = 0; i < numPillars; i++) {
    const t = ((i * (100 / numPillars) + offset) % 100) / 100;
    if (t < 0.06) continue;
    const py = horizonY + Math.pow(t, 2.2) * (height - horizonY);
    const wAtY = trackTopWidth + Math.pow(t, 2.2) * (trackBottomWidth - trackTopWidth);
    const lx = (width - wAtY) / 2 - 5;
    const rx = lx + wAtY + 10;

    const pillarHeight = Math.max(2, Math.pow(t, 2.2) * 20);
    const pillarWidth = Math.max(1.5, Math.pow(t, 2.2) * 4);

    ctx.fillStyle = shoulderColor;
    if (!disableGlow) {
      ctx.shadowColor = shoulderColor;
      ctx.shadowBlur = Math.min(10, Math.pow(t, 2.2) * 12);
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.fillRect(lx - pillarWidth, py - pillarHeight, pillarWidth, pillarHeight);
    ctx.fillRect(rx, py - pillarHeight, pillarWidth, pillarHeight);
  }
  ctx.restore();
}
