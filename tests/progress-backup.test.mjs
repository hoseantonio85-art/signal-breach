import test from 'node:test'
import assert from 'node:assert/strict'
import { exportProgressBackup, parseProgressBackup, mergeProgress } from '../src/stores/progressBackup.ts'

const progress = {
  unlockedMission: 8,
  completed: {
    1: { bestScore: 6430, bestTime: 123, bestRank: 'A' },
    2: { bestScore: 8100, bestTime: 87, bestRank: 'S' },
    7: { bestScore: 9900, bestTime: 200, bestRank: 'B' },
  },
}

test('offline backup round-trips unlocked missions, rank, time and scores exactly', () => {
  const code = exportProgressBackup(progress)
  assert.ok(code.startsWith('SIGNAL-BREACH-PROGRESS/1:'))
  assert.deepEqual(parseProgressBackup(code), progress)
})

test('invalid, older and malformed backup codes are rejected', () => {
  assert.equal(parseProgressBackup('garbage'), null)
  assert.equal(parseProgressBackup('SIGNAL-BREACH-PROGRESS/1:{oops'), null)
  assert.equal(parseProgressBackup('SIGNAL-BREACH-PROGRESS/1:' + JSON.stringify({
    format: 'SIGNAL-BREACH-PROGRESS', version: 0, unlockedMission: 8, completed: {},
  })), null)
  assert.equal(parseProgressBackup('x'.repeat(20000)), null)
})

test('unlocked mission cannot contradict completed records', () => {
  const invalid = structuredClone(progress)
  invalid.unlockedMission = 3
  assert.equal(parseProgressBackup(exportProgressBackup(invalid)), null)
})

test('rejects unsafe scores, rank and mission keys', () => {
  const cases = [
    { ...progress, completed: { 7: { bestScore: -1, bestTime: 3, bestRank: 'A' } } },
    { ...progress, completed: { 7: { bestScore: 1500, bestTime: 3, bestRank: '<script>' } } },
    { ...progress, completed: { 11: { bestScore: 1500, bestTime: 3, bestRank: 'A' } } },
  ]
  for (const invalid of cases) assert.equal(parseProgressBackup(exportProgressBackup(invalid)), null)
})

test('import merges instead of destroying newly achieved best scores or later unlocks', () => {
  const current = {
    unlockedMission: 9,
    completed: {
      1: { bestScore: 9000, bestTime: 110, bestRank: 'S' },
      8: { bestScore: 5000, bestTime: 250, bestRank: 'C' },
    },
  }
  const imported = mergeProgress(current, progress)
  assert.equal(imported.unlockedMission, 9)
  assert.deepEqual(imported.completed[1], { bestScore: 9000, bestTime: 110, bestRank: 'S' })
  assert.deepEqual(imported.completed[2], progress.completed[2])
  assert.deepEqual(imported.completed[8], current.completed[8])
})
