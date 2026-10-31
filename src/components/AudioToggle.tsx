import { Volume2, VolumeX } from 'lucide-react'
import type { Dictionary } from '../i18n'

type AudioToggleProps = {
  enabled: boolean
  onToggle: () => void
  t: Dictionary
  variant: 'menu' | 'game'
}

/** One visual and accessible sound toggle shared by menus and gameplay. */
export function AudioToggle({ enabled, onToggle, t, variant }: AudioToggleProps) {
  const label = enabled ? t.audioOn : t.audioOff
  const variantClass = variant === 'menu' ? 'menu-utility-btn menu-audio-btn' : 'audio-chip'

  return (
    <button
      type="button"
      className={`chip-btn ${variantClass} audio-toggle ${enabled ? 'active' : ''}`}
      onClick={onToggle}
      aria-label={label}
      title={label}
      aria-pressed={enabled}
    >
      {enabled
        ? <Volume2 size={17} strokeWidth={1.8} aria-hidden="true" />
        : <VolumeX size={17} strokeWidth={1.8} aria-hidden="true" />}
      {variant === 'game' && <span className="audio-label">{label}</span>}
    </button>
  )
}
