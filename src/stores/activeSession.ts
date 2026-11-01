import type { Board, Cell, GamePhase, GameSession, InteractionMode, Mission } from '../game/types'

export const ACTIVE_SESSION_KEY = 'signal_breach_active_session_v1'

export type ActiveSession = {
  version: 1
  session: {
    kind: 'campaign' | 'free'
    label: string
    rows: number
    cols: number
    mines: number
    missionId?: number
  }
  board: Board
  phase: 'idle' | 'running'
  interactionMode: InteractionMode
  elapsedMs: number
}

type SessionStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
const localStore = () => typeof localStorage === 'undefined' ? null : localStorage

export function makeActiveSession(
  session: GameSession,
  board: Board,
  phase: 'idle' | 'running',
  interactionMode: InteractionMode,
  elapsedMs: number,
): ActiveSession {
  return {
    version: 1,
    session: {
      kind: session.kind,
      label: session.label,
      rows: session.rows,
      cols: session.cols,
      mines: session.mines,
      ...(session.kind === 'campaign' && session.mission ? { missionId: session.mission.id } : {}),
    },
    board,
    phase,
    interactionMode,
    elapsedMs: Math.max(0, Math.floor(elapsedMs)),
  }
}

const obj = (v: unknown): Record<string, unknown> | null =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null
const nonNegativeInt = (v: unknown): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= 0

/** The snapshot is untrusted local data. Reject corrupt/old boards instead of crashing startup. */
export function validateActiveSession(value: unknown): ActiveSession | null {
  const root = obj(value)
  const details = obj(root?.session)
  const grid = obj(root?.board)
  if (!root || !details || !grid || root.version !== 1) return null
  const { rows, cols, mines, kind, label } = details
  if (!nonNegativeInt(rows) || rows < 2 || rows > 30
    || !nonNegativeInt(cols) || cols < 2 || cols > 30
    || rows * cols > 480 || !nonNegativeInt(mines) || mines > rows * cols - 1
    || (kind !== 'campaign' && kind !== 'free')
    || typeof label !== 'string' || label.length > 40) return null
  if (kind === 'campaign' && (!nonNegativeInt(details.missionId) || details.missionId < 1 || details.missionId > 10)) return null
  if (grid.rows !== rows || grid.cols !== cols || grid.mineCount !== mines
    || typeof grid.generated !== 'boolean' || !Array.isArray(grid.cells)
    || grid.cells.length !== rows * cols) return null
  if (root.phase !== 'idle' && root.phase !== 'running') return null
  if (root.interactionMode !== 'scan' && root.interactionMode !== 'quarantine') return null
  if (!nonNegativeInt(root.elapsedMs) || root.elapsedMs > 30 * 24 * 60 * 60 * 1000) return null
  if ((root.phase === 'running') !== grid.generated) return null

  let mineCount = 0
  let safeRevealed = 0
  const cells = grid.cells as unknown[]
  for (let index = 0; index < cells.length; index++) {
    const cell = obj(cells[index])
    if (!cell || cell.row !== Math.floor(index / cols) || cell.col !== index % cols
      || typeof cell.mine !== 'boolean'
      || typeof cell.revealed !== 'boolean'
      || typeof cell.quarantined !== 'boolean'
      || !nonNegativeInt(cell.adjacent) || cell.adjacent > 8
      || cell.exploded === true || (cell.revealed && cell.quarantined)) return null
    if (cell.mine) mineCount++
    if (cell.revealed && !cell.mine) safeRevealed++
    if (cell.revealed && cell.mine) return null
    if (!grid.generated && (cell.mine || cell.revealed || cell.adjacent !== 0)) return null
  }
  if (mineCount !== (grid.generated ? mines : 0)
    || (grid.generated && safeRevealed >= rows * cols - mines)) return null

  if (grid.generated) {
    for (let index = 0; index < cells.length; index++) {
      const cell = cells[index] as Cell
      if (cell.mine) continue
      let adjacent = 0
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue
          const nr = cell.row + dr
          const nc = cell.col + dc
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && (cells[nr * cols + nc] as Cell).mine) adjacent++
        }
      }
      if (cell.adjacent !== adjacent) return null
    }
  }
  return value as ActiveSession
}

export function readActiveSession(storage: SessionStorage | null = localStore()): ActiveSession | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(ACTIVE_SESSION_KEY)
    if (!raw) return null
    const parsed = validateActiveSession(JSON.parse(raw))
    if (!parsed) storage.removeItem(ACTIVE_SESSION_KEY)
    return parsed
  } catch {
    return null
  }
}

export function writeActiveSession(save: ActiveSession, storage: SessionStorage | null = localStore()): boolean {
  if (!storage || !validateActiveSession(save)) return false
  try {
    storage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(save))
    return true
  } catch {
    return false
  }
}

export function clearActiveSession(storage: SessionStorage | null = localStore()): void {
  try { storage?.removeItem(ACTIVE_SESSION_KEY) } catch { /* unavailable storage */ }
}

/** Rebuild the campaign mission from trusted sources instead of trusting JSON mission data. */
export function sessionFromSave(save: ActiveSession, missions: Mission[]): GameSession | null {
  const s = save.session
  if (s.kind === 'campaign') {
    const mission = missions.find(m => m.id === s.missionId)
    if (!mission || mission.rows !== s.rows || mission.cols !== s.cols || mission.mines !== s.mines) return null
    return { kind: 'campaign', label: 'OP ' + String(mission.id).padStart(2, '0'),
      rows: mission.rows, cols: mission.cols, mines: mission.mines, mission }
  }
  const presets = [
    { label: 'TRACE', rows: 9, cols: 9, mines: 10 },
    { label: 'BREACH', rows: 16, cols: 16, mines: 40 },
    { label: 'BLACK ICE', rows: 16, cols: 30, mines: 99 },
  ]
  const preset = presets.find(p => p.label === s.label && p.rows === s.rows && p.cols === s.cols && p.mines === s.mines)
  return preset ? { kind: 'free', ...preset } : null
}
