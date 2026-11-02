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
import { analyzeExactFrontier } from './qa/constraint-frontier.mjs'

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}


/** Test-only generator prototype: a full inward shifted 3x3 protected square. */
export function generateInset3x3(board, safeRow, safeCol, random) {
  const rowFrom = Math.max(0, Math.min(board.rows - 3, safeRow - 1))
  const colFrom = Math.max(0, Math.min(board.cols - 3, safeCol - 1))
  const safe = new Set()
  for (let r = rowFrom; r < rowFrom + 3; r++)
    for (let c = colFrom; c < colFrom + 3; c++) safe.add(r * board.cols + c)
  const next = { ...board, generated: true,
    cells: board.cells.map(cell => ({ ...cell, mine: false, adjacent: 0, exploded: false })) }
  const candidates = next.cells.map((_, id) => id).filter(id => !safe.has(id))
  if (candidates.length < next.mineCount) throw Error('Not enough cells to place mines')
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }
  for (const id of candidates.slice(0, next.mineCount)) next.cells[id].mine = true
  for (const cell of next.cells)
    if (!cell.mine) cell.adjacent = neighbors(next, cell.row, cell.col).filter(n => n.mine).length
  return next
}
const variants = {
  baseline: { mineTargets: null, insetOpening: false },
  density: { mineTargets: { 7: 40, 8: 47, 9: 54, 10: 62 }, insetOpening: false },
  opening: { mineTargets: null, insetOpening: true },
  both: { mineTargets: { 7: 40, 8: 47, 9: 54, 10: 62 }, insetOpening: true },
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

function simulate(mission, seed, origin, exactMode = false, variantName = 'baseline') {
  const startRow = origin === 'corner' ? 0 : Math.floor(mission.rows / 2)
  const startCol = origin === 'corner' ? 0 : Math.floor(mission.cols / 2)
  const variant = variants[variantName]
  const mineCount = variant.mineTargets?.[mission.id] ?? mission.mines
  const generator = variant.insetOpening ? generateInset3x3 : generateBoard
  let board = generator(createBoard(mission.rows, mission.cols, mineCount), startRow, startCol, rng(seed))
  if (board.cells.filter(c => c.mine).length !== mineCount) throw new Error('Wrong generated mine count')
  const protectedCells = [board.cells[startRow * mission.cols + startCol], ...neighbors(board, startRow, startCol)]
  if (protectedCells.some(c => c.mine)) throw new Error('First click protection failed')
  if (variant.insetOpening) {
    const r0 = Math.max(0, Math.min(board.rows - 3, startRow - 1))
    const c0 = Math.max(0, Math.min(board.cols - 3, startCol - 1))
    for (let r = r0; r < r0 + 3; r++)
      for (let c = c0; c < c0 + 3; c++)
        if (board.cells[r * board.cols + c].mine) throw Error('3x3 window violated')
  }
  const first = reveal(board, startRow, startCol)
  if (first.hitMine) throw new Error('First click hit a mine')
  board = first.board
  const firstReveal = first.revealedDelta
  let passes = 0
  let subset = 0
  for (; passes < mission.rows * mission.cols * 2; passes++) {
    if (isWon(board)) break
    const result = deduce(board)
    subset += result.subsetDeductions
    let safe = result.safe
    let mines = result.mines
    if (!safe.size && !mines.size) {
      const exact = exactMode ? analyzeExactFrontier(board) : null
      if (exact?.status === 'forced') {
        safe = exact.safe
        mines = exact.mines
      } else {
        const revealed = board.cells.filter(c => c.revealed && !c.mine).length
        const outcome = !exact ? 'stalled' : exact.status === 'guess-required' ? 'proven-guess' : 'inconclusive'
        return { seed, origin, outcome, firstReveal, revealed, safeTotal: board.rows * board.cols - board.mineCount,
          passes, pairClues: result.pairClues, subset, reason: exact?.reason ?? null }
      }
    }
    for (const id of mines) {
      const cell = board.cells[id]
      if (cell.mine !== true) throw new Error('Unsafe mine deduction at seed ' + seed + ' id ' + id)
      board = toggleQuarantine(board, cell.row, cell.col)
    }
    for (const id of safe) {
      const cell = board.cells[id]
      if (cell.mine) throw new Error('Unsafe reveal deduction at seed ' + seed + ' id ' + id)
      const opened = reveal(board, cell.row, cell.col)
      if (opened.hitMine) throw new Error('Solver revealed a mine')
      board = opened.board
    }
  }
  if (!isWon(board)) throw new Error('Solver exceeded iteration limit')
  return { seed, origin, outcome: 'solved', firstReveal, revealed: board.rows * board.cols - board.mineCount,
    safeTotal: board.rows * board.cols - board.mineCount, passes, pairClues: 0, subset }
}

function args() {
  let samples = 100
  let json = null
  let exactMode = false
  let variant = 'baseline'
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--samples=')) samples = Number(arg.slice(10))
    else if (arg.startsWith('--json=')) json = arg.slice(7)
    else if (arg === '--exact') exactMode = true
    else if (arg.startsWith('--variant=')) variant = arg.slice(10)
    else throw new Error('Unknown argument ' + arg)
  }
  if (!Number.isSafeInteger(samples) || samples < 1 || samples > 1000) throw new Error('samples must be integer 1..1000')
  if (!Object.hasOwn(variants, variant)) throw Error('invalid variant')
  return { samples, json, exactMode, variant }
}

const { samples, json, exactMode, variant } = args()
const targets = missions.filter(m => m.id >= 6)
const findings = []
for (const mission of targets) {
  for (const origin of ['center', 'corner']) {
    const cases = []
    for (let trial = 0; trial < samples; trial++) {
      const seed = mission.id * 1000003 + trial * 71 + (origin === 'center' ? 17 : 31)
      cases.push(simulate(mission, seed, origin, exactMode, variant))
    }
    const solved = cases.filter(c => c.outcome === 'solved').length
    const stalled = cases.filter(c => c.outcome !== 'solved')
    const provenGuess = cases.filter(c => c.outcome === 'proven-guess').length
    const inconclusive = cases.filter(c => c.outcome === 'inconclusive').length
    const avgFirstReveal = Math.round(100 * cases.reduce((n, c) => n + c.firstReveal, 0) / cases.length) / 100
    const avgStallRevealed = stalled.length ? Math.round(1000 * stalled.reduce((sum, c) => sum + c.revealed / c.safeTotal, 0) / stalled.length) / 10 : null
    const stalledPairExamples = stalled.filter(c => c.pairClues > 0).length
    findings.push({
      missionId: mission.id, missionCode: mission.code, rows: mission.rows, cols: mission.cols,
      mines: variants[variant].mineTargets?.[mission.id] ?? mission.mines, origin, trials: samples, solved, solvedPct: Math.round(1000 * solved / samples) / 10,
      stalled: stalled.length, provenGuess, inconclusive, avgFirstReveal, avgStallRevealedPct: avgStallRevealed, stalledPairExamples,
      examples: stalled.slice(0, 4).map(c => ({ seed: c.seed, outcome: c.outcome, reason: c.reason ?? null, revealedPct: Math.round(1000 * c.revealed / c.safeTotal) / 10, pairClues: c.pairClues })),
    })
  }
}
console.log('SIGNAL//BREACH fairness audit — variant ' + variant + ', seeded test-only RNG')
console.log('Rule set: visible clue completion + subset deduction + global mine count' + (exactMode ? ' + exact CSP (up to 23 variables and 250k DFS nodes)' : ''))
console.log(exactMode ? 'PROVEN-GUESS = no zero-risk move given ALL visible/global constraints; INCONCLUSIVE = exact CSP limit hit' : 'Important: STALLED means not solved by THESE rules, NOT proven logically impossible')
console.log(exactMode ? 'OP | board | first click | trials | solved | proven guess | inconclusive | avg revealed when stopped' : 'OP | board | first click | trials | solved by rules | stalled | avg revealed when stalled | 1-of-2 clue at stall')
for (const f of findings) {
  const common = [String(f.missionId).padStart(2, '0'), String(f.rows) + 'x' + String(f.cols) + '/' + String(f.mines), f.origin, f.trials, f.solvedPct + '%']
  const end = [f.avgStallRevealedPct === null ? '-' : f.avgStallRevealedPct + '%']
  console.log((exactMode ? [...common, f.provenGuess, f.inconclusive, ...end] : [...common, f.stalled, ...end, f.stalledPairExamples]).join(' | '))
}
console.log('Examples of stalled cases (seed, pct revealed):')
for (const f of findings) console.log('OP ' + f.missionId + ' ' + f.origin + ': ' + JSON.stringify(f.examples))
if (json) {
  writeFileSync(json, JSON.stringify({
    method: exactMode ? 'local+subset+global+bounded exact CSP; proven guess only if exhaustive; no hidden peeking' : 'safe-first-click, local clues, pairwise subset, global count; no hidden-mine peeking; not complete CSP',
    exactMode,
    variant,
    samplesPerMissionOrigin: samples, findings,
  }, null, 2) + '\n')
  console.log('Saved report to ' + json)
}
