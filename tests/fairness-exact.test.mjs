import test from 'node:test'
import assert from 'node:assert/strict'
import { createBoard } from '../src/game/engine.ts'
import { analyzeExactFrontier } from '../scripts/qa/constraint-frontier.mjs'

function board(rows, cols, mineIndices, shownIndices) {
  const b = createBoard(rows, cols, mineIndices.length)
  b.generated = true
  for (const id of mineIndices) b.cells[id].mine = true
  for (const cell of b.cells) {
    const neighbors = []
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue
      const r = cell.row + dr, c = cell.col + dc
      if (r >= 0 && r < rows && c >= 0 && c < cols) neighbors.push(b.cells[r * cols + c])
    }
    if (!cell.mine) cell.adjacent = neighbors.filter(x => x.mine).length
  }
  for (const id of shownIndices) b.cells[id].revealed = true
  return b
}
test('fully ambiguous two-cell board: no certain move, proven guess required', () => {
  const b = board(1, 2, [0], [])
  const result = analyzeExactFrontier(b)
  assert.equal(result.status, 'guess-required')
  assert.equal(result.safe.size, 0)
  assert.equal(result.mines.size, 0)
})
test('exact clue 1-of-1 plus global total proves distant safe cell', () => {
  const b = board(1, 3, [1], [0])
  const result = analyzeExactFrontier(b)
  assert.equal(result.status, 'forced')
  assert.deepEqual([...result.mines], [1])
  assert.deepEqual([...result.safe], [2])
})
test('single 1-of-3 clue provides no zero-risk move', () => {
  const b = board(2, 2, [3], [0])
  const result = analyzeExactFrontier(b)
  assert.equal(result.status, 'guess-required')
  assert.equal(result.hidden, 3)
})
test('incomplete enumeration must never be classified as guaranteed guessing', () => {
  const b = board(2, 2, [3], [0])
  const result = analyzeExactFrontier(b, { maxVariables: 1 })
  assert.equal(result.status, 'inconclusive')
})
test('global mine total can force outside cells safe with no local clues', () => {
  const b = board(1, 4, [1], [0])
  const result = analyzeExactFrontier(b)
  assert.equal(result.status, 'forced')
  assert.deepEqual([...result.safe].sort(), [2, 3])
})
