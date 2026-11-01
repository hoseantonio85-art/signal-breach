import test from 'node:test'
import assert from 'node:assert/strict'
import { audioEngine } from '../src/audio/audioEngine.ts'

test('louder sound remains consistent after mute and re-enable', async () => {
  const previousWindow = globalThis.window
  const previousContext = globalThis.AudioContext
  const levels = []
  globalThis.window = { setTimeout: () => 1, setInterval: () => 2, clearInterval() {} }
  globalThis.AudioContext = class {
    currentTime = 0
    state = 'running'
    destination = {}
    createGain() {
      return {
        gain: {
          value: 0,
          setTargetAtTime(level) { levels.push(level) },
          setValueAtTime() {},
          exponentialRampToValueAtTime() {},
        },
        connect() {},
      }
    }
    createOscillator() {
      return { frequency: {}, detune: {}, connect() {}, start() {}, stop() {} }
    }
    async suspend() { this.state = 'suspended' }
    async resume() { this.state = 'running' }
  }
  try {
    await audioEngine.setEnabled(true)
    assert.equal(levels.at(-1), 0.62)
    await audioEngine.setEnabled(false)
    assert.equal(levels.at(-1), 0)
    await audioEngine.setEnabled(true)
    assert.equal(levels.at(-1), 0.62)
    await audioEngine.setEnabled(false)
  } finally {
    globalThis.window = previousWindow
    globalThis.AudioContext = previousContext
  }
})
