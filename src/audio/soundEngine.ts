/**
 * Procedural Web Audio Engine for "ONE SECOND"
 * Zero external audio assets required. All sounds generated via Web Audio API.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isBgmPlaying: boolean = false;
  private bgmIntervalId: number | null = null;
  private bgmStep: number = 0;

  constructor() {
    // Read mute preference safely
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedMute = localStorage.getItem('one_second_muted');
        if (savedMute !== null) {
          this.isMuted = savedMute === 'true';
        }
      }
    } catch {
      // safe fallback
    }
  }

  private initContext() {
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // AudioContext unavailable or restricted
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('one_second_muted', String(this.isMuted));
      }
    } catch {
      // safe fallback
    }
    if (this.isMuted) {
      this.stopBgm();
    }
    return this.isMuted;
  }

  public unlockAudio() {
    this.initContext();
  }

  // --- HAPTIC FEEDBACK ---
  public triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'double' = 'light') {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        if (type === 'light') navigator.vibrate(25);
        else if (type === 'medium') navigator.vibrate(50);
        else if (type === 'heavy') navigator.vibrate([60, 40, 90]);
        else if (type === 'double') navigator.vibrate([30, 30, 40]);
      } catch {
        // Ignore haptic failures
      }
    }
  }

  // --- SOUND EFFECTS ---

  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  public playCoin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.triggerHaptic('light');

    // Dual-tone high frequency ping: 987.77Hz -> 1318.51Hz
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1318.51, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.13);
  }

  public playPurchase() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.triggerHaptic('double');

    // Cash-in double chime
    const chord = [784, 1046.5, 1318.5];
    chord.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.05 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.05);
      osc.stop(this.ctx.currentTime + idx * 0.05 + 0.22);
    });
  }

  public playClaimReward() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.triggerHaptic('medium');

    const chord = [523.25, 659.25, 783.99, 1046.5];
    chord.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(0.22, this.ctx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.06);
      osc.stop(this.ctx.currentTime + idx * 0.06 + 0.27);
    });
  }

  // --- V4 POWER-UPS & COMBAT AUDIO ---

  public playPowerUp() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.triggerHaptic('medium');

    // Ascending arpeggio shimmer: C5, E5, G5, C6
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.045);

      gain.gain.setValueAtTime(0.22, this.ctx.currentTime + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.045 + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.045);
      osc.stop(this.ctx.currentTime + idx * 0.045 + 0.2);
    });
  }

  public playShieldBlock() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.triggerHaptic('heavy');

    // Forcefield deflect impact: resonant metallic ping + low boom
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.24);
  }

  public playNearMiss() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.triggerHaptic('double');

    // Fast Doppler sonic whip
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.17);
  }

  public playBossAlert() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.triggerHaptic('heavy');

    // 2-tone hazard klaxon
    [0, 0.18].forEach((timeOffset) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime + timeOffset);
      osc.frequency.exponentialRampToValueAtTime(480, this.ctx.currentTime + timeOffset + 0.12);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + timeOffset + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + timeOffset);
      osc.stop(this.ctx.currentTime + timeOffset + 0.15);
    });
  }

  public playBossVictory() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.triggerHaptic('double');

    // Grand triumph major fanfare
    const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.28, this.ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + idx * 0.08 + 0.38);
    });
  }

  public playRankUp() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.triggerHaptic('heavy');

    // Royal ascending arpeggio fanfare (C5, E5, G5, B5, C6)
    const fanfare = [523.25, 659.25, 783.99, 987.77, 1046.5];
    fanfare.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.09);

      gain.gain.setValueAtTime(0.32, this.ctx.currentTime + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.09 + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.09);
      osc.stop(this.ctx.currentTime + idx * 0.09 + 0.48);
    });
  }

  public playLevelUp() {
    this.playRankUp();
  }

  public playRushMode() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.triggerHaptic('double');

    // Adrenaline surge sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(980, this.ctx.currentTime + 0.28);

    gain.gain.setValueAtTime(0.26, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.32);
  }

  public playComboReward() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.triggerHaptic('medium');

    const freqs = [784, 987.77, 1318.51];
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.05 + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.05);
      osc.stop(this.ctx.currentTime + idx * 0.05 + 0.18);
    });
  }

  public playCountdown(count: number | string) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const isGo = count === 'GO!' || count === 0;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isGo ? 'triangle' : 'sine';
    const freq = isGo ? 880 : 440;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(isGo ? 0.28 : 0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isGo ? 0.28 : 0.15));

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + (isGo ? 0.3 : 0.16));
  }

  public playJump() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(740, this.ctx.currentTime + 0.14);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.17);
  }

  public playSlide() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // Filtered noise or fast descending saw for friction
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.17);
  }

  public playDodge(direction: 'LEFT' | 'RIGHT') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const pan = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    osc.type = 'sine';
    const startFreq = direction === 'LEFT' ? 440 : 480;
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.13);

    if (pan) {
      pan.pan.setValueAtTime(direction === 'LEFT' ? -0.6 : 0.6, this.ctx.currentTime);
      osc.connect(gain);
      gain.connect(pan);
      pan.connect(this.ctx.destination);
    } else {
      osc.connect(gain);
      gain.connect(this.ctx.destination);
    }

    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }

  public playSuccess(combo: number, isFever: boolean = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // Pentatonic scale frequencies: C5, D5, E5, G5, A5, C6, D6, E6
    const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
    const noteIndex = Math.min(combo, scale.length - 1);
    const baseFreq = scale[noteIndex];

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

    // Harmonic sparkle
    osc2.type = isFever ? 'triangle' : 'sine';
    osc2.frequency.setValueAtTime(baseFreq * (isFever ? 2 : 1.5), this.ctx.currentTime);

    const vol = isFever ? 0.3 : 0.22;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isFever ? 0.25 : 0.18));

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.26);
    osc2.stop(this.ctx.currentTime + 0.26);
  }

  public playPerfect() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.triggerHaptic('double');

    // Crystal high sparkling triad: E6, G#6, B6
    const freqs = [1318.51, 1661.22, 1975.53];
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.04);

      gain.gain.setValueAtTime(0.24, this.ctx.currentTime + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.04 + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.04);
      osc.stop(this.ctx.currentTime + idx * 0.04 + 0.18);
    });
  }

  public playMilestone() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.triggerHaptic('medium');

    // Celebratory brass-like chord: C5, G5, C6
    const chord = [523.25, 783.99, 1046.50];
    chord.forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 0.36);
    });
  }

  public playEvent() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(960, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.22);
  }

  public playAchievement() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.triggerHaptic('double');

    // Triumphant 4-note ascending fanfare
    const notes = [659.25, 783.99, 987.77, 1318.51];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.06 + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.06);
      osc.stop(this.ctx.currentTime + idx * 0.06 + 0.24);
    });
  }

  public playHit() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.triggerHaptic('heavy');

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.24);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  public playFeverActivate() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.triggerHaptic('double');

    // Energetic ascending fanfare
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.22, this.ctx.currentTime + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.05 + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.05);
      osc.stop(this.ctx.currentTime + idx * 0.05 + 0.2);
    });
  }

  public playGameOver() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const chords = [
      [349.23, 261.63], // F, C
      [311.13, 233.08], // Eb, Bb
      [277.18, 207.65], // C#, G#
      [220.00, 164.81], // A, E
    ];

    chords.forEach((chord, idx) => {
      if (!this.ctx) return;
      chord.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.18);

        gain.gain.setValueAtTime(0.18, this.ctx.currentTime + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.18 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.18);
        osc.stop(this.ctx.currentTime + idx * 0.18 + 0.38);
      });
    });
  }

  // --- PROCEDURAL BACKGROUND ARCADE BEAT ---

  public startBgm(speedMultiplier: number = 1.0, isFever: boolean = false) {
    if (this.isMuted) return;
    this.stopBgm();
    this.initContext();
    if (!this.ctx) return;

    this.isBgmPlaying = true;
    const bpm = isFever ? 144 : 124 * Math.min(speedMultiplier, 1.4);
    const stepDurationMs = (60 / bpm / 2) * 1000; // 8th notes

    this.bgmStep = 0;
    this.bgmIntervalId = window.setInterval(() => {
      if (!this.isBgmPlaying || this.isMuted || !this.ctx) return;

      const step = this.bgmStep % 8;
      const now = this.ctx.currentTime;

      // Kick on step 0 and 4
      if (step === 0 || step === 4) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(38, now + 0.08);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      }

      // Hi-hat on offbeats
      if (step === 2 || step === 6 || (isFever && step % 2 === 1)) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(8000, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      }

      // Synth bass note
      const bassNotes = isFever
        ? [130.81, 146.83, 164.81, 196.00, 164.81, 146.83, 196.00, 220.00]
        : [110, 110, 130.81, 110, 146.83, 110, 130.81, 98];
      const bassFreq = bassNotes[step];

      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(bassFreq, now);
      bassGain.gain.setValueAtTime(isFever ? 0.12 : 0.08, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      bassOsc.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 0.11);

      this.bgmStep++;
    }, stepDurationMs);
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }

  public stopAll() {
    this.stopBgm();
  }
}

export const soundEngine = new SoundEngine();
