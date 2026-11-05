import test from 'node:test'
import assert from 'node:assert/strict'
import { formatResultShareText, shareResultText } from '../src/utils/shareResult.ts'

function adapters(overrides = {}) {
  const calls = []
  return {
    calls,
    value: {
      isNative: () => false,
      nativeShare: async (...args) => { calls.push(['native', ...args]) },
      webShare: async (...args) => { calls.push(['web', ...args]); return true },
      copy: async (...args) => { calls.push(['copy', ...args]) },
      ...overrides,
    },
  }
}

test('result message keeps operation, rank, score and exact time', () => {
  assert.equal(formatResultShareText('OP 07 // CHOIR SIGNATURE', 'A', 12450, '03:12'),
    'SIGNAL//BREACH — OP 07 // CHOIR SIGNATURE — A / 12450 / 03:12')
})

test('native Android uses the official share chooser, never WebView navigator.share', async () => {
  const a = adapters({ isNative: () => true })
  assert.equal(await shareResultText('result', 'Share result', a.value), 'shared')
  assert.deepEqual(a.calls, [['native', 'result', 'Share result']])
})

test('browser keeps Web Share functionality', async () => {
  const a = adapters()
  assert.equal(await shareResultText('result', 'Share result', a.value), 'shared')
  assert.deepEqual(a.calls, [['web', 'result']])
})

test('web share unavailable falls back to clipboard with visible copy outcome', async () => {
  const a = adapters({ webShare: async () => false })
  assert.equal(await shareResultText('result', 'Share result', a.value), 'copied')
  assert.deepEqual(a.calls, [['copy', 'result']])
})

test('native sharing error falls back to copy, not silent failure', async () => {
  const a = adapters({
    isNative: () => true,
    nativeShare: async () => { throw new Error('Plugin unavailable') },
  })
  assert.equal(await shareResultText('result', 'Share result', a.value), 'copied')
  assert.deepEqual(a.calls, [['copy', 'result']])
})

test('cancelled sharing does not copy or falsely report an error', async () => {
  const a = adapters({
    isNative: () => true,
    nativeShare: async () => { throw Object.assign(new Error('Share canceled'), { name: 'AbortError' }) },
  })
  assert.equal(await shareResultText('result', 'Share result', a.value), 'cancelled')
  assert.deepEqual(a.calls, [])
})

test('both unavailable surfaces a visible failed outcome', async () => {
  const a = adapters({
    webShare: async () => { throw new Error('Web Share denied') },
    copy: async () => { throw new Error('Clipboard denied') },
  })
  assert.equal(await shareResultText('result', 'Share result', a.value), 'failed')
})
