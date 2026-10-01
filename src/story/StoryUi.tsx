import type { Language } from '../game/types'
import {
  availableStoryBeats,
  getStoryBeat,
  storyCharacters,
  storyUi,
  worldContext,
  worldTeaser,
  type ExperienceMode,
} from './story'

const portraitSrc = (path: string) => `${import.meta.env.BASE_URL}${path}`

export function ExperienceSwitch({
  language,
  mode,
  onChange,
}: {
  language: Language
  mode: ExperienceMode
  onChange: (mode: ExperienceMode) => void
}) {
  const copy = storyUi[language]
  return (
    <div className="experience-switch" aria-label={copy.versionLabel}>
      <span>{copy.versionLabel}</span>
      <button className={mode === 'classic' ? 'active' : ''} onClick={() => onChange('classic')}>{copy.modeClassic}</button>
      <button className={mode === 'story' ? 'active' : ''} onClick={() => onChange('story')}>{copy.modeStory}</button>
    </div>
  )
}

export function StoryContextTeaser({ language, onOpen }: { language: Language; onOpen: () => void }) {
  const copy = storyUi[language]
  return (
    <div className="story-context-teaser">
      <span className="story-context-mark" aria-hidden="true" />
      <div className="story-context-copy">
        <small>{copy.storyProtocol}</small>
        <p>{worldTeaser[language]}</p>
      </div>
      <button className="story-link" onClick={onOpen}>{copy.context} →</button>
    </div>
  )
}

export function LatestTransmission({
  language,
  unlockedMission,
  onArchive,
}: {
  language: Language
  unlockedMission: number
  onArchive: () => void
}) {
  const beats = availableStoryBeats(unlockedMission)
  const beat = beats.at(-1)
  if (!beat) return null
  const speaker = storyCharacters[beat.speaker]
  const copy = storyUi[language]
  return (
    <div className="story-transmission">
      <img src={portraitSrc(speaker.portrait)} alt="" />
      <div className="story-transmission-copy">
        <small>{copy.latestTransmission} // {beat.channel}</small>
        <b>{speaker.name}</b>
        <p>{beat.transmission[language]}</p>
      </div>
      <button className="story-link" onClick={onArchive}>{copy.archive} →</button>
    </div>
  )
}

export function StoryDialogue({ language, missionId }: { language: Language; missionId: number }) {
  const beat = getStoryBeat(missionId)
  if (!beat) return null
  const speaker = storyCharacters[beat.speaker]
  return (
    <div className="story-dialogue">
      <img className="story-avatar" src={portraitSrc(speaker.portrait)} alt="" />
      <div>
        <div className="story-dialogue-head"><b>{speaker.name}</b><span>{beat.channel}</span></div>
        <div className="story-dialogue-role">{speaker.role[language]}</div>
        <p>{beat.briefing[language]}</p>
      </div>
    </div>
  )
}

export function StoryContextModal({ language, onClose }: { language: Language; onClose: () => void }) {
  const copy = storyUi[language]
  return (
    <div className="story-modal-layer" onMouseDown={onClose}>
      <section className="story-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="story-modal-head">
          <div><small>SIGNAL COMMAND // BACKGROUND</small><h2>{copy.contextTitle}</h2></div>
          <button className="ghost" onClick={onClose} aria-label={copy.close}>×</button>
        </div>
        <div className="story-modal-body world-context">
          {worldContext[language].map((paragraph, index) => <p className={index === 0 ? 'context-lead' : ''} key={paragraph}>{paragraph}</p>)}
        </div>
      </section>
    </div>
  )
}

export function StoryArchiveModal({
  language,
  unlockedMission,
  onClose,
}: {
  language: Language
  unlockedMission: number
  onClose: () => void
}) {
  const copy = storyUi[language]
  const beats = availableStoryBeats(unlockedMission)
  return (
    <div className="story-modal-layer" onMouseDown={onClose}>
      <section className="story-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="story-modal-head">
          <div><small>SIGNAL COMMAND // LOCAL ARCHIVE</small><h2>{copy.archiveTitle}</h2></div>
          <button className="ghost" onClick={onClose} aria-label={copy.close}>×</button>
        </div>
        <div className="story-modal-body">
          {beats.length === 0 ? <div className="archive-empty">{copy.archiveEmpty}</div> : (
            <div className="archive-list">
              {[...beats].reverse().map((beat) => {
                const speaker = storyCharacters[beat.speaker]
                return (
                  <article className="archive-item" key={beat.missionId}>
                    <img src={portraitSrc(speaker.portrait)} alt="" />
                    <div>
                      <div className="archive-item-top"><b>{speaker.name}</b><span>OP {String(beat.missionId).padStart(2, '0')}</span></div>
                      <small>{beat.channel} // {speaker.role[language]}</small>
                      <p>{beat.transmission[language]}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
