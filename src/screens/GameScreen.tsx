import { useEffect, useMemo, useRef, useState } from 'react'
import { audioEngine } from '../audio/audioEngine'
import {
  chord,
  countQuarantined,
  countRevealedSafe,
  createBoard,
  generateBoard,
  isWon,
  neighbors,
  reveal,
  revealMines,
  safeCellCount,
  toggleQuarantine,
} from '../game/engine'
import type { Board, GamePhase, GameSession, InteractionMode, Language } from '../game/types'
import type { Dictionary } from '../i18n'

export type CampaignResult = {
  missionId: number
  score: number
  rank: string
  time: number
}

type Props = {
  session: GameSession
  language: Language
  t: Dictionary
  audioOn: boolean
  onAudioToggle: () => void
  onLanguageChange: (language: Language) => void
  onMenu: () => void
  onOperations: () => void
  onNextMission: (missionId: number) => void
  onCampaignWin: (result: CampaignResult) => void
}

const interpolate = (template: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), template)

const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
const coord = (row: number, col: number) => `${String(row + 1).padStart(2, '0')}-${String(col + 1).padStart(2, '0')}`

function rankFor(par: number, seconds: number) {
  const ratio = seconds / Math.max(1, par)
  if (ratio <= .72) return 'S'
  if (ratio <= 1) return 'A'
  if (ratio <= 1.35) return 'B'
  return 'C'
}

function scoreFor(session: GameSession, seconds: number) {
  const par = session.mission?.parSeconds ?? Math.max(45, session.mines * 4)
  const speedBonus = Math.max(0, par - seconds) * 30
  const overtime = Math.max(0, seconds - par) * 14
  return Math.max(500, Math.round(5000 + session.mines * 95 + speedBonus - overtime))
}

export function GameScreen({
  session,
  language,
  t,
  audioOn,
  onAudioToggle,
  onLanguageChange,
  onMenu,
  onOperations,
  onNextMission,
  onCampaignWin,
}: Props) {
  void onLanguageChange
  const [board, setBoard] = useState<Board>(() => createBoard(session.rows, session.cols, session.mines))
  const [phase, setPhase] = useState<GamePhase>('idle')
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('scan')
  const [elapsed, setElapsed] = useState(0)
  const [log, setLog] = useState(session.kind === 'campaign' ? t.operationReady : t.awaiting)
  const [lossCoord, setLossCoord] = useState('')
  const [result, setResult] = useState<{ score: number; rank: string; time: number } | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const startedAt = useRef<number | null>(null)
  const longPress = useRef<{ key: string; timer: number; x: number; y: number } | null>(null)
  const suppressClick = useRef<string | null>(null)

  const quarantined = useMemo(() => countQuarantined(board), [board])
  const revealedSafe = useMemo(() => countRevealedSafe(board), [board])
  const totalSafe = useMemo(() => safeCellCount(board), [board])
  const integrity = totalSafe ? Math.round((revealedSafe / totalSafe) * 100) : 0
  const remaining = Math.max(0, session.mines - quarantined)

  useEffect(() => {
    if (phase !== 'running') return
    const timer = window.setInterval(() => {
      if (startedAt.current != null) setElapsed(Math.floor((performance.now() - startedAt.current) / 1000))
    }, 250)
    return () => window.clearInterval(timer)
  }, [phase])

  useEffect(() => {
    setLog(session.kind === 'campaign' ? t.operationReady : t.awaiting)
  }, [language, session.kind, t.awaiting, t.operationReady])

  function resetGame() {
    startedAt.current = null
    setElapsed(0)
    setPhase('idle')
    setInteractionMode('scan')
    setBoard(createBoard(session.rows, session.cols, session.mines))
    setLossCoord('')
    setResult(null)
    setLog(session.kind === 'campaign' ? t.operationReady : t.awaiting)
  }

  function finishLoss(nextBoard: Board, row: number, col: number) {
    const seconds = startedAt.current == null ? elapsed : Math.floor((performance.now() - startedAt.current) / 1000)
    setElapsed(seconds)
    setLossCoord(coord(row, col))
    setBoard(revealMines(nextBoard, row, col))
    setPhase('lost')
    setLog(t.signalLost)
    audioEngine.ui('loss')
  }

  function finishWin(nextBoard: Board) {
    const seconds = startedAt.current == null ? elapsed : Math.floor((performance.now() - startedAt.current) / 1000)
    const score = scoreFor(session, seconds)
    const rank = rankFor(session.mission?.parSeconds ?? Math.max(45, session.mines * 4), seconds)
    const completedBoard: Board = {
      ...nextBoard,
      cells: nextBoard.cells.map((cell) => cell.mine ? { ...cell, quarantined: true } : cell),
    }
    setBoard(completedBoard)
    setElapsed(seconds)
    setResult({ score, rank, time: seconds })
    setPhase('won')
    setLog(t.signalStable)
    audioEngine.ui('win')
    if (session.kind === 'campaign' && session.mission) {
      onCampaignWin({ missionId: session.mission.id, score, rank, time: seconds })
    }
  }

  function scanCell(row: number, col: number) {
    if (phase === 'won' || phase === 'lost' || phase === 'review') return
    let working = board
    if (!working.generated) {
      working = generateBoard(working, row, col)
      startedAt.current = performance.now()
      setPhase('running')
      setLog(language === 'ru' ? `HANDSHAKE // узел ${coord(row, col)} принят.` : `HANDSHAKE // node ${coord(row, col)} accepted.`)
      audioEngine.ui('start')
    }

    const target = working.cells[row * working.cols + col]
    let revealResult
    if (target.revealed && target.adjacent > 0) {
      const nearby = neighbors(working, row, col)
      const marked = nearby.filter((cell) => cell.quarantined).length
      if (marked !== target.adjacent) {
        setBoard(working)
        setLog(t.mismatch)
        audioEngine.ui('tick')
        return
      }
      revealResult = chord(working, row, col)
    } else {
      revealResult = reveal(working, row, col)
    }

    if (revealResult.hitMine) {
      finishLoss(revealResult.board, row, col)
      return
    }

    setBoard(revealResult.board)
    if (isWon(revealResult.board)) {
      finishWin(revealResult.board)
      return
    }

    const opened = revealResult.board.cells[row * revealResult.board.cols + col]
    if (opened?.revealed) setLog(opened.adjacent === 0 ? t.cleanZero : t.cleanNear)
    audioEngine.ui(revealResult.revealedDelta > 1 ? 'cascade' : 'reveal', revealResult.revealedDelta)
  }

  function quarantineCell(row: number, col: number) {
    if (phase === 'won' || phase === 'lost' || phase === 'review') return
    const key = row * board.cols + col
    const before = board.cells[key]
    if (!before || before.revealed) return
    const next = toggleQuarantine(board, row, col)
    setBoard(next)
    const after = next.cells[key]
    setLog(after.quarantined ? t.quarantineOn : t.quarantineOff)
    audioEngine.ui('flag')
  }

  function activateCell(row: number, col: number) {
    if (interactionMode === 'quarantine') quarantineCell(row, col)
    else scanCell(row, col)
  }

  function pointerDown(event: React.PointerEvent, row: number, col: number) {
    if (event.pointerType !== 'touch') return
    const key = `${row}:${col}`
    const timer = window.setTimeout(() => {
      suppressClick.current = key
      quarantineCell(row, col)
      navigator.vibrate?.(22)
    }, 430)
    longPress.current = { key, timer, x: event.clientX, y: event.clientY }
  }

  function pointerMove(event: React.PointerEvent) {
    const press = longPress.current
    if (!press || event.pointerType !== 'touch') return
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 12) {
      window.clearTimeout(press.timer)
      suppressClick.current = press.key
      longPress.current = null
    }
  }

  function pointerEnd() {
    const press = longPress.current
    if (!press) return
    window.clearTimeout(press.timer)
    longPress.current = null
  }

  function handleClick(row: number, col: number) {
    const key = `${row}:${col}`
    if (suppressClick.current === key) {
      suppressClick.current = null
      return
    }
    activateCell(row, col)
  }

  function cellLabel(row: number, col: number) {
    const cell = board.cells[row * board.cols + col]
    if (cell.quarantined) return language === 'ru' ? `Узел ${coord(row, col)}, карантин` : `Node ${coord(row, col)}, quarantined`
    if (!cell.revealed) return language === 'ru' ? `Узел ${coord(row, col)}, не просканирован` : `Node ${coord(row, col)}, not scanned`
    if (cell.mine) return language === 'ru' ? `Узел ${coord(row, col)}, заражение` : `Node ${coord(row, col)}, corruption`
    return language === 'ru' ? `Узел ${coord(row, col)}, чистый` : `Node ${coord(row, col)}, clean`
  }

  async function shareResult() {
    if (!result) return
    const missionLabel = session.mission ? `OP ${String(session.mission.id).padStart(2, '0')} // ${session.mission.code}` : session.label
    const text = `SIGNAL//BREACH — ${missionLabel} — ${result.rank} / ${result.score} / ${formatTime(result.time)}`
    try {
      if (navigator.share) await navigator.share({ title: 'SIGNAL//BREACH', text })
      else await navigator.clipboard.writeText(text)
    } catch {
      // Native share can be cancelled by the user; no error UI is necessary.
    }
  }

  const campaignTitle = session.mission ? `OP ${String(session.mission.id).padStart(2, '0')} // ${session.mission.code}` : session.label
  const resultCopy = session.kind === 'campaign' && session.mission ? session.mission.debrief[language] : t.freeWin
  const cellMin = session.cols <= 9 ? 38 : session.cols <= 12 ? 42 : 44
  const boardScrollable = session.rows > 9 || session.cols > 9

  return (
    <main className={`game-app ${phase === 'lost' || phase === 'review' ? 'glitch-ready' : ''}`}>
      <div className="scanlines" />
      <header className="game-topbar">
        <div className="game-brand">
          <div className="brand-line"><span className="brand-mark" />SIGNAL//BREACH</div>
          <div className="brand-sub">relay recovery / anomaly isolation protocol</div>
        </div>
        <div className="game-top-actions">
          {session.kind === 'campaign' && session.mission && (
            <button className="chip-btn operation-chip" onClick={onOperations}><span className="dot active-dot" />OP {String(session.mission.id).padStart(2, '0')} / 10</button>
          )}
          <button className={`chip-btn audio-chip ${audioOn ? 'active' : ''}`} onClick={onAudioToggle}><span className="dot" /><span className="audio-label">{audioOn ? t.audioOn : t.audioOff}</span></button>
          <button className="chip-btn restart-chip" onClick={resetGame} aria-label={t.newSession}><span className="restart-icon">↻</span><span className="restart-label">{t.newSession}</span></button>
          <button className="chip-btn menu-chip" onClick={onMenu}><span>⌂</span><span className="menu-label">{t.menu}</span></button>
        </div>
      </header>

      <section className="terminal">
        <div className="terminal-head">
          <div className="terminal-title">
            <div className="title-code">{campaignTitle}</div>
            <div className="status"><span className={`status-led ${phase === 'lost' || phase === 'review' ? 'lost' : ''}`} /><span>{phase === 'lost' || phase === 'review' ? t.signalLost : phase === 'won' ? t.signalStable : t.linkActive}</span></div>
          </div>
          <div className="terminal-controls"><button className="help-btn" onClick={() => setHelpOpen(true)} aria-label={t.helpTitle}>?</button></div>
        </div>

        <div className="hud">
          <div className="metric"><div className="metric-label">{t.corruptNodes}</div><div className="metric-value"><span>{remaining}</span><span className="metric-unit">{t.estimated}</span></div></div>
          <div className="metric"><div className="metric-label">{t.traceTime}</div><div className="metric-value"><span>{formatTime(elapsed)}</span></div></div>
          <div className="metric"><div className="metric-label">{t.integrity}</div><div className="metric-value"><span>{phase === 'won' ? 100 : integrity}%</span></div><div className="integrity-bar"><i style={{ width: `${phase === 'won' ? 100 : integrity}%` }} /></div></div>
        </div>

        <div className={`game-content ${boardScrollable ? 'pannable-map' : ''}`}>
          <div className="board-shell">
            <div className="board-wrap">
              <div className="coords-top"><span>{t.nodeMap} / X:{String(revealedSafe).padStart(2, '0')}</span><span>GRID {String(session.rows).padStart(2, '0')}×{String(session.cols).padStart(2, '0')}</span></div>
              <div className="board" role="grid" aria-label={t.nodeMap} style={{ gridTemplateColumns: `repeat(${session.cols}, minmax(${cellMin}px, 1fr))` }}>
                {board.cells.map((cell) => {
                  const classes = ['cell']
                  if (cell.revealed) classes.push('revealed')
                  if (cell.quarantined) classes.push('flagged')
                  if (cell.exploded) classes.push('exploded')
                  if (cell.revealed && !cell.mine && cell.adjacent) classes.push(`n${cell.adjacent}`)
                  return (
                    <button
                      key={`${cell.row}:${cell.col}`}
                      type="button"
                      role="gridcell"
                      className={classes.join(' ')}
                      aria-label={cellLabel(cell.row, cell.col)}
                      onClick={() => handleClick(cell.row, cell.col)}
                      onContextMenu={(event: { preventDefault(): void }) => { event.preventDefault(); quarantineCell(cell.row, cell.col) }}
                      onPointerDown={(event: React.PointerEvent) => pointerDown(event, cell.row, cell.col)}
                      onPointerMove={pointerMove}
                      onPointerUp={pointerEnd}
                      onPointerCancel={pointerEnd}
                    >
                      {cell.revealed && cell.mine ? <span className="mine-core" aria-hidden="true" /> : null}
                      {cell.quarantined && !cell.revealed ? <span className="flag-core" aria-hidden="true" /> : null}
                      {cell.revealed && !cell.mine && cell.adjacent > 0 ? cell.adjacent : null}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {boardScrollable && (
            <div className="pan-hints" aria-hidden="true">
              <span className="pan-hint pan-top">⌃</span>
              <span className="pan-hint pan-right">›</span>
              <span className="pan-hint pan-bottom">⌄</span>
              <span className="pan-hint pan-left">‹</span>
            </div>
          )}

          {(phase === 'lost' || phase === 'won') && (
            <div className="state-overlay show">
              <div className="state-card">
                {phase === 'lost' && <button className="state-close" type="button" onClick={() => setPhase('review')} aria-label={t.close}>×</button>}
                <div className="state-kicker">{session.kind === 'campaign' && session.mission ? `OP ${String(session.mission.id).padStart(2, '0')} / ${phase === 'lost' ? 'BREACH' : 'SIGNAL RESTORED'}` : `RELAY 07 / ${session.label}`}</div>
                <div className={`state-title ${phase === 'lost' ? 'loss' : 'win'}`}>{phase === 'lost' ? t.breachDetected : t.restoreComplete}</div>
                <div className="state-copy">{phase === 'lost' ? interpolate(session.kind === 'campaign' ? t.campaignLoss : t.freeLoss, { coord: lossCoord }) : resultCopy}</div>
                {phase === 'won' && result && (
                  <div className="state-stats show">
                    <div className="result-stat rank"><b>{t.rank}</b><span>{result.rank}</span></div>
                    <div className="result-stat"><b>{t.score}</b><span>{result.score.toLocaleString('en-US')}</span></div>
                    <div className="result-stat"><b>{t.time}</b><span>{formatTime(result.time)}</span></div>
                  </div>
                )}
                <div className="state-actions">
                  {phase === 'lost' ? (
                    <button className="primary" onClick={resetGame}>{session.kind === 'campaign' ? t.retryOperation : t.retrySession}</button>
                  ) : session.kind === 'campaign' && session.mission && session.mission.id < 10 ? (
                    <button className="primary" onClick={() => onNextMission(session.mission!.id + 1)}>{t.nextOperation}</button>
                  ) : (
                    <button className="primary" onClick={session.kind === 'campaign' ? onOperations : resetGame}>{session.kind === 'campaign' ? t.operations : t.retrySession}</button>
                  )}
                  <button className="secondary" onClick={session.kind === 'campaign' ? onOperations : onMenu}>{session.kind === 'campaign' ? t.operations : t.menu}</button>
                  {phase === 'won' && <button className="secondary" onClick={shareResult}>{t.shareResult}</button>}
                </div>
              </div>
            </div>
          )}
        </div>

        {phase === 'review' ? (
          <div className="review-modebar"><span className="review-dot" /><span>{t.mapReview}</span></div>
        ) : phase !== 'won' ? (
          <div className="mobile-modebar">
            <button className={`mode-toggle ${interactionMode === 'scan' ? 'active' : ''}`} onClick={() => setInteractionMode('scan')}>{t.scan}</button>
            <button className={`mode-toggle ${interactionMode === 'quarantine' ? 'active' : ''}`} onClick={() => setInteractionMode('quarantine')}>{t.quarantine}</button>
          </div>
        ) : null}

        <div className="terminal-foot"><div className="log">{log}</div><div className="foot-meta">{t.protocol}</div></div>
      </section>

      {helpOpen && (
        <div className="modal-layer" onMouseDown={() => setHelpOpen(false)}>
          <section className="help-card" onMouseDown={(event: { stopPropagation(): void }) => event.stopPropagation()}>
            <button className="state-close" onClick={() => setHelpOpen(false)}>×</button>
            <div className="state-kicker">SIGNAL COMMAND</div>
            <h2>{t.helpTitle}</h2>
            <p>{t.helpCopy}</p>
          </section>
        </div>
      )}
    </main>
  )
}
