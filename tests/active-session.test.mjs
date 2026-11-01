import test from 'node:test'
import assert from 'node:assert/strict'
import { createBoard, generateBoard, reveal, toggleQuarantine } from '../src/game/engine.ts'
import {
  ACTIVE_SESSION_KEY, makeActiveSession, validateActiveSession,
  readActiveSession, writeActiveSession, clearActiveSession, sessionFromSave,
} from '../src/stores/activeSession.ts'

function fakeStorage() {
  const data = new Map()
  return {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
  }
}

const campaignMission = {
  id: 7, code: 'CHOIR SIGNATURE', rows: 14, cols: 14, mines: 45,
  parSeconds: 230, location: { ru: '', en: '' },
  briefing: { ru: '', en: '' }, debrief: { ru: '', en: '' },
}
const gameSession = { kind: 'campaign', label: 'OP 07', rows: 14, cols: 14, mines: 45, mission: campaignMission }

test('a partially played board roundtrips exactly, including real mines and flags', () => {
  let board = generateBoard(createBoard(14, 14, 45), 5, 5, () => 0.34)
  board = reveal(board, 5, 5).board
  const index = board.cells.findIndex(c => !c.revealed)
  board = toggleQuarantine(board, Math.floor(index / 14), index % 14)
  const saved = makeActiveSession(gameSession, board, 'running', 'quarantine', 42_390)
  const storage = fakeStorage()
  assert.equal(writeActiveSession(saved, storage), true)
  const restored = readActiveSession(storage)
  assert.deepEqual(restored, saved)
  assert.equal(restored.board.cells.filter(c => c.mine).length, 45)
  assert.deepEqual(sessionFromSave(restored, [campaignMission]), gameSession)
})

test('unstarted field with flags can be preserved without generating mines', () => {
  const board = toggleQuarantine(createBoard(14, 14, 45), 1, 1)
  const saved = makeActiveSession(gameSession, board, 'idle', 'quarantine', 0)
  assert.ok(validateActiveSession(saved))
  assert.equal(readActiveSession(Object.assign(fakeStorage(), {
    getItem: () => JSON.stringify(saved),
  })).phase, 'idle')
})

test('invalid or completed boards never load', () => {
  let board = generateBoard(createBoard(14, 14, 45), 5, 5, () => 0.34)
  board = reveal(board, 5, 5).board
  const saved = makeActiveSession(gameSession, board, 'running', 'scan', 1000)
  const corrupt = structuredClone(saved)
  corrupt.board.cells[0].adjacent = 99
  assert.equal(validateActiveSession(corrupt), null)
  const exploded = structuredClone(saved)
  exploded.board.cells.find(c => c.mine).revealed = true
  assert.equal(validateActiveSession(exploded), null)
  const invalidPhase = structuredClone(saved)
  invalidPhase.phase = 'won'
  assert.equal(validateActiveSession(invalidPhase), null)
  const invalidData = fakeStorage()
  invalidData.setItem(ACTIVE_SESSION_KEY, '{ invalid json')
  assert.equal(readActiveSession(invalidData), null)
  clearActiveSession(invalidData)
  assert.equal(invalidData.getItem(ACTIVE_SESSION_KEY), null)
})

test('storage failures must not crash the menu or the game', () => {
  const storage = {
    getItem: () => { throw Error('storage unavailable') },
    setItem: () => { throw Error('quota exceeded') },
    removeItem: () => { throw Error('storage unavailable') },
  }
  assert.equal(readActiveSession(storage), null)
  const saved = makeActiveSession(gameSession, createBoard(14, 14, 45), 'idle', 'scan', 0)
  assert.equal(writeActiveSession(saved, storage), false)
  assert.doesNotThrow(() => clearActiveSession(storage))
})

test('restoration refuses incorrect mission or unknown Free Run presets', () => {
  const saved = makeActiveSession(gameSession, createBoard(14, 14, 45), 'idle', 'scan', 0)
  assert.equal(sessionFromSave(saved, []), null)
  const different = { ...campaignMission, rows: 15 }
  assert.equal(sessionFromSave(saved, [different]), null)
  const free = { kind: 'free', label: 'BLACK ICE', rows: 16, cols: 30, mines: 99 }
  const freeSave = makeActiveSession(free, createBoard(16, 30, 99), 'idle', 'scan', 0)
  assert.deepEqual(sessionFromSave(freeSave, []), free)
  freeSave.session.mines = 1
  assert.equal(sessionFromSave(freeSave, []), null)
})
