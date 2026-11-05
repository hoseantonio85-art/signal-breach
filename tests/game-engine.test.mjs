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

test('campaign inset first-click protects full 3x3 square at corners and edges', () => {
  for (const mission of [
    { rows: 14, cols: 14, mines: 40 },
    { rows: 15, cols: 15, mines: 47 },
    { rows: 16, cols: 16, mines: 54 },
    { rows: 16, cols: 18, mines: 62 },
  ]) {
    const { rows, cols, mines } = mission
    for (const [row, col] of [[0,0],[0,cols-1],[rows-1,0],[rows-1,cols-1],[0,Math.floor(cols/2)],[Math.floor(rows/2),0],[Math.floor(rows/2),Math.floor(cols/2)]]) {
      const board = generateBoard(createBoard(rows, cols, mines), row, col, () => 0.37, 'inset-3x3')
      assert.equal(board.cells.filter(cell => cell.mine).length, mines)
      const r0 = Math.max(0, Math.min(rows - 3, row - 1))
      const c0 = Math.max(0, Math.min(cols - 3, col - 1))
      for (let r = r0; r < r0 + 3; r++) for (let c = c0; c < c0 + 3; c++) {
        assert.equal(board.cells[r * cols + c].mine, false, 'inset window must be safe')
      }
      assert.equal(reveal(board, row, col).hitMine, false)
    }
  }
})

test('classic Free Run still protects only tapped cell plus adjacent cells', () => {
  const board = generateBoard(createBoard(9, 9, 10), 0, 0, () => 0.37)
  const protectedNeighbors = [board.cells[0], ...neighbors(board, 0, 0)]
  assert.equal(protectedNeighbors.length, 4)
  assert.ok(protectedNeighbors.every(cell => !cell.mine))
})

test('Scan marks and Quarantine hypotheses retain individual origins on one board', () => {
  let board = boardWithOneCornerMine()
  board = toggleQuarantine(board, 0, 0, 'scan')
  board = toggleQuarantine(board, 2, 2, 'quarantine')
  assert.equal(countQuarantined(board), 2)
  assert.equal(board.cells[0].markOrigin, 'scan')
  assert.equal(board.cells[8].markOrigin, 'quarantine')
  assert.equal(reveal(board, 2, 2).revealedDelta, 0)
  const old = board
  // The "Scan" toggle does not change an orange marker just by entering Scan.
  assert.equal(old.cells[8].markOrigin, 'quarantine')
  // A deliberate different-mode mark converts the same cell without adding a flag.
  board = toggleQuarantine(board, 2, 2, 'scan')
  assert.equal(board.cells[8].markOrigin, 'scan')
  assert.equal(countQuarantined(board), 2)
  board = toggleQuarantine(board, 0, 0, 'quarantine')
  assert.equal(board.cells[0].markOrigin, 'quarantine')
  board = toggleQuarantine(board, 0, 0, 'quarantine')
  assert.equal(board.cells[0].quarantined, false)
  assert.equal(board.cells[0].markOrigin, undefined)
  assert.equal(countQuarantined(board), 1)
})

test('legacy flags without mark origin are pink Scan marks, with reversible toggle', () => {
  let board = toggleQuarantine(boardWithOneCornerMine(), 0, 0)
  const legacyCells = board.cells.map(cell => {
    const oldCell = { ...cell }
    delete oldCell.markOrigin
    return oldCell
  })
  board = { ...board, cells: legacyCells }
  // The absence of markOrigin means an old committed Scan mark.
  board = toggleQuarantine(board, 0, 0, 'scan')
  assert.equal(board.cells[0].quarantined, false)
  board = toggleQuarantine(board, 0, 0, 'quarantine')
  assert.equal(board.cells[0].markOrigin, 'quarantine')
})
