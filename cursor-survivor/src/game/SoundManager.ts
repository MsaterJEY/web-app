// Web Audio API Sound Manager — procedural sounds, no files needed

class SoundManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private enabled = true
  private initialized = false

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.4
      this.masterGain.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') this.ctx.resume()
    return this.ctx
  }

  private get gain(): GainNode {
    this.getCtx()
    return this.masterGain!
  }

  setEnabled(v: boolean) { this.enabled = v }
  isEnabled() { return this.enabled }

  private playTone(
    freq: number, type: OscillatorType, duration: number,
    gainVal: number = 0.3, freqEnd?: number,
    filterFreq?: number
  ) {
    if (!this.enabled) return
    try {
      const ctx = this.getCtx()
      const osc = ctx.createOscillator()
      const g = ctx.createGain()

      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      if (freqEnd !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration)
      }

      g.gain.setValueAtTime(gainVal, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

      if (filterFreq) {
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = filterFreq
        osc.connect(filter)
        filter.connect(g)
      } else {
        osc.connect(g)
      }

      g.connect(this.gain)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration)
    } catch (_) {}
  }

  private playNoise(duration: number, gainVal: number = 0.15, filterFreq: number = 2000) {
    if (!this.enabled) return
    try {
      const ctx = this.getCtx()
      const bufferSize = ctx.sampleRate * duration
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1)

      const source = ctx.createBufferSource()
      source.buffer = buffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = filterFreq
      filter.Q.value = 1.5

      const g = ctx.createGain()
      g.gain.setValueAtTime(gainVal, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

      source.connect(filter)
      filter.connect(g)
      g.connect(this.gain)
      source.start()
    } catch (_) {}
  }

  // ─── UI Sounds ───

  hover() {
    this.playTone(880, 'sine', 0.06, 0.08)
  }

  click() {
    this.playTone(660, 'square', 0.08, 0.12, 440)
  }

  startGame() {
    // Rising fanfare
    const freqs = [220, 330, 440, 660]
    freqs.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'square', 0.15, 0.18, f * 1.5), i * 80)
    })
  }

  levelUp() {
    // Triumphant ascending
    const notes = [523, 659, 784, 1047]
    notes.forEach((f, i) => {
      setTimeout(() => {
        this.playTone(f, 'square', 0.2, 0.25, f * 1.1)
        this.playTone(f * 1.5, 'sine', 0.15, 0.1)
      }, i * 100)
    })
  }

  skillSelect() {
    this.playTone(880, 'sine', 0.12, 0.2, 1100)
    setTimeout(() => this.playTone(1320, 'sine', 0.1, 0.15), 80)
  }

  pauseGame() {
    this.playTone(440, 'square', 0.1, 0.15, 220)
  }

  gameOver() {
    const notes = [440, 330, 220, 165]
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sawtooth', 0.3, 0.2, f * 0.5), i * 150)
    })
  }

  stageClear() {
    const notes = [523, 659, 784, 1047, 1319]
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'square', 0.18, 0.22), i * 90)
    })
  }

  // ─── Weapon Sounds ───

  swordSwing() {
    // Whoosh + metallic
    this.playNoise(0.12, 0.2, 1200)
    this.playTone(280, 'sawtooth', 0.08, 0.12, 180)
  }

  swordHit() {
    // Metal clash
    this.playNoise(0.08, 0.25, 3000)
    this.playTone(350, 'square', 0.06, 0.2, 200)
  }

  spearThrust() {
    // Sharp piercing
    this.playNoise(0.07, 0.18, 2500)
    this.playTone(500, 'sawtooth', 0.07, 0.15, 300)
  }

  spearHit() {
    this.playNoise(0.1, 0.22, 1800)
    this.playTone(250, 'square', 0.08, 0.18, 150)
  }

  wandShoot() {
    // Magical zap
    this.playTone(1200, 'sine', 0.12, 0.18, 400)
    this.playTone(800, 'triangle', 0.08, 0.1, 1600)
  }

  wandHit() {
    // Magic impact
    this.playTone(600, 'sine', 0.1, 0.2, 200)
    this.playNoise(0.08, 0.12, 800)
  }

  // ─── Game Events ───

  xpPickup() {
    this.playTone(1046, 'sine', 0.08, 0.12, 1319)
  }

  enemyHit() {
    this.playNoise(0.05, 0.15, 1500)
    this.playTone(200, 'square', 0.04, 0.1, 150)
  }

  enemyDie() {
    this.playNoise(0.12, 0.2, 800)
    this.playTone(300, 'sawtooth', 0.1, 0.15, 100)
  }

  bossDie() {
    this.playNoise(0.3, 0.3, 600)
    const notes = [400, 300, 200, 100]
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sawtooth', 0.2, 0.25, f * 0.6), i * 80)
    })
  }

  bossHit() {
    this.playNoise(0.08, 0.2, 1000)
    this.playTone(180, 'square', 0.06, 0.18, 120)
  }
}

export const soundManager = new SoundManager()
