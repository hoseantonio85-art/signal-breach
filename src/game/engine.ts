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
  const next: Board = {
    ...board,
    generated: true,
    cells: board.cells.map((cell) => ({ ...cell, mine: false, adjacent: 0, exploded: false })),
  }

  const protectedIndexes = new Set<number>([indexOf(next, safeRow, safeCol)])
  for (const cell of neighbors(next, safeRow, safeCol)) protectedIndexes.add(indexOf(next, cell.row, cell.col))

  let candidates = next.cells.map((_, index) => index).filter((index) => !protectedIndexes.has(index))
  if (candidates.length < next.mineCount) {
    candidates = next.cells.map((_, index) => index).filter((index) => index !== indexOf(next, safeRow, safeCol))
  }

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

export function toggleQuarantine(board: Board, row: number, col: number): Board {
  const key = indexOf(board, row, col)
  const cell = board.cells[key]
  if (!cell || cell.revealed) return board
  const cells = board.cells.map((entry, index) => index === key ? { ...entry, quarantined: !entry.quarantined } : entry)
  return { ...board, cells }
}

export type RevealResult = {
  board: Board
  hitMine: boolean
  revealedDelta: number
}

export function reveal(board: Board, row: number, col: number): RevealResult {
  const key = indexOf(board, row, col)
  const target = board.cells[key]
  if (!target || target.revealed || target.quarantined) return { board, hitMine: false, revealedDelta: 0 }

  const cells = board.cells.map((cell) => ({ ...cell }))
  const next: Board = { ...board, cells }
  const mutableTarget = cells[key]

  if (mutableTarget.mine) {
    mutableTarget.revealed = true
    mutableTarget.exploded = true
    return { board: next, hitMine: true, revealedDelta: 0 }
  }

  let revealedDelta = 0
  const queue = [mutableTarget]
  const visited = new Set<number>()

  while (queue.length) {
    const current = queue.shift()!
    const currentIndex = indexOf(next, current.row, current.col)
    if (visited.has(currentIndex)) continue
    visited.add(currentIndex)

    if (current.mine || current.quarantined || current.revealed) continue
    current.revealed = true
    revealedDelta += 1

    if (current.adjacent === 0) {
      for (const neighbor of neighbors(next, current.row, current.col)) {
        const neighborIndex = indexOf(next, neighbor.row, neighbor.col)
        if (!visited.has(neighborIndex) && !neighbor.mine && !neighbor.quarantined && !neighbor.revealed) {
          queue.push(neighbor)
        }
      }
    }
  }

  return { board: next, hitMine: false, revealedDelta }
}

export function chord(board: Board, row: number, col: number): RevealResult {
  const cell = board.cells[indexOf(board, row, col)]
  if (!cell?.revealed || cell.adjacent === 0) return { board, hitMine: false, revealedDelta: 0 }

  const nearby = neighbors(board, row, col)
  const quarantined = nearby.filter((entry) => entry.quarantined).length
  if (quarantined !== cell.adjacent) return { board, hitMine: false, revealedDelta: 0 }

  let next = board
  let revealedDelta = 0
  for (const entry of nearby) {
    if (entry.quarantined || entry.revealed) continue
    const result = reveal(next, entry.row, entry.col)
    next = result.board
    revealedDelta += result.revealedDelta
    if (result.hitMine) return { board: next, hitMine: true, revealedDelta }
  }
  return { board: next, hitMine: false, revealedDelta }
}

export function revealMines(board: Board, explodedRow: number, explodedCol: number): Board {
  return {
    ...board,
    cells: board.cells.map((cell) => cell.mine
      ? { ...cell, revealed: true, exploded: cell.row === explodedRow && cell.col === explodedCol }
      : cell),
  }
}

export const countQuarantined = (board: Board) => board.cells.filter((cell) => cell.quarantined).length
export const countRevealedSafe = (board: Board) => board.cells.filter((cell) => cell.revealed && !cell.mine).length
export const safeCellCount = (board: Board) => board.rows * board.cols - board.mineCount
export const isWon = (board: Board) => countRevealedSafe(board) === safeCellCount(board)
