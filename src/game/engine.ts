import type { Board, Cell } from './types'

const indexOf = (board: Board, row: number, col: number) => row * board.cols + col

export function createBoard(rows: number, cols: number, mineCount: number): Board {
  const cells: Cell[] = Array.from({ length: rows * cols }, (_, index) => ({
    row: Math.floor(index / cols),
    col: index % cols,
    mine: false,
    revealed: false,
    quarantined: false,
    adjacent: 0,
  }))
  return { rows, cols, mineCount, cells, generated: false }
}

export function neighbors(board: Board, row: number, col: number): Cell[] {
  const result: Cell[] = []
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue
      const nextRow = row + dr
      const nextCol = col + dc
      if (nextRow < 0 || nextCol < 0 || nextRow >= board.rows || nextCol >= board.cols) continue
      result.push(board.cells[indexOf(board, nextRow, nextCol)])
    }
  }
  return result
}

export function generateBoard(board: Board, safeRow: number, safeCol: number, random: () => number = Math.random): Board {
  const next: Board = { ...board, cells: board.cells.map((cell) => ({ ...cell })), generated: true }
  const protectedIndexes = new Set<number>([indexOf(next, safeRow, safeCol)])
  for (const cell of neighbors(next, safeRow, safeCol)) protectedIndexes.add(indexOf(next, cell.row, cell.col))

  let candidates = next.cells.map((_, index) => index).filter((index) => !protectedIndexes.has(index))
  if (candidates.length < next.mineCount) candidates = next.cells.map((_, index) => index).filter((index) => index !== indexOf(next, safeRow, safeCol))

  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }

  for (const mineIndex of candidates.slice(0, next.mineCount)) next.cells[mineIndex].mine = true
  for (const cell of next.cells) {
    if (!cell.mine) cell.adjacent = neighbors(next, cell.row, cell.col).filter((neighbor) => neighbor.mine).length
  }
  return next
}
