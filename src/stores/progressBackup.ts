import type { MissionResult, Progress } from './progress'

const PREFIX = 'SIGNAL-BREACH-PROGRESS/1:'
const MAX_BACKUP_LENGTH = 12000
type BackupEnvelope = {
  format: 'SIGNAL-BREACH-PROGRESS'
  version: 1
  completed: Record<number, MissionResult>
  unlockedMission: number
}

const object = (v: unknown): Record<string, unknown> | null =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null
const integer = (n: unknown, min: number, max: number): n is number =>
  typeof n === 'number' && Number.isSafeInteger(n) && n >= min && n <= max

/** Small, human-copyable offline backup. This only contains campaign results (not the active board). */
export function exportProgressBackup(progress: Progress): string {
  const envelope: BackupEnvelope = {
    format: 'SIGNAL-BREACH-PROGRESS',
    version: 1,
    unlockedMission: progress.unlockedMission,
    completed: progress.completed,
  }
  return PREFIX + JSON.stringify(envelope)
}

/** Reject invalid input rather than overwriting good progress with untrusted pasted data. */
export function parseProgressBackup(value: string): Progress | null {
  if (value.length > MAX_BACKUP_LENGTH) return null
  const input = value.trim()
  if (!input.startsWith(PREFIX)) return null
  let parsed: unknown
  try { parsed = JSON.parse(input.slice(PREFIX.length)) } catch { return null }
  const outer = object(parsed)
  if (!outer || outer.format !== 'SIGNAL-BREACH-PROGRESS' || outer.version !== 1
    || !integer(outer.unlockedMission, 1, 10)) return null
  const rawCompleted = object(outer.completed)
  if (!rawCompleted) return null
  const keys = Object.keys(rawCompleted)
  if (keys.length > 10) return null
  const completed: Progress['completed'] = {}
  for (const key of keys) {
    if (!/^(10|[1-9])$/.test(key)) return null
    const missionId = Number(key)
    const result = object(rawCompleted[key])
    if (!result
      || !integer(result.bestScore, 0, 100000000)
      || !integer(result.bestTime, 0, 2592000)
      || !['S', 'A', 'B', 'C'].includes(result.bestRank as string)) return null
    completed[missionId] = {
      bestScore: result.bestScore,
      bestTime: result.bestTime,
      bestRank: result.bestRank as string,
    }
  }
  const highestCompleted = keys.reduce((max, key) => Math.max(max, Number(key)), 0)
  if (outer.unlockedMission < Math.min(10, highestCompleted + 1)) return null
  return { unlockedMission: outer.unlockedMission, completed }
}

/** Never destroy existing results while importing an older or partial backup. */
export function mergeProgress(current: Progress, restored: Progress): Progress {
  const completed = { ...current.completed }
  for (const [id, candidate] of Object.entries(restored.completed)) {
    const original = completed[Number(id)]
    completed[Number(id)] = original
      ? {
        bestScore: Math.max(original.bestScore, candidate.bestScore),
        bestTime: Math.min(original.bestTime, candidate.bestTime),
        bestRank: candidate.bestScore > original.bestScore ? candidate.bestRank : original.bestRank,
      }
      : candidate
  }
  return {
    unlockedMission: Math.max(current.unlockedMission, restored.unlockedMission),
    completed,
  }
}
