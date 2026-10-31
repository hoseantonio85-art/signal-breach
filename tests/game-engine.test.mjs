import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createBoard, generateBoard, reveal, neighbors,
  toggleQuarantine, chord, isWon, countQuarantined,
  findExplodedCell, revealMines
} from '../src/game/engine.ts'

const boardWithOneCornerMine = () => {
  const board = createBoard(3, 3, 1)
  board.generated = true
  board.cells[0].mine = true
  for (const cell of board.cells) {
    if (!cell.mine) cell.adjacent = neighbors(board, cell.row, cell.col).filter(x => x.mine).length
  }
  return board
}

test('board generation protects the first tapped cell and neighbors', () => {
  const board = generateBoard(createBoard(9, 9, 10), 4, 4, () => 0.34)
  assert.equal(board.generated, true)
  assert.equal(board.cells.filter(c => c.mine).length, 10)
  for (const cell of [board.cells[4 * board.cols + 4], ...neighbors(board, 4, 4)]) {
    assert.equal(cell.mine, false, `first tap protection failed at ${cell.row},${cell.col}`)
  }
})

test('flood reveal completes an empty board', () => {
  const board = { ...createBoard(3, 3, 0), generated: true }
  const result = reveal(board, 1, 1)
  assert.equal(result.hitMine, false)
  assert.equal(result.revealedDelta, 9)
  assert.equal(isWon(result.board), true)
})

test('quarantine is reversible and blocks direct reveal', () => {
  const board = boardWithOneCornerMine()
  const flagged = toggleQuarantine(board, 2, 2)
  assert.equal(countQuarantined(flagged), 1)
  assert.strictEqual(reveal(flagged, 2, 2).board, flagged)
  const restored = toggleQuarantine(flagged, 2, 2)
  assert.equal(countQuarantined(restored), 0)
  assert.equal(reveal(restored, 2, 2).revealedDelta > 0, true)
})

test('chord with the wrong flag records the ACTUAL exploded mine', () => {
  let board = reveal(boardWithOneCornerMine(), 1, 1).board
  board = toggleQuarantine(board, 0, 1) // wrong neighboring flag
  const result = chord(board, 1, 1) // tapped cell is safe
  assert.equal(result.hitMine, true)
  const actual = findExplodedCell(result.board)
  assert.ok(actual)
  assert.deepEqual([actual.row, actual.col], [0, 0])
  assert.deepEqual([actual.row, actual.col], [0, 0])
  const postLoss = revealMines(result.board, actual.row, actual.col)
  assert.equal(postLoss.cells.filter(c => c.exploded).length, 1)
  assert.equal(postLoss.cells[0].exploded, true)
  assert.notEqual(postLoss.cells[4].exploded, true)
})

test('chord with the correct flag opens neighbors and can win', () => {
  let board = reveal(boardWithOneCornerMine(), 1, 1).board
  board = toggleQuarantine(board, 0, 0)
  const result = chord(board, 1, 1)
  assert.equal(result.hitMine, false)
  assert.equal(isWon(result.board), true)
})

test('chord does nothing when the quarantine count is incorrect', () => {
  const board = reveal(boardWithOneCornerMine(), 1, 1).board
  const result = chord(board, 1, 1)
  assert.strictEqual(result.board, board)
  assert.equal(result.revealedDelta, 0)
})
