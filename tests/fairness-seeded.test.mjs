import test from 'node:test'
import assert from 'node:assert/strict'
import { createBoard, generateBoard, reveal, neighbors } from '../src/game/engine.ts'
import { missions } from '../src/campaign/missions.ts'

function seeded(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
test('seeded generator is reproducible, with accurate mines and safe first click for OP 06-10', () => {
  for (const m of missions.filter(x => x.id >= 6)) {
    for (const [r, c] of [[0, 0], [Math.floor(m.rows / 2), Math.floor(m.cols / 2)]]) {
      const a = generateBoard(createBoard(m.rows, m.cols, m.mines), r, c, seeded(123456))
      const b = generateBoard(createBoard(m.rows, m.cols, m.mines), r, c, seeded(123456))
      assert.deepEqual(a.cells.map(cell => cell.mine), b.cells.map(cell => cell.mine))
      assert.equal(a.cells.filter(cell => cell.mine).length, m.mines)
      assert.ok(!a.cells[r * m.cols + c].mine)
      assert.ok(neighbors(a, r, c).every(cell => !cell.mine))
      assert.ok(!reveal(a, r, c).hitMine)
    }
  }
})
