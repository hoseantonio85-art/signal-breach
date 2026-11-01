import { useEffect, useMemo, useState } from 'react'
import { audioEngine } from '../audio/audioEngine'
import { missions } from '../campaign/missions'
import { AudioToggle } from '../components/AudioToggle'
import { MissionCard } from '../components/MissionCard'
import { MissionMetrics } from '../components/MissionMetrics'
import type { GameSession, Language, Mission } from '../game/types'
import { dictionaries } from '../i18n'
import { GameScreen, type CampaignResult } from '../screens/GameScreen'
import { loadProgress, saveProgress, type Progress } from '../stores/progress'
import { loadLanguage, saveLanguage } from '../stores/settings'
import { clearActiveSession, readActiveSession, sessionFromSave, type ActiveSession } from '../stores/activeSession'

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
  const [savedSession, setSavedSession] = useState<ActiveSession | null>(() => readActiveSession())
  const [restoredSession, setRestoredSession] = useState<ActiveSession | null>(null)
  const [pendingSession, setPendingSession] = useState<GameSession | null>(null)
  const [gameRun, setGameRun] = useState(0)
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

  function openFreshGame(nextSession: GameSession) {
    clearActiveSession()
    setSavedSession(null)
    setRestoredSession(null)
    setPendingSession(null)
    setSession(nextSession)
    setGameRun((value) => value + 1)
    setScreen('game')
  }

  function beginSession(nextSession: GameSession) {
    // Never silently overwrite an unfinished campaign or Free Run board.
    const existing = readActiveSession()
    if (existing && sessionFromSave(existing, missions)) {
      setSavedSession(existing)
      setPendingSession(nextSession)
      return
    }
    openFreshGame(nextSession)
  }

  function resumeSaved() {
    const existing = readActiveSession()
    const restored = existing && sessionFromSave(existing, missions)
    if (!existing || !restored) {
      clearActiveSession()
      setSavedSession(null)
      setPendingSession(null)
      return
    }
    setSession(restored)
    setRestoredSession(existing)
    setSavedSession(existing)
    setPendingSession(null)
    setGameRun((value) => value + 1)
    setScreen('game')
  }

  function leaveGame(destination: 'menu' | 'campaign') {
    // GameScreen commits its latest board synchronously before calling back.
    setSavedSession(readActiveSession())
    setRestoredSession(null)
    setScreen(destination)
  }

  function startMission(mission: Mission) {
    beginSession({
      kind: 'campaign',
      label: `OP ${String(mission.id).padStart(2, '0')}`,
      rows: mission.rows,
      cols: mission.cols,
      mines: mission.mines,
      mission,
    })
  }

  function startFree(preset: FreePreset) {
    beginSession({ kind: 'free', label: preset.label, rows: preset.rows, cols: preset.cols, mines: preset.mines })
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
          <div className="brand">SIGNAL // BREACH</div>
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
        key={session.kind + "-" + (session.mission?.id ?? session.label) + "-" + gameRun}
        session={session}
        initialSave={restoredSession}
        language={language}
        t={t}
        audioOn={audioOn}
        onAudioToggle={toggleAudio}
        onLanguageChange={setLanguage}
        onMenu={() => leaveGame('menu')}
        onOperations={() => leaveGame('campaign')}
        onNextMission={(missionId) => openMission(missionId)}
        onCampaignWin={recordCampaignWin}
      />
    )
  }

  return (
    <main className="shell">
      <div className="scanlines" />
      <header className="topbar">
        <button className="wordmark" onClick={() => setScreen('menu')}>SIGNAL // BREACH</button>
        <div className="top-actions">
          {(screen === 'menu' || screen === 'campaign' || screen === 'free') && (
            <button
              type="button"
              className="chip-btn menu-utility-btn menu-language-btn"
              onClick={() => setLanguage((current) => current === 'ru' ? 'en' : 'ru')}
              aria-label={language === 'ru' ? 'Переключить язык на английский' : 'Switch language to Russian'}
              title={language === 'ru' ? 'English' : 'Русский'}
            >
              {language.toUpperCase()}
            </button>
          )}
          <AudioToggle enabled={audioOn} onToggle={toggleAudio} t={t} variant="menu" />
        </div>
      </header>

      {screen === 'menu' && (
        <section className="menu-shell-page">
          <div className="menu-hero-page">
            <div className="menu-sigil" />
            <div className="eyebrow">SIGNAL COMMAND // {t.systemReady}</div>
            <h1>SIGNAL // BREACH</h1>
            <p className="lead">{t.globalIncidentCopy}</p>
          </div>
          <div className="menu-body-page">
            {savedSession && (
              <div className="resume-panel">
                <div className="resume-panel-copy">
                  <span className="eyebrow">{t.savedSignal}</span>
                  <strong>{savedSession.session.kind === 'campaign' ? savedSession.session.label : savedSession.session.label}</strong>
                </div>
                <button className="primary" type="button" onClick={resumeSaved}>{t.continueSession}</button>
              </div>
            )}
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
            <div className="menu-meta-row"><span>{t.localProgress}</span><span>{`v${__APP_VERSION__} // ${__BUILD_TARGET__}`}</span></div>
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
            {missions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                progress={progress}
                t={t}
                onSelect={openMission}
              />
            ))}          </div>
        </section>
      )}

      {screen === 'free' && (
        <section className="content-panel compact">
          <div className="panel-head">
            <div><div className="eyebrow">SIGNAL // BREACH // {t.diagnosticMode}</div><h2>{t.freeRun}</h2><p className="panel-copy">{t.chooseDensity}</p></div>
            <button className="ghost" onClick={() => setScreen('menu')}>×</button>
          </div>
          <div className="difficulty-cards">
            {freePresets.map((preset) => (
              <button className="difficulty-card" key={preset.key} onClick={() => startFree(preset)}>
                <b>{preset.label}</b>
                <MissionMetrics rows={preset.rows} cols={preset.cols} mines={preset.mines} t={t} variant="free" />
                <em>{t[preset.description]}</em>
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
            <div className="briefing-grid">
              <MissionMetrics rows={selectedMission.rows} cols={selectedMission.cols} mines={selectedMission.mines} t={t} variant="briefing" />
              <span>PAR {formatPar(selectedMission.parSeconds)}</span>
            </div>
            <div className="briefing-actions"><button className="secondary" onClick={() => setScreen('campaign')}>{t.back}</button><button className="primary" onClick={() => startMission(selectedMission)}>{t.startOperation}</button></div>
          </section>
        </div>
      )}
      {pendingSession && (
        <div className="modal-layer" role="presentation">
          <section className="help-card session-replace-dialog" role="dialog" aria-modal="true" aria-label={t.replaceSessionTitle}>
            <div className="state-kicker">SIGNAL // BREACH</div>
            <h2>{t.replaceSessionTitle}</h2>
            <p>{t.replaceSessionDescription}</p>
            <div className="session-replace-actions">
              <button className="secondary" type="button" onClick={() => setPendingSession(null)}>{t.back}</button>
              <button className="primary" type="button" onClick={() => openFreshGame(pendingSession)}>{t.newSession}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

function formatPar(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
