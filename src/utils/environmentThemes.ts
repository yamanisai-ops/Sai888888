import { GameMode } from '../types/game';

export type BiomeId =
  | 'CYBER_MIDNIGHT'
  | 'SYNTH_SUNSET'
  | 'NEO_TOKYO'
  | 'QUANTUM_NEBULA'
  | 'SOLAR_APEX'
  | 'GHOST_NETHER'
  | 'COSMIC_VOID'
  | 'HOLO_SIMULATOR';

export interface EnvironmentTheme {
  id: BiomeId;
  name: string;
  code: string;
  subtitle: string;
  badgeColor: string;
  accentColor: string;
  // Sky linear gradient stops
  skyTop: string;
  skyMid: string;
  skyHorizon: string;
  skyBottom: string;
  // Horizon visuals
  horizonGlowColor: string;
  horizonGlowInner: string;
  horizonLineColor: string;
  // Road & Grid
  roadTop: string;
  roadBottom: string;
  gridLineColor: string;
  trackEdgeColor: string;
  shoulderLightColor: string;
  laneDividerColor: string;
  // Celestial & Silhouette types
  starColor: string;
  particleColor: string;
  celestialType:
    | 'DIGITAL_MOON'
    | 'SYNTH_SUN'
    | 'AURORA_SPIRES'
    | 'RINGED_PLANET'
    | 'SOLAR_CORONA'
    | 'SPECTRAL_ECLIPSE'
    | 'COSMIC_SINGULARITY'
    | 'HOLO_RADAR';
  silhouetteType:
    | 'SKYSCRAPERS'
    | 'WIREFRAME_PEAKS'
    | 'TECHNO_SPIRES'
    | 'CRYSTAL_RIDGES'
    | 'SOLAR_PYLONS'
    | 'SPECTRAL_RUINS'
    | 'HOLO_DEM';
}

// 1. Zone 1: Cyber Midnight (Classic Score 0-14)
export const THEME_CYBER_MIDNIGHT: EnvironmentTheme = {
  id: 'CYBER_MIDNIGHT',
  name: 'MIDNIGHT HIGHWAY',
  code: 'SECTOR 01',
  subtitle: 'Urban Cyber Grid',
  badgeColor: '#38bdf8',
  accentColor: '#06b6d4',
  skyTop: '#020617',
  skyMid: '#090d16',
  skyHorizon: '#0e1726',
  skyBottom: '#030712',
  horizonGlowColor: 'rgba(56, 189, 248, 0.18)',
  horizonGlowInner: 'rgba(56, 189, 248, 0.35)',
  horizonLineColor: '#38bdf8',
  roadTop: '#0f172a',
  roadBottom: '#020617',
  gridLineColor: 'rgba(56, 189, 248, 0.25)',
  trackEdgeColor: '#38bdf8',
  shoulderLightColor: '#06b6d4',
  laneDividerColor: 'rgba(56, 189, 248, 0.35)',
  starColor: 'rgba(255, 255, 255, 0.45)',
  particleColor: '#38bdf8',
  celestialType: 'DIGITAL_MOON',
  silhouetteType: 'SKYSCRAPERS',
};

// 2. Zone 2: Synthwave Sunset (Classic Score 15-29)
export const THEME_SYNTH_SUNSET: EnvironmentTheme = {
  id: 'SYNTH_SUNSET',
  name: 'SYNTHWAVE SUNSET',
  code: 'SECTOR 02',
  subtitle: 'Outrun Horizon Vista',
  badgeColor: '#f43f5e',
  accentColor: '#f59e0b',
  skyTop: '#1e052c',
  skyMid: '#58133f',
  skyHorizon: '#881337',
  skyBottom: '#18041d',
  horizonGlowColor: 'rgba(244, 63, 94, 0.26)',
  horizonGlowInner: 'rgba(251, 146, 60, 0.42)',
  horizonLineColor: '#f43f5e',
  roadTop: '#2d0b28',
  roadBottom: '#0e0310',
  gridLineColor: 'rgba(244, 63, 94, 0.32)',
  trackEdgeColor: '#ec4899',
  shoulderLightColor: '#f59e0b',
  laneDividerColor: 'rgba(244, 63, 94, 0.4)',
  starColor: 'rgba(254, 215, 170, 0.65)',
  particleColor: '#fb923c',
  celestialType: 'SYNTH_SUN',
  silhouetteType: 'WIREFRAME_PEAKS',
};

// 3. Zone 3: Neo-Tokyo Megacity (Classic Score 30-49)
export const THEME_NEO_TOKYO: EnvironmentTheme = {
  id: 'NEO_TOKYO',
  name: 'NEO-TOKYO MATRIX',
  code: 'SECTOR 03',
  subtitle: 'Digital Megacity Spires',
  badgeColor: '#10b981',
  accentColor: '#06b6d4',
  skyTop: '#022019',
  skyMid: '#064e3b',
  skyHorizon: '#047857',
  skyBottom: '#011812',
  horizonGlowColor: 'rgba(16, 185, 129, 0.22)',
  horizonGlowInner: 'rgba(52, 211, 153, 0.4)',
  horizonLineColor: '#10b981',
  roadTop: '#032a1f',
  roadBottom: '#01120d',
  gridLineColor: 'rgba(16, 185, 129, 0.3)',
  trackEdgeColor: '#10b981',
  shoulderLightColor: '#34d399',
  laneDividerColor: 'rgba(16, 185, 129, 0.38)',
  starColor: 'rgba(167, 243, 208, 0.6)',
  particleColor: '#10b981',
  celestialType: 'AURORA_SPIRES',
  silhouetteType: 'TECHNO_SPIRES',
};

// 4. Zone 4: Quantum Nebula (Classic Score 50-74)
export const THEME_QUANTUM_NEBULA: EnvironmentTheme = {
  id: 'QUANTUM_NEBULA',
  name: 'QUANTUM NEBULA',
  code: 'SECTOR 04',
  subtitle: 'Hyperdrive Deep Space',
  badgeColor: '#c084fc',
  accentColor: '#818cf8',
  skyTop: '#0d0221',
  skyMid: '#24084a',
  skyHorizon: '#3b0764',
  skyBottom: '#080117',
  horizonGlowColor: 'rgba(192, 132, 252, 0.25)',
  horizonGlowInner: 'rgba(129, 140, 248, 0.45)',
  horizonLineColor: '#c084fc',
  roadTop: '#1b0933',
  roadBottom: '#090214',
  gridLineColor: 'rgba(192, 132, 252, 0.35)',
  trackEdgeColor: '#a855f7',
  shoulderLightColor: '#818cf8',
  laneDividerColor: 'rgba(192, 132, 252, 0.42)',
  starColor: 'rgba(233, 213, 255, 0.8)',
  particleColor: '#c084fc',
  celestialType: 'RINGED_PLANET',
  silhouetteType: 'CRYSTAL_RIDGES',
};

// 5. Zone 5: Solar Apex (Classic Score 75+)
export const THEME_SOLAR_APEX: EnvironmentTheme = {
  id: 'SOLAR_APEX',
  name: 'SOLAR APEX',
  code: 'SECTOR 05',
  subtitle: 'Overdrive Celestial Corona',
  badgeColor: '#facc15',
  accentColor: '#f97316',
  skyTop: '#1a0505',
  skyMid: '#5f1212',
  skyHorizon: '#852108',
  skyBottom: '#180404',
  horizonGlowColor: 'rgba(250, 204, 21, 0.3)',
  horizonGlowInner: 'rgba(249, 115, 22, 0.55)',
  horizonLineColor: '#facc15',
  roadTop: '#380a0a',
  roadBottom: '#140303',
  gridLineColor: 'rgba(250, 204, 21, 0.4)',
  trackEdgeColor: '#f59e0b',
  shoulderLightColor: '#facc15',
  laneDividerColor: 'rgba(250, 204, 21, 0.48)',
  starColor: 'rgba(254, 240, 138, 0.85)',
  particleColor: '#facc15',
  celestialType: 'SOLAR_CORONA',
  silhouetteType: 'SOLAR_PYLONS',
};

// GHOST MODE: Spectral Nether Rift
export const THEME_GHOST_NETHER: EnvironmentTheme = {
  id: 'GHOST_NETHER',
  name: 'SPECTRAL RIFT',
  code: 'NETHER REALM',
  subtitle: 'Phantom Spirit Domain',
  badgeColor: '#d8b4fe',
  accentColor: '#c084fc',
  skyTop: '#0f051d',
  skyMid: '#280c44',
  skyHorizon: '#3b0764',
  skyBottom: '#0a0214',
  horizonGlowColor: 'rgba(168, 85, 247, 0.28)',
  horizonGlowInner: 'rgba(192, 132, 252, 0.48)',
  horizonLineColor: '#c084fc',
  roadTop: '#210839',
  roadBottom: '#0c0217',
  gridLineColor: 'rgba(192, 132, 252, 0.35)',
  trackEdgeColor: '#c084fc',
  shoulderLightColor: '#e9d5ff',
  laneDividerColor: 'rgba(192, 132, 252, 0.45)',
  starColor: 'rgba(233, 213, 255, 0.75)',
  particleColor: '#c084fc',
  celestialType: 'SPECTRAL_ECLIPSE',
  silhouetteType: 'SPECTRAL_RUINS',
};

// ENDLESS MODE: Cosmic Void
export const THEME_COSMIC_VOID: EnvironmentTheme = {
  id: 'COSMIC_VOID',
  name: 'COSMIC VOID',
  code: 'ENDLESS ABYSS',
  subtitle: 'Infinite Gravitational Warp',
  badgeColor: '#38bdf8',
  accentColor: '#ec4899',
  skyTop: '#03071e',
  skyMid: '#1b0933',
  skyHorizon: '#2e1065',
  skyBottom: '#050212',
  horizonGlowColor: 'rgba(147, 51, 234, 0.28)',
  horizonGlowInner: 'rgba(56, 189, 248, 0.45)',
  horizonLineColor: '#a855f7',
  roadTop: '#180730',
  roadBottom: '#070114',
  gridLineColor: 'rgba(147, 51, 234, 0.35)',
  trackEdgeColor: '#38bdf8',
  shoulderLightColor: '#ec4899',
  laneDividerColor: 'rgba(147, 51, 234, 0.42)',
  starColor: 'rgba(255, 255, 255, 0.85)',
  particleColor: '#38bdf8',
  celestialType: 'COSMIC_SINGULARITY',
  silhouetteType: 'CRYSTAL_RIDGES',
};

// CHALLENGE MODE: Holo Simulator
export const THEME_HOLO_SIMULATOR: EnvironmentTheme = {
  id: 'HOLO_SIMULATOR',
  name: 'HOLO-SIMULATOR',
  code: 'SIM MATRIX',
  subtitle: 'Tactical Holo-Chamber',
  badgeColor: '#06b6d4',
  accentColor: '#3b82f6',
  skyTop: '#021024',
  skyMid: '#062042',
  skyHorizon: '#0c356a',
  skyBottom: '#020d1e',
  horizonGlowColor: 'rgba(6, 182, 212, 0.25)',
  horizonGlowInner: 'rgba(59, 130, 246, 0.45)',
  horizonLineColor: '#06b6d4',
  roadTop: '#07244a',
  roadBottom: '#021124',
  gridLineColor: 'rgba(6, 182, 212, 0.35)',
  trackEdgeColor: '#06b6d4',
  shoulderLightColor: '#3b82f6',
  laneDividerColor: 'rgba(6, 182, 212, 0.42)',
  starColor: 'rgba(186, 230, 253, 0.7)',
  particleColor: '#06b6d4',
  celestialType: 'HOLO_RADAR',
  silhouetteType: 'HOLO_DEM',
};

/**
 * Returns the target EnvironmentTheme based on game mode, current score, and survival time.
 */
export function getEnvironmentTheme(
  score: number,
  mode: GameMode = 'CLASSIC',
  survivalTimeSec: number = 0
): EnvironmentTheme {
  if (mode === 'GHOST') {
    return THEME_GHOST_NETHER;
  }

  if (mode === 'CHALLENGE') {
    return THEME_HOLO_SIMULATOR;
  }

  if (mode === 'ENDLESS') {
    // Endless mode cycles dynamically with survival time + score
    const progression = score + Math.floor(survivalTimeSec * 0.8);
    if (progression < 20) return THEME_CYBER_MIDNIGHT;
    if (progression < 45) return THEME_SYNTH_SUNSET;
    if (progression < 75) return THEME_NEO_TOKYO;
    if (progression < 110) return THEME_QUANTUM_NEBULA;
    if (progression < 160) return THEME_SOLAR_APEX;
    return THEME_COSMIC_VOID;
  }

  // Classic mode progression thresholds
  if (score < 15) return THEME_CYBER_MIDNIGHT;
  if (score < 30) return THEME_SYNTH_SUNSET;
  if (score < 50) return THEME_NEO_TOKYO;
  if (score < 75) return THEME_QUANTUM_NEBULA;
  return THEME_SOLAR_APEX;
}

// --- COLOR LERP UTILITIES FOR SEAMLESS 60FPS TRANSITIONS ---

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parseColorToRgba(color: string): Rgba {
  // Trim and check
  const c = color.trim();
  if (c.startsWith('#')) {
    let hex = c.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((char) => char + char).join('');
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16) || 0,
        g: parseInt(hex.slice(2, 4), 16) || 0,
        b: parseInt(hex.slice(4, 6), 16) || 0,
        a: 1.0,
      };
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16) || 0,
        g: parseInt(hex.slice(2, 4), 16) || 0,
        b: parseInt(hex.slice(4, 6), 16) || 0,
        a: (parseInt(hex.slice(6, 8), 16) || 255) / 255,
      };
    }
  }

  if (c.startsWith('rgba') || c.startsWith('rgb')) {
    const match = c.match(/[\d.]+/g);
    if (match && match.length >= 3) {
      return {
        r: parseFloat(match[0]) || 0,
        g: parseFloat(match[1]) || 0,
        b: parseFloat(match[2]) || 0,
        a: match[3] !== undefined ? parseFloat(match[3]) : 1.0,
      };
    }
  }

  return { r: 0, g: 0, b: 0, a: 1.0 };
}

export function lerpColor(c1: string, c2: string, t: number): string {
  if (t <= 0) return c1;
  if (t >= 1) return c2;
  const rgb1 = parseColorToRgba(c1);
  const rgb2 = parseColorToRgba(c2);

  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
  const a = +(rgb1.a + (rgb2.a - rgb1.a) * t).toFixed(3);

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
