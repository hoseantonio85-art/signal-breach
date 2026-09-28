type UiSound = 'start' | 'reveal' | 'cascade' | 'flag' | 'tick' | 'loss' | 'win'

class SignalAudioEngine {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private enabled = false
  private ambientTimer: number | null = null

  isEnabled() {
    return this.enabled
  }

  async setEnabled(enabled: boolean) {
    this.enabled = enabled

    if (!enabled) {
      if (this.ambientTimer != null) window.clearInterval(this.ambientTimer)
      this.ambientTimer = null
      if (this.master && this.context) this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.05)
      if (this.context?.state === 'running') await this.context.suspend()
      return
    }

    if (!this.context) {
      this.context = new AudioContext()
      this.master = this.context.createGain()
      this.master.gain.value = 0.42
      this.master.connect(this.context.destination)
    }

    if (this.context.state === 'suspended') await this.context.resume()
    this.master?.gain.setTargetAtTime(0.42, this.context.currentTime, 0.04)
    this.startAmbient()
    this.ui('tick')
  }

  private tone(freq: number, duration = 0.08, type: OscillatorType = 'sine', volume = 0.05, detune = 0) {
    if (!this.enabled || !this.context || !this.master) return

    const now = this.context.currentTime
    const osc = this.context.createOscillator()
    const gain = this.context.createGain()

    osc.type = type
    osc.frequency.value = freq
    osc.detune.value = detune
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

    osc.connect(gain)
    gain.connect(this.master)
    osc.start(now)
    osc.stop(now + duration + 0.02)
  }

  ui(type: UiSound, intensity = 1) {
    if (!this.enabled) return

    if (type === 'reveal') {
      this.tone(640, 0.055, 'sine', 0.058)
      this.tone(960, 0.045, 'triangle', 0.038, 5)
      return
    }

    if (type === 'cascade') {
      // A soft digital scatter for flood-fill reveals: several tiny notes fan out quickly.
      const notes = [523, 659, 784, 988, 1175, 1319]
      const steps = Math.max(5, Math.min(12, Math.round(4 + intensity * 0.65)))
      for (let index = 0; index < steps; index += 1) {
        const delay = index * 18
        const base = notes[index % notes.length]
        const detune = ((index % 3) - 1) * 5
        window.setTimeout(() => {
          this.tone(base, 0.06 + (index % 2) * 0.012, index % 2 ? 'triangle' : 'sine', Math.max(0.022, 0.047 - index * 0.0016), detune)
        }, delay)
      }
      window.setTimeout(() => this.tone(1568, 0.12, 'sine', 0.03, 3), steps * 18 - 4)
      return
    }

    if (type === 'flag') {
      this.tone(280, 0.075, 'square', 0.055)
      window.setTimeout(() => this.tone(420, 0.085, 'triangle', 0.05), 45)
      return
    }

    if (type === 'tick') {
      this.tone(520, 0.05, 'sine', 0.04)
      return
    }

    if (type === 'start') {
      this.tone(220, 0.11, 'sine', 0.055)
      window.setTimeout(() => this.tone(330, 0.13, 'triangle', 0.045), 80)
      return
    }

    if (type === 'loss') {
      this.tone(170, 0.38, 'sawtooth', 0.085)
      window.setTimeout(() => this.tone(115, 0.52, 'square', 0.052), 120)
      return
    }

    ;[262, 330, 392, 523].forEach((frequency, index) => {
      window.setTimeout(() => this.tone(frequency, 0.25, 'sine', 0.062), index * 90)
    })
  }

  private startAmbient() {
    if (this.ambientTimer != null) window.clearInterval(this.ambientTimer)

    const pulse = () => {
      if (!this.enabled) return
      const roots = [55, 65.41, 73.42]
      const root = roots[Math.floor(Math.random() * roots.length)]
      this.tone(root, 0.72, 'sine', 0.014)
      this.tone(root * 2, 0.9, 'triangle', 0.007, Math.random() * 8 - 4)
    }

    pulse()
    this.ambientTimer = window.setInterval(pulse, 1350)
  }
}

export const audioEngine = new SignalAudioEngine()
