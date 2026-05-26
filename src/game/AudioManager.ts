// Audio Manager - Web Audio API based sound system
// Generates realistic sound effects procedurally

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted = false;
  private musicPlaying = false;
  private musicOscillators: OscillatorNode[] = [];
  private footstepInterval: ReturnType<typeof setInterval> | null = null;

  async init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1.0;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.25;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.5;
    this.sfxGain.connect(this.masterGain);
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3, startDelay = 0) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime + startDelay);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + startDelay + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(this.ctx.currentTime + startDelay);
    osc.stop(this.ctx.currentTime + startDelay + duration);
  }

  private playNoise(duration: number, volume = 0.1, startDelay = 0) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime + startDelay);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + startDelay + duration);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    source.start(this.ctx.currentTime + startDelay);
    source.stop(this.ctx.currentTime + startDelay + duration);
  }

  playJump() {
    // Rising whoosh sound
    this.playTone(200, 0.15, 'sine', 0.25);
    this.playTone(400, 0.15, 'sine', 0.2, 0.05);
    this.playTone(600, 0.12, 'sine', 0.15, 0.08);
    this.playNoise(0.15, 0.08);
  }

  playSlide() {
    // Swoosh down
    this.playTone(600, 0.2, 'sawtooth', 0.1);
    this.playTone(300, 0.25, 'sawtooth', 0.08, 0.05);
    this.playNoise(0.3, 0.12);
  }

  playLand() {
    // Thud
    this.playTone(80, 0.15, 'sine', 0.3);
    this.playTone(60, 0.2, 'sine', 0.25, 0.02);
    this.playNoise(0.1, 0.1);
  }

  playCoinCollect() {
    // Bright ding
    this.playTone(880, 0.1, 'sine', 0.2);
    this.playTone(1320, 0.15, 'sine', 0.18, 0.05);
    this.playTone(1760, 0.12, 'sine', 0.12, 0.1);
  }

  playLaneSwitch() {
    // Quick swoosh
    this.playTone(300, 0.08, 'triangle', 0.12);
    this.playTone(450, 0.08, 'triangle', 0.1, 0.03);
  }

  playCrash() {
    // Impact + glass
    this.playTone(100, 0.4, 'sawtooth', 0.35);
    this.playTone(80, 0.5, 'square', 0.2, 0.05);
    this.playTone(50, 0.6, 'sawtooth', 0.15, 0.1);
    this.playNoise(0.4, 0.25);
    // Glass shatter
    this.playNoise(0.3, 0.15, 0.15);
    this.playTone(2000, 0.1, 'square', 0.08, 0.1);
    this.playTone(1500, 0.1, 'square', 0.06, 0.15);
  }

  playFootstep() {
    // Quick tap
    this.playTone(120, 0.05, 'sine', 0.08);
    this.playNoise(0.04, 0.04);
  }

  startFootsteps(speed: number) {
    this.stopFootsteps();
    const interval = Math.max(150, 400 - speed * 5);
    this.footstepInterval = setInterval(() => {
      this.playFootstep();
    }, interval);
  }

  stopFootsteps() {
    if (this.footstepInterval) {
      clearInterval(this.footstepInterval);
      this.footstepInterval = null;
    }
  }

  startMusic() {
    if (this.musicPlaying || !this.ctx || !this.musicGain || this.isMuted) return;
    this.musicPlaying = true;

    // Simple procedural background music loop
    const notes = [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63];
    const bassNotes = [65.41, 73.42, 82.41, 87.31];
    
    const playBeat = () => {
      if (!this.ctx || !this.musicGain || !this.musicPlaying) return;
      
      const now = this.ctx.currentTime;
      
      // Bass line
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.value = bassNotes[Math.floor(Math.random() * bassNotes.length)];
      bassGain.gain.setValueAtTime(0.08, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      bassOsc.connect(bassGain);
      bassGain.connect(this.musicGain);
      bassOsc.start(now);
      bassOsc.stop(now + 0.5);

      // Melody note
      const melOsc = this.ctx.createOscillator();
      const melGain = this.ctx.createGain();
      melOsc.type = 'sine';
      melOsc.frequency.value = notes[Math.floor(Math.random() * notes.length)];
      melGain.gain.setValueAtTime(0.04, now + 0.1);
      melGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      melOsc.connect(melGain);
      melGain.connect(this.musicGain);
      melOsc.start(now + 0.1);
      melOsc.stop(now + 0.4);
    };

    const beatInterval = setInterval(() => {
      if (!this.musicPlaying) {
        clearInterval(beatInterval);
        return;
      }
      playBeat();
    }, 500);
  }

  stopMusic() {
    this.musicPlaying = false;
    this.musicOscillators.forEach(osc => {
      try { osc.stop(); } catch (e) { /* already stopped */ }
    });
    this.musicOscillators = [];
  }

  playPowerUp() {
    this.playTone(523, 0.1, 'sine', 0.2);
    this.playTone(659, 0.1, 'sine', 0.18, 0.1);
    this.playTone(784, 0.1, 'sine', 0.16, 0.2);
    this.playTone(1047, 0.2, 'sine', 0.2, 0.3);
  }

  playGameOver() {
    // Sad descending
    this.playTone(440, 0.3, 'sine', 0.2);
    this.playTone(370, 0.3, 'sine', 0.18, 0.3);
    this.playTone(311, 0.3, 'sine', 0.16, 0.6);
    this.playTone(261, 0.6, 'sine', 0.2, 0.9);
    this.playNoise(0.5, 0.1, 1.2);
  }

  playScore() {
    this.playTone(660, 0.1, 'sine', 0.15);
    this.playTone(880, 0.15, 'sine', 0.12, 0.05);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 1;
    }
    if (this.isMuted) {
      this.stopFootsteps();
      this.stopMusic();
    }
    return this.isMuted;
  }

  get muted() {
    return this.isMuted;
  }

  destroy() {
    this.stopMusic();
    this.stopFootsteps();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
