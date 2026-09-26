export type MissionResult = {
  bestScore: number
  bestTime: number
  bestRank: string
}

export type Progress = {
  unlockedMission: number
  completed: Record<number, MissionResult>
}

const PROGRESS_KEY = 'signal_breach_progress_v3'
const fallback: Progress = { unlockedMission: 1, completed: {} }

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return { ...fallback, completed: {} }
    const parsed = JSON.parse(raw) as Partial<Progress>
    return {
      unlockedMission: Math.max(1, Math.min(10, Number(parsed.unlockedMission) || 1)),
      completed: parsed.completed && typeof parsed.completed === 'object' ? parsed.completed : {},
    }
  } catch {
    return { ...fallback, completed: {} }
  }
}

export function saveProgress(progress: Progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
}
