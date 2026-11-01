/**
 * Offline, read-only QA for the existing Minesweeper generator.
 *
 * Uses production createBoard/generateBoard/reveal/toggleQuarantine.
 * Simulates visible-information deductions: clue rules, subset equations and
 * the global remaining-mine count. Never consults hidden mine positions to
 * choose a move. Hidden positions are checked only for test assertions.
 *
 * A stalled board is NOT proof guessing is mathematically required: more
 * powerful CSP reasoning may find further safe moves.
 *
 * Usage:
 * node --experimental-strip-types scripts/analyze-board-solvability.mjs --samples=100
 * node --experimental-strip-types scripts/analyze-board-solvability.mjs --samples=200 --json=report.json
 */
import { writeFileSync } from 'node:fs'
import { createBoard, generateBoard, isWon, neighbors, reveal, toggleQuarantine } from '../src/game/engine.ts'
import { missions } from '../src/campaign/missions.ts'

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function cellId(board, cell) { return cell.row * board.cols + cell.col }
function isSubset(smaller, larger) { return smaller.every(id => larger.includes(id)) }

function deduce(board) {
  const safe = new Set()
  const mines = new Set()
  const equations = []
  const hidden = []
  let quarantined = 0
  for (let id = 0; id < board.cells.length; id++) {
    const cell = board.cells[id]
    if (cell.quarantined) quarantined++
    else if (!cell.revealed) hidden.push(id)
  }
  const missing = board.mineCount - quarantined
  if (missing < 0 || missing > hidden.length) throw new Error('Invalid mine count deduction')
  if (missing === 0) for (const id of hidden) safe.add(id)
  if (missing === hidden.length) for (const id of hidden) mines.add(id)

  for (const cell of board.cells) {
    if (!cell.revealed || cell.mine) continue
    const around = neighbors(board, cell.row, cell.col)
    const unknown = around.filter(c => !c.revealed && !c.quarantined).map(c => cellId(board, c)).sort((a, b) => a - b)
    const flags = around.filter(c => c.quarantined).length
    const count = cell.adjacent - flags
    if (count < 0 || count > unknown.length) throw new Error('Contradictory visible clue')
    if (!unknown.length) continue
    equations.push({ ids: unknown, count })
    if (count === 0) for (const id of unknown) safe.add(id)
    else if (count === unknown.length) for (const id of unknown) mines.add(id)
  }

  // If every variable in equation A is also in B, B-A contains
  // exactly count(B)-count(A) mines. Handles a common Minesweeper
  // pattern more powerful than the two trivial local rules.
  let subsetDeductions = 0
  for (let i = 0; i < equations.length; i++) {
    for (let j = 0; j < equations.length; j++) {
      if (i === j) continue
      const small = equations[i]
      const large = equations[j]
      if (small.ids.length >= large.ids.length || !isSubset(small.ids, large.ids)) continue
      const rest = large.ids.filter(id => !small.ids.includes(id))
      const minesInRest = large.count - small.count
      if (minesInRest === 0) {
        for (const id of rest) {
          if (!safe.has(id)) subsetDeductions++
          safe.add(id)
        }
      } else if (minesInRest === rest.length) {
        for (const id of rest) {
          if (!mines.has(id)) subsetDeductions++
          mines.add(id)
        }
      }
    }
  }
  for (const id of safe) if (mines.has(id)) throw new Error('Conflicting deductions')
  // This is a heuristic clue pattern, NOT a proof of an unavoidable 50/50.
  const pairClues = equations.filter(eq => eq.ids.length === 2 && eq.count === 1).length
  return { safe, mines, subsetDeductions, pairClues }
}

function simulate(mission, seed, origin) {
  const startRow = origin === 'corner' ? 0 : Math.floor(mission.rows / 2)
  const startCol = origin === 'corner' ? 0 : Math.floor(mission.cols / 2)
  let board = generateBoard(createBoard(mission.rows, mission.cols, mission.mines), startRow, startCol, rng(seed))
  if (board.cells.filter(c => c.mine).length !== mission.mines) throw new Error('Wrong generated mine count')
  const protectedCells = [board.cells[startRow * mission.cols + startCol], ...neighbors(board, startRow, startCol)]
  if (protectedCells.some(c => c.mine)) throw new Error('First click protection failed')
  const first = reveal(board, startRow, startCol)
  if (first.hitMine) throw new Error('First click hit a mine')
  board = first.board
  let passes = 0
  let subset = 0
  for (; passes < mission.rows * mission.cols * 2; passes++) {
    if (isWon(board)) break
    const result = deduce(board)
    subset += result.subsetDeductions
    if (!result.safe.size && !result.mines.size) {
      const revealed = board.cells.filter(c => c.revealed && !c.mine).length
      return { seed, origin, outcome: 'stalled', revealed, safeTotal: board.rows * board.cols - board.mineCount, passes, pairClues: result.pairClues, subset }
    }
    for (const id of result.mines) {
      const cell = board.cells[id]
      if (cell.mine !== true) throw new Error('Unsafe mine deduction at seed ' + seed + ' id ' + id)
      board = toggleQuarantine(board, cell.row, cell.col)
    }
    for (const id of result.safe) {
      const cell = board.cells[id]
      if (cell.mine) throw new Error('Unsafe reveal deduction at seed ' + seed + ' id ' + id)
      const opened = reveal(board, cell.row, cell.col)
      if (opened.hitMine) throw new Error('Solver revealed a mine')
      board = opened.board
    }
  }
  if (!isWon(board)) throw new Error('Solver exceeded iteration limit')
  return { seed, origin, outcome: 'solved', revealed: board.rows * board.cols - board.mineCount,
    safeTotal: board.rows * board.cols - board.mineCount, passes, pairClues: 0, subset }
}

function args() {
  let samples = 100
  let json = null
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--samples=')) samples = Number(arg.slice(10))
    else if (arg.startsWith('--json=')) json = arg.slice(7)
    else throw new Error('Unknown argument ' + arg)
  }
  if (!Number.isSafeInteger(samples) || samples < 1 || samples > 1000) throw new Error('samples must be integer 1..1000')
  return { samples, json }
}

const { samples, json } = args()
const targets = missions.filter(m => m.id >= 6)
const findings = []
for (const mission of targets) {
  for (const origin of ['center', 'corner']) {
    const cases = []
    for (let trial = 0; trial < samples; trial++) {
      const seed = mission.id * 1000003 + trial * 71 + (origin === 'center' ? 17 : 31)
      cases.push(simulate(mission, seed, origin))
    }
    const solved = cases.filter(c => c.outcome === 'solved').length
    const stalled = cases.filter(c => c.outcome === 'stalled')
    const avgStallRevealed = stalled.length ? Math.round(1000 * stalled.reduce((sum, c) => sum + c.revealed / c.safeTotal, 0) / stalled.length) / 10 : null
    const stalledPairExamples = stalled.filter(c => c.pairClues > 0).length
    findings.push({
      missionId: mission.id, missionCode: mission.code, rows: mission.rows, cols: mission.cols,
      mines: mission.mines, origin, trials: samples, solved, solvedPct: Math.round(1000 * solved / samples) / 10,
      stalled: stalled.length, avgStallRevealedPct: avgStallRevealed, stalledPairExamples,
      examples: stalled.slice(0, 4).map(c => ({ seed: c.seed, revealedPct: Math.round(1000 * c.revealed / c.safeTotal) / 10, pairClues: c.pairClues })),
    })
  }
}
console.log('SIGNAL//BREACH fairness audit — production generator, seeded test-only RNG')
console.log('Rule set: visible clue completion + subset deduction + global mine count')
console.log('Important: STALLED means not solved by THESE rules, NOT proven logically impossible')
console.log('OP | board | first click | trials | solved by rules | stalled | avg revealed when stalled | 1-of-2 clue at stall')
for (const f of findings) {
  console.log([String(f.missionId).padStart(2, '0'), String(f.rows) + 'x' + String(f.cols) + '/' + String(f.mines),
    f.origin, f.trials, f.solvedPct + '%', f.stalled, f.avgStallRevealedPct === null ? '-' : f.avgStallRevealedPct + '%',
    f.stalledPairExamples].join(' | '))
}
console.log('Examples of stalled cases (seed, pct revealed):')
for (const f of findings) console.log('OP ' + f.missionId + ' ' + f.origin + ': ' + JSON.stringify(f.examples))
if (json) {
  writeFileSync(json, JSON.stringify({
    method: 'safe-first-click, local clues, pairwise subset, global count; no hidden-mine peeking; not complete CSP',
    samplesPerMissionOrigin: samples, findings,
  }, null, 2) + '\n')
  console.log('Saved report to ' + json)
}
