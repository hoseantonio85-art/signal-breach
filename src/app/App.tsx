import { useEffect, useMemo, useState } from 'react'
import { missions } from '../campaign/missions'
import { dictionaries, type Language } from '../i18n'
import { loadLanguage, saveLanguage } from '../stores/settings'
import { loadProgress } from '../stores/progress'

type Screen = 'boot' | 'menu' | 'campaign' | 'free'

export function App() {
  const [screen, setScreen] = useState<Screen>('boot')
  const [language, setLanguage] = useState<Language>(() => loadLanguage())
  const t = dictionaries[language]
  const progress = useMemo(() => loadProgress(), [])

  useEffect(() => {
    document.documentElement.lang = language
    saveLanguage(language)
  }, [language])

  useEffect(() => {
    if (screen !== 'boot') return
    const timer = window.setTimeout(() => setScreen('menu'), 1050)
    return () => window.clearTimeout(timer)
  }, [screen])

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

  return (
    <main className="shell">
      <div className="scanlines" />
      <header className="topbar">
        <button className="wordmark" onClick={() => setScreen('menu')}>SIGNAL//BREACH</button>
        <div className="top-actions">
          <select value={language} onChange={(event) => setLanguage(event.target.value as Language)} aria-label={t.language}>
            <option value="ru">RU</option>
            <option value="en">EN</option>
          </select>
        </div>
      </header>

      {screen === 'menu' && (
        <section className="menu-panel">
          <div className="eyebrow">SIGNAL COMMAND // {t.systemReady}</div>
          <h1>{t.title}</h1>
          <p className="lead">{t.subtitle}</p>
          <div className="mode-grid">
            <button className="mode-card primary-card" onClick={() => setScreen('campaign')}>
              <span className="mode-index">01</span>
              <strong>{t.campaign}</strong>
              <span>{t.campaignDescription}</span>
              <small>{Math.min(progress.unlockedMission, missions.length)} / {missions.length} {t.operationsUnlocked}</small>
            </button>
            <button className="mode-card" onClick={() => setScreen('free')}>
              <span className="mode-index">02</span>
              <strong>{t.freeRun}</strong>
              <span>{t.freeDescription}</span>
              <small>TRACE / BREACH / BLACK ICE</small>
            </button>
          </div>
          <div className="build">v0.1.0 // TYPESCRIPT MIGRATION</div>
        </section>
      )}

      {screen === 'campaign' && (
        <section className="content-panel">
          <div className="panel-head">
            <div><div className="eyebrow">SIGNAL COMMAND // {t.operations}</div><h2>{t.globalIncident}</h2></div>
            <button className="ghost" onClick={() => setScreen('menu')}>×</button>
          </div>
          <div className="mission-grid">
            {missions.map((mission) => {
              const unlocked = mission.id <= progress.unlockedMission
              return (
                <button className="mission-card" disabled={!unlocked} key={mission.id}>
                  <span>OP {String(mission.id).padStart(2, '0')}</span>
                  <strong>{mission.code}</strong>
                  <small>{mission.rows}×{mission.cols} / {mission.mines} {t.corruption}</small>
                  <em>{unlocked ? t.ready : t.locked}</em>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {screen === 'free' && (
        <section className="content-panel compact">
          <div className="panel-head">
            <div><div className="eyebrow">SIGNAL//BREACH</div><h2>{t.freeRun}</h2></div>
            <button className="ghost" onClick={() => setScreen('menu')}>×</button>
          </div>
          <div className="difficulty-grid">
            {['TRACE · 9×9 · 10', 'BREACH · 16×16 · 40', 'BLACK ICE · 16×30 · 99'].map((label) => <button key={label}>{label}</button>)}
          </div>
          <p className="migration-note">{t.migrationNote}</p>
        </section>
      )}
    </main>
  )
}
