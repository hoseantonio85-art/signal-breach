import { CircleCheck } from 'lucide-react'
import { MissionMetrics } from './MissionMetrics'
import type { Mission } from '../game/types'
import type { Dictionary } from '../i18n'
import type { Progress } from '../stores/progress'

type MissionStatus = 'ready' | 'completed' | 'locked'

type MissionCardProps = {
  mission: Mission
  progress: Progress
  t: Dictionary
  onSelect: (missionId: number) => void
}

/**
 * A campaign tile has three stable zones:
 * header (number and completion icon), title, bottom-aligned footer.
 * Its footer does not move when the title wraps onto a second line.
 */
export function MissionCard({ mission, progress, t, onSelect }: MissionCardProps) {
  const unlocked = mission.id <= progress.unlockedMission
  const result = progress.completed[mission.id]
  const status: MissionStatus = !unlocked ? 'locked' : result ? 'completed' : 'ready'
  const statusLabel =
    status === 'locked' ? t.locked : status === 'completed' && result ? `${t.completed} / ${result.bestRank}` : t.ready

  return (
    <button
      type="button"
      className={`mission-card status-${status}`}
      disabled={!unlocked}
      onClick={() => onSelect(mission.id)}
    >
      <div className="mission-card-top">
        <span>OP {String(mission.id).padStart(2, '0')}</span>
        {status === 'completed' && (
          <CircleCheck
            className="mission-complete-icon"
            size={19}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        )}
      </div>

      <strong className="mission-card-title">{mission.code}</strong>

      <div className="mission-card-footer">
        <MissionMetrics rows={mission.rows} cols={mission.cols} mines={mission.mines} t={t} />
        <span className="mission-status">{statusLabel}</span>
      </div>
    </button>
  )
}
