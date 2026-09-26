export type Progress = {
  unlockedMission: number
  scores: Record<number, number>
}

const PROGRESS_KEY = 'signal_breach_progress_v2'
const fallback: Progress = { unlockedMission: 1, scores: {} }

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<Progress>
    return {
      unlockedMission: Math.max(1, Math.min(10, Number(parsed.unlockedMission) || 1)),
      scores: parsed.scores && typeof parsed.scores === 'object' ? parsed.scores : {},
    }
  } catch {
    return fallback
  }
}

export function saveProgress(progress: Progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
}
