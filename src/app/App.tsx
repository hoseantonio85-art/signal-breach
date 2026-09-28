import { useEffect, useMemo, useState } from 'react'
import { audioEngine } from '../audio/audioEngine'
import { missions } from '../campaign/missions'
import type { GameSession, Language, Mission } from '../game/types'
import { dictionaries } from '../i18n'
import { GameScreen, type CampaignResult } from '../screens/GameScreen'
import { loadProgress, saveProgress, type Progress } from '../stores/progress'
import { loadLanguage, saveLanguage } from '../stores/settings'

type Screen = 'boot' | 'menu' | 'campaign' | 'free' | 'briefing' | 'game'

type FreePreset = {
  key: string
  label: string
  rows: number
  cols: number
  mines: number
  description: 'lowDensity' | 'mediumDensity' | 'highDensity'
}

const freePresets: FreePreset[] = [
  { key: 'trace', label: 'TRACE', rows: 9, cols: 9, mines: 10, description: 'lowDensity' },
  { key: 'breach', label: 'BREACH', rows: 16, cols: 16, mines: 40, description: 'mediumDensity' },
  { key: 'blackice', label: 'BLACK ICE', rows: 16, cols: 30, mines: 99, description: 'highDensity' },
]

export function App() {
  const [screen, setScreen] = useState<Screen>('boot')
  const [language, setLanguage] = useState<Language>(() => loadLanguage())
  const [progress, setProgress] = useState<Progress>(() => loadProgress())
  const [selectedMission, setSelectedMission] = useState<Mission>(missions[0])
  const [session, setSession] = useState<GameSession | null>(null)
  const [audioOn, setAudioOn] = useState(false)
  const t = dictionaries[language]

  const totalScore = useMemo(
    () => Object.values(progress.completed).reduce((sum, result) => sum + (result?.bestScore ?? 0), 0),
    [progress],
  )

  useEffect(() => {
    document.documentElement.lang = language
    saveLanguage(language)
  }, [language])

  useEffect(() => {
    if (screen !== 'boot') return
    const timer = window.setTimeout(() => setScreen('menu'), 1050)
    return () => window.clearTimeout(timer)
  }, [screen])

  async function toggleAudio() {
    const next = !audioOn
    setAudioOn(next)
    await audioEngine.setEnabled(next)
  }

  function openMission(missionId: number) {
    const mission = missions.find((entry) => entry.id === missionId) ?? missions[0]
    if (mission.id > progress.unlockedMission) return
    setSelectedMission(mission)
    setScreen('briefing')
  }

  function startMission(mission: Mission) {
    setSession({
      kind: 'campaign',
      label: `OP ${String(mission.id).padStart(2, '0')}`,
      rows: mission.rows,
      cols: mission.cols,
      mines: mission.mines,
      mission,
    })
    setScreen('game')
  }

  function startFree(preset: FreePreset) {
    setSession({ kind: 'free', label: preset.label, rows: preset.rows, cols: preset.cols, mines: preset.mines })
    setScreen('game')
  }

  function recordCampaignWin(result: CampaignResult) {
    setProgress((current) => {
      const existing = current.completed[result.missionId]
      const nextResult = !existing
        ? { bestScore: result.score, bestRank: result.rank, bestTime: result.time }
        : {
            bestScore: Math.max(existing.bestScore, result.score),
            bestRank: result.score >= existing.bestScore ? result.rank : existing.bestRank,
            bestTime: Math.min(existing.bestTime, result.time),
          }
      const next: Progress = {
        unlockedMission: Math.max(current.unlockedMission, Math.min(10, result.missionId + 1)),
        completed: { ...current.completed, [result.missionId]: nextResult },
      }
      saveProgress(next)
      return next
    })
  }

  if (screen === 'boot') {
    return (
      <main className="boot-screen">
        <div className="boot-copy">
          <div className="brand">SIGNAL//BREACH</div>
          <div className="boot-sub">RELAY RECOVERY TERMINAL</div>
          <div className="boot-track"><i /></div>
          <div className="micro">HANDSHAKE / NODE MAP / INTEGRITY CHECK / READY</div>
        </div>
      </main>
    )
  }

  if (screen === 'game' && session) {
    return (
      <GameScreen
        key={`${session.kind}-${session.mission?.id ?? session.label}`}
        session={session}
        language={language}
        t={t}
        audioOn={audioOn}
        onAudioToggle={toggleAudio}
        onLanguageChange={setLanguage}
        onMenu={() => setScreen('menu')}
        onOperations={() => setScreen('campaign')}
        onNextMission={(missionId) => openMission(missionId)}
        onCampaignWin={recordCampaignWin}
      />
    )
  }

  return (
    <main className="shell">
      <div className="scanlines" />
      <header className="topbar">
        <button className="wordmark" onClick={() => setScreen('menu')}>SIGNAL//BREACH</button>
        <div className="top-actions">
          {screen === 'menu' && (
            <select value={language} onChange={(event: { target: { value: string } }) => setLanguage(event.target.value as Language)} aria-label={t.language}>
              <option value="ru">RU</option><option value="en">EN</option>
            </select>
          )}
          <button className={`chip-btn ${audioOn ? 'active' : ''}`} onClick={toggleAudio}><span className="dot" />{audioOn ? t.audioOn : t.audioOff}</button>
        </div>
      </header>

      {screen === 'menu' && (
        <section className="menu-shell-page">
          <div className="menu-hero-page">
            <div className="menu-sigil" />
            <div className="eyebrow">SIGNAL COMMAND // {t.systemReady}</div>
            <h1>SIGNAL//BREACH</h1>
            <p className="lead">{t.globalIncidentCopy}</p>
          </div>
          <div className="menu-body-page">
            <div className="mode-grid">
              <button className="mode-card primary-card" onClick={() => setScreen('campaign')}>
                <span className="mode-index">{t.storyProtocol}</span>
                <strong>{t.campaign}</strong>
                <span>{t.campaignDescription}</span>
                <small>OP {String(Math.min(progress.unlockedMission, 10)).padStart(2, '0')} / 10</small>
                <div className="menu-progress"><i style={{ width: `${Math.min(progress.unlockedMission, 10) * 10}%` }} /></div>
              </button>
              <button className="mode-card" onClick={() => setScreen('free')}>
                <span className="mode-index">{t.diagnosticMode}</span>
                <strong>{t.freeRun}</strong>
                <span>{t.freeDescription}</span>
                <small>TRACE / BREACH / BLACK ICE</small>
              </button>
            </div>
            <div className="menu-meta-row"><span>{t.localProgress}</span><span>{t.build}</span></div>
          </div>
        </section>
      )}

      {screen === 'campaign' && (
        <section className="content-panel campaign-panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">SIGNAL COMMAND // {t.operations}</div>
              <h2>{t.globalIncident}</h2>
              <p className="panel-copy">{t.globalIncidentCopy}</p>
            </div>
            <div className="panel-head-actions">
              <div className="campaign-score"><small>{t.signalScore}</small><strong>{String(totalScore).padStart(6, '0')}</strong></div>
              <button className="ghost" onClick={() => setScreen('menu')}>×</button>
            </div>
          </div>
          <div className="mission-grid">
            {missions.map((mission) => {
              const unlocked = mission.id <= progress.unlockedMission
              const completed = progress.completed[mission.id]
              return (
                <button className={`mission-card ${completed ? 'completed' : ''} ${mission.id === progress.unlockedMission ? 'current' : ''}`} disabled={!unlocked} key={mission.id} onClick={() => openMission(mission.id)}>
                  <span>OP {String(mission.id).padStart(2, '0')}</span>
                  <strong>{mission.code}</strong>
                  <small>{mission.rows}×{mission.cols} / {mission.mines} {t.corruption}</small>
                  <em>{!unlocked ? t.locked : completed ? `${t.restored} / ${completed.bestRank}` : t.ready}</em>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {screen === 'free' && (
        <section className="content-panel compact">
          <div className="panel-head">
            <div><div className="eyebrow">SIGNAL//BREACH // {t.diagnosticMode}</div><h2>{t.freeRun}</h2><p className="panel-copy">{t.chooseDensity}</p></div>
            <button className="ghost" onClick={() => setScreen('menu')}>×</button>
          </div>
          <div className="difficulty-cards">
            {freePresets.map((preset) => (
              <button className="difficulty-card" key={preset.key} onClick={() => startFree(preset)}>
                <b>{preset.label}</b><span>{preset.rows}×{preset.cols} / {preset.mines}</span><em>{t[preset.description]}</em>
              </button>
            ))}
          </div>
        </section>
      )}

      {screen === 'briefing' && (
        <div className="briefing-layer-page">
          <section className="briefing-card-page">
            <div className="briefing-topline"><span>{t.briefing}</span><button className="ghost" onClick={() => setScreen('campaign')}>×</button></div>
            <div className="briefing-op">OP {String(selectedMission.id).padStart(2, '0')} / 10</div>
            <h2>{selectedMission.code}</h2>
            <div className="briefing-location">{selectedMission.location[language]}</div>
            <div className="voss-line"><span className="voss-sigil">V</span><div><b>{t.colonelVoss}</b><p>{selectedMission.briefing[language]}</p></div></div>
            <div className="briefing-grid"><span>{selectedMission.rows}×{selectedMission.cols}</span><span>{selectedMission.mines} {t.corruption}</span><span>PAR {formatPar(selectedMission.parSeconds)}</span></div>
            <div className="briefing-actions"><button className="secondary" onClick={() => setScreen('campaign')}>{t.back}</button><button className="primary" onClick={() => startMission(selectedMission)}>{t.startOperation}</button></div>
          </section>
        </div>
      )}
    </main>
  )
}

function formatPar(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
