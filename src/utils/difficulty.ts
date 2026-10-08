import {
  Action,
  ActiveEvent,
  DistractionType,
  GameMode,
  Obstacle,
  ObstacleStyle,
  PowerUp,
  PowerUpType,
  RandomEventType,
} from '../types/game';

export interface DifficultyConfig {
  reactionTimeMs: number;
  speedMultiplier: number;
  obstacleIntervalMs: number;
  twoStepChance: number;
  distractionChance: number;
}

export function getDifficulty(score: number): DifficultyConfig {
  if (score < 10) {
    // Stage 1: Easy learning zone for new players
    return {
      reactionTimeMs: 1200, // 1.2s - generous and friendly
      speedMultiplier: 1.0,
      obstacleIntervalMs: 580,
      twoStepChance: 0,
      distractionChance: 0,
    };
  } else if (score < 20) {
    // Stage 2: Finding rhythm
    return {
      reactionTimeMs: 1050, // 1.05s
      speedMultiplier: 1.15,
      obstacleIntervalMs: 500,
      twoStepChance: 0,
      distractionChance: 0,
    };
  } else if (score < 30) {
    // Stage 3: Introduction of gentle mechanics
    return {
      reactionTimeMs: 920,
      speedMultiplier: 1.25,
      obstacleIntervalMs: 440,
      twoStepChance: 0.2, // 20% two-step chance
      distractionChance: 0.15,
    };
  } else if (score < 50) {
    // Stage 4: High focus
    return {
      reactionTimeMs: 820,
      speedMultiplier: 1.4,
      obstacleIntervalMs: 380,
      twoStepChance: 0.28,
      distractionChance: 0.22,
    };
  } else {
    // Stage 5: Reflex Master (fair ceiling)
    return {
      reactionTimeMs: 740, // Keeps humanly fair (~0.74s)
      speedMultiplier: 1.55,
      obstacleIntervalMs: 340,
      twoStepChance: 0.32,
      distractionChance: 0.25,
    };
  }
}

// Endless Mode continuous difficulty scaling:
// Speed continuously increases, reaction time window tightens, and event frequency escalates
export function getEndlessDifficulty(survivalTimeSec: number, score: number): DifficultyConfig {
  const timeFactor = Math.min(460, Math.floor((survivalTimeSec || 0) * 4.2));
  const scoreFactor = Math.min(200, Math.floor((score || 0) * 3.2));
  const reactionTimeMs = Math.max(580, 1200 - timeFactor - scoreFactor);

  const speedMultiplier = Math.min(2.2, 1.0 + ((survivalTimeSec || 0) * 0.009) + ((score || 0) * 0.007));
  const obstacleIntervalMs = Math.max(260, 560 - Math.floor((survivalTimeSec || 0) * 2.2) - Math.floor((score || 0) * 1.8));
  const twoStepChance = Math.min(0.42, 0.05 + ((survivalTimeSec || 0) * 0.003) + ((score || 0) * 0.003));
  const distractionChance = Math.min(0.35, 0.05 + ((survivalTimeSec || 0) * 0.0025) + ((score || 0) * 0.0025));

  return {
    reactionTimeMs,
    speedMultiplier,
    obstacleIntervalMs,
    twoStepChance,
    distractionChance,
  };
}

const ACTIONS: Action[] = ['JUMP', 'SLIDE', 'LEFT', 'RIGHT'];

export function generateRandomObstacle(
  score: number,
  lastAction?: Action,
  activeEvent?: ActiveEvent | null,
  isRushMode?: boolean,
  mode: GameMode = 'CLASSIC',
  survivalTimeSec: number = 0
): Obstacle {
  const diff = mode === 'ENDLESS'
    ? getEndlessDifficulty(survivalTimeSec, score)
    : getDifficulty(score);

  // Avoid identical action 3 times in a row
  let action: Action;
  const availableActions = ACTIONS.filter((a) => a !== lastAction);
  if (Math.random() < 0.75 && availableActions.length > 0) {
    action = availableActions[Math.floor(Math.random() * availableActions.length)];
  } else {
    action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  }

  // Adjust reaction time if SLOW_MOTION, SPEED_UP, or LIGHTNING_ROUND
  let timeLimit = diff.reactionTimeMs;
  if (activeEvent?.type === 'SLOW_MOTION') {
    timeLimit = Math.round(timeLimit * 1.35); // Generous slow motion
  } else if (activeEvent?.type === 'SPEED_UP' || activeEvent?.type === 'SPEED_BURST') {
    timeLimit = Math.max(680, Math.round(timeLimit * 0.88)); // Quick speed burst
  } else if (activeEvent?.type === 'LIGHTNING_ROUND') {
    timeLimit = Math.max(650, Math.round(timeLimit * 0.84));
  }

  if (isRushMode) {
    timeLimit = Math.max(660, Math.round(timeLimit * 0.85));
  }

  const isTwoStep = Math.random() < diff.twoStepChance;
  let secondAction: Action | undefined = undefined;

  if (isTwoStep) {
    const candidates = ACTIONS.filter((a) => a !== action);
    secondAction = candidates[Math.floor(Math.random() * candidates.length)];
  }

  let distraction: DistractionType | undefined = undefined;
  if (Math.random() < diff.distractionChance) {
    distraction = Math.random() < 0.5 ? 'GLITCH' : 'CAUTION';
  }

  const fakeWarningActive = activeEvent?.type === 'FAKE_WARNING';

  // Determine obstacle visual style pattern:
  let style: ObstacleStyle = 'LOW';
  if (isTwoStep) {
    style = 'DOUBLE_SEQ';
  } else if (action === 'JUMP') {
    style = 'LOW'; // Low obstacle -> JUMP
  } else if (action === 'SLIDE') {
    style = 'HIGH'; // High obstacle -> SLIDE
  } else if (action === 'RIGHT') {
    style = 'LEFT_WALL'; // Left barrier -> RIGHT
  } else if (action === 'LEFT') {
    style = 'RIGHT_WALL'; // Right barrier -> LEFT
  }

  // Occasionally introduce moving or fake warning obstacle at score >= 20
  if (!isTwoStep && score >= 20 && Math.random() < 0.22) {
    style = 'MOVING';
  } else if (fakeWarningActive || (!isTwoStep && score >= 25 && Math.random() < 0.16)) {
    style = 'FAKE_WARN';
  }

  const id = `obs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  return {
    id,
    action,
    isTwoStep,
    secondAction,
    currentStep: 1,
    timeLimit,
    remainingTime: timeLimit,
    spawnTimestamp: performance.now(),
    distraction,
    fakeWarningActive,
    style,
    isBoss: false,
    distance: 1.0,
    cleared: false,
    failed: false,
  };
}

// Generate 2-step Mini Boss Obstacle
export function generateMiniBossObstacle(): Obstacle {
  // Generate 2 distinct actions in sequence
  const miniBossSequence: Action[] = [];
  const firstAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  miniBossSequence.push(firstAction);
  const remaining = ACTIONS.filter((a) => a !== firstAction);
  const secondAction = remaining[Math.floor(Math.random() * remaining.length)];
  miniBossSequence.push(secondAction);

  const stepTime = 1150; // Generous 1.15s per action
  const id = `miniboss_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  return {
    id,
    action: miniBossSequence[0],
    isTwoStep: false,
    currentStep: 1,
    timeLimit: stepTime,
    remainingTime: stepTime,
    spawnTimestamp: performance.now(),
    isMiniBoss: true,
    isBoss: false,
    style: 'MINI_BOSS',
    miniBossSteps: miniBossSequence,
    miniBossCurrentStepIndex: 0,
    miniBossTotalSteps: 2,
    distance: 1.0,
    cleared: false,
    failed: false,
  };
}

// Generate 3-step Boss Obstacle
export function generateBossObstacle(): Obstacle {
  // Generate 3 distinct actions in sequence
  const bossSequence: Action[] = [];
  let prevAction: Action | undefined = undefined;

  for (let i = 0; i < 3; i++) {
    const choices = ACTIONS.filter((a) => a !== prevAction);
    const chosen = choices[Math.floor(Math.random() * choices.length)];
    bossSequence.push(chosen);
    prevAction = chosen;
  }

  const stepTime = 1050; // Generous 1.05s per boss action
  const id = `boss_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  return {
    id,
    action: bossSequence[0],
    isTwoStep: false,
    currentStep: 1,
    timeLimit: stepTime,
    remainingTime: stepTime,
    spawnTimestamp: performance.now(),
    isBoss: true,
    style: 'BOSS',
    bossSteps: bossSequence,
    bossCurrentStepIndex: 0,
    bossTotalSteps: 3,
    distance: 1.0,
    cleared: false,
    failed: false,
  };
}

// Power-Up Generator
const POWER_UP_TYPES: PowerUpType[] = ['SHIELD', 'SLOW_TIME', 'DOUBLE_SCORE', 'EXTRA_LIFE', 'COIN_MAGNET'];

export function generateRandomPowerUp(): PowerUp {
  const type = POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)];
  const lanes: (-1 | 0 | 1)[] = [-1, 0, 1];
  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  const id = `pwr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  return {
    id,
    type,
    lane,
    distance: 1.0,
    collected: false,
    spawnTimestamp: performance.now(),
  };
}

// Game Events Generator (Short 6-8s dynamic events)
export function pickRandomEvent(): ActiveEvent {
  const types: RandomEventType[] = [
    'LIGHTNING_ROUND',
    'COIN_RAIN',
    'SPEED_BURST',
    'PERFECT_STREAK',
    'SPEED_UP',
    'SLOW_MOTION',
    'DOUBLE_SCORE',
    'FAKE_WARNING',
  ];
  const chosen = types[Math.floor(Math.random() * types.length)];

  switch (chosen) {
    case 'LIGHTNING_ROUND':
      return {
        type: 'LIGHTNING_ROUND',
        name: '⚡ LIGHTNING ROUND',
        description: 'Instant reflex blitz! 2X Score!',
        durationMs: 6500,
        remainingMs: 6500,
        color: '#38bdf8',
        bgColor: 'rgba(56, 189, 248, 0.25)',
      };
    case 'COIN_RAIN':
      return {
        type: 'COIN_RAIN',
        name: '🪙 COIN RAIN',
        description: 'Coins showering from above! Catch them!',
        durationMs: 7000,
        remainingMs: 7000,
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.25)',
      };
    case 'SPEED_BURST':
      return {
        type: 'SPEED_BURST',
        name: '🚀 SPEED BURST',
        description: 'Hyper-velocity dash! Double coins!',
        durationMs: 6000,
        remainingMs: 6000,
        color: '#f97316',
        bgColor: 'rgba(249, 115, 22, 0.25)',
      };
    case 'PERFECT_STREAK':
      return {
        type: 'PERFECT_STREAK',
        name: '✨ PERFECT STREAK',
        description: 'All correct clears award Perfects!',
        durationMs: 6500,
        remainingMs: 6500,
        color: '#ec4899',
        bgColor: 'rgba(236, 72, 153, 0.25)',
      };
    case 'SPEED_UP':
      return {
        type: 'SPEED_UP',
        name: 'SPEED UP',
        description: 'Track acceleration!',
        durationMs: 6500,
        remainingMs: 6500,
        color: '#f97316',
        bgColor: 'rgba(249, 115, 22, 0.25)',
      };
    case 'SLOW_MOTION':
      return {
        type: 'SLOW_MOTION',
        name: 'SLOW MOTION',
        description: 'Bullet-time reflexes!',
        durationMs: 7000,
        remainingMs: 7000,
        color: '#06b6d4',
        bgColor: 'rgba(6, 182, 212, 0.25)',
      };
    case 'DOUBLE_SCORE':
      return {
        type: 'DOUBLE_SCORE',
        name: 'DOUBLE SCORE',
        description: 'All points x2 bonus!',
        durationMs: 7500,
        remainingMs: 7500,
        color: '#eab308',
        bgColor: 'rgba(234, 179, 8, 0.25)',
      };
    case 'FAKE_WARNING':
      return {
        type: 'FAKE_WARNING',
        name: 'GLITCH SHIFT',
        description: 'Stay alert for real cue!',
        durationMs: 6000,
        remainingMs: 6000,
        color: '#a855f7',
        bgColor: 'rgba(168, 85, 247, 0.25)',
      };
  }
}
