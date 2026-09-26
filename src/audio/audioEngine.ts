class SignalAudioEngine {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private drone: OscillatorNode | null = null
  private enabled = false

  isEnabled() {
    return this.enabled
  }

  async setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (!enabled) {
      if (this.master) this.master.gain.setTargetAtTime(0, this.context?.currentTime ?? 0, 0.08)
      return
    }

    if (!this.context) {
      this.context = new AudioContext()
      this.master = this.context.createGain()
      this.master.gain.value = 0.055
      this.master.connect(this.context.destination)

      const droneGain = this.context.createGain()
      droneGain.gain.value = 0.08
      droneGain.connect(this.master)
      this.drone = this.context.createOscillator()
      this.drone.type = 'sine'
      this.drone.frequency.value = 55
      this.drone.connect(droneGain)
      this.drone.start()
    }

    await this.context.resume()
    this.master?.gain.setTargetAtTime(0.055, this.context.currentTime, 0.08)
    this.ui('start')
  }

  ui(type: 'start' | 'reveal' | 'flag' | 'tick' | 'loss' | 'win') {
    if (!this.enabled || !this.context || !this.master) return
    const now = this.context.currentTime
    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    const frequencies = { start: 220, reveal: 390, flag: 185, tick: 120, loss: 82, win: 520 }
    const durations = { start: .12, reveal: .045, flag: .08, tick: .05, loss: .34, win: .28 }
    osc.type = type === 'loss' ? 'sawtooth' : 'triangle'
    osc.frequency.setValueAtTime(frequencies[type], now)
    if (type === 'win') osc.frequency.exponentialRampToValueAtTime(780, now + durations[type])
    if (type === 'loss') osc.frequency.exponentialRampToValueAtTime(48, now + durations[type])
    gain.gain.setValueAtTime(type === 'loss' ? .12 : .07, now)
    gain.gain.exponentialRampToValueAtTime(.0001, now + durations[type])
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(now)
    osc.stop(now + durations[type] + .02)
  }
}

export const audioEngine = new SignalAudioEngine()
