import type { Dictionary } from '../i18n'

type MissionMetricsProps = {
  rows: number
  cols: number
  mines: number
  t: Dictionary
  variant?: 'card' | 'free' | 'briefing'
}

/**
 * Localized mission facts, always label-first in all selection screens.
 * The card variant keeps exactly two rows. Other variants adapt only their
 * layout, never their vocabulary or the order of label/value.
 */
export function MissionMetrics({ rows, cols, mines, t, variant = 'card' }: MissionMetricsProps) {
  return (
    <div className={`mission-metrics mission-metrics-${variant}`}>
      <span className="mission-metrics-grid">
        {t.gridLabel}&nbsp;{rows}{t.gridSeparator}{cols}
      </span>
      <span className="mission-metrics-corruption">
        {t.corruption}&nbsp;{mines}
      </span>
    </div>
  )
}
