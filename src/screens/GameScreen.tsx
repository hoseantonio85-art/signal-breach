import { useEffect, useMemo, useRef, useState } from 'react'
import { House, RotateCcw } from 'lucide-react'
import { AudioToggle } from '../components/AudioToggle'
import { audioEngine } from '../audio/audioEngine'
import {
  chord,
  countQuarantined,
  countRevealedSafe,
  createBoard,
  generateBoard,
  findExplodedCell,
  isWon,
  neighbors,
  reveal,
  revealMines,
  safeCellCount,
  toggleQuarantine,
} from '../game/engine'
import type { Board, GamePhase, GameSession, InteractionMode, Language } from '../game/types'
import type { Dictionary } from '../i18n'
import { clearActiveSession, makeActiveSession, writeActiveSession, type ActiveSession } from '../stores/activeSession'
import { formatResultShareText, shareResultText, type ShareOutcome } from '../utils/shareResult'

export type CampaignResult = {
  missionId: number
  score: number
  rank: string
  time: number
}

type Props = {
  session: GameSession
  initialSave: ActiveSession | null
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
  initialSave,
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
  const [board, setBoard] = useState<Board>(() => initialSave?.board ?? createBoard(session.rows, session.cols, session.mines))
  const [phase, setPhase] = useState<GamePhase>(() => initialSave?.phase ?? 'idle')
  const [interactionMode, setInteractionMode] = useState<InteractionMode>(() => initialSave?.interactionMode ?? 'scan')
  const [elapsed, setElapsed] = useState(() => Math.floor((initialSave?.elapsedMs ?? 0) / 1000))
  const [log, setLog] = useState(initialSave ? t.sessionRestored : session.kind === 'campaign' ? t.operationReady : t.awaiting)
  const [lossCoord, setLossCoord] = useState('')
  const [result, setResult] = useState<{ score: number; rank: string; time: number } | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [shareFeedback, setShareFeedback] = useState<Extract<ShareOutcome, 'copied' | 'failed'> | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  // Keep accumulated time separate from the running clock. Time outside the app is free.
  const elapsedMsRef = useRef(initialSave?.elapsedMs ?? 0)
  const startedAt = useRef<number | null>(initialSave?.phase === 'running' && !document.hidden ? performance.now() : null)
  const boardRef = useRef(board)
  const phaseRef = useRef(phase)
  const interactionModeRef = useRef(interactionMode)
  const lastStoredSecond = useRef(-1)
  const longPress = useRef<{ key: string; timer: number; x: number; y: number; ready: boolean } | null>(null)
  const suppressClick = useRef<{ key: string; expires: number } | null>(null)

  const quarantined = useMemo(() => countQuarantined(board), [board])
  const revealedSafe = useMemo(() => countRevealedSafe(board), [board])
  const totalSafe = useMemo(() => safeCellCount(board), [board])
  const integrity = totalSafe ? Math.round((revealedSafe / totalSafe) * 100) : 0
  const remaining = Math.max(0, session.mines - quarantined)

  function elapsedMilliseconds() {
    return Math.max(0, Math.floor(elapsedMsRef.current
      + (startedAt.current === null ? 0 : performance.now() - startedAt.current)))
  }

  function switchPhase(next: GamePhase) {
    phaseRef.current = next
    setPhase(next)
  }

  function persistCurrent() {
    const active = phaseRef.current
    const currentBoard = boardRef.current
    if ((active === 'running' || active === 'idle')
      && (currentBoard.generated || currentBoard.cells.some((cell) => cell.quarantined))) {
      writeActiveSession(makeActiveSession(
        session, currentBoard, active, interactionModeRef.current, elapsedMilliseconds(),
      ))
    }
  }

  function updateBoard(next: Board) {
    boardRef.current = next
    setBoard(next)
    persistCurrent()
  }

  function changeInteractionMode(next: InteractionMode) {
    interactionModeRef.current = next
    setInteractionMode(next)
    persistCurrent()
  }

  useEffect(() => {
    if (phase !== 'running') return
    const timer = window.setInterval(() => {
      const seconds = Math.floor(elapsedMilliseconds() / 1000)
      setElapsed(seconds)
      if (seconds > 0 && seconds % 5 === 0 && lastStoredSecond.current !== seconds) {
        lastStoredSecond.current = seconds
        persistCurrent()
      }
    }, 250)
    return () => window.clearInterval(timer)
  }, [phase])

  useEffect(() => {
    const background = () => {
      if (startedAt.current !== null) {
        elapsedMsRef.current = elapsedMilliseconds()
        startedAt.current = null
        setElapsed(Math.floor(elapsedMsRef.current / 1000))
      }
      persistCurrent()
    }
    const foreground = () => {
      if (!document.hidden && phaseRef.current === 'running' && startedAt.current === null) {
        startedAt.current = performance.now()
      }
    }
    const onVisibilityChange = () => document.hidden ? background() : foreground()
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', background)
    window.addEventListener('blur', background)
    window.addEventListener('focus', foreground)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', background)
      window.removeEventListener('blur', background)
      window.removeEventListener('focus', foreground)
    }
  }, [session])

  useEffect(() => {
    // A restored game keeps its recovery message; other text is localized normally.
    setLog(initialSave ? t.sessionRestored : session.kind === 'campaign' ? t.operationReady : t.awaiting)
  }, [language, session.kind, t.awaiting, t.operationReady, t.sessionRestored, initialSave])

  function resetGame() {
    elapsedMsRef.current = 0
    startedAt.current = null
    setElapsed(0)
    switchPhase('idle')
    interactionModeRef.current = 'scan'
    setInteractionMode('scan')
    const freshBoard = createBoard(session.rows, session.cols, session.mines)
    boardRef.current = freshBoard
    setBoard(freshBoard)
    clearActiveSession()
    setLossCoord('')
    setResult(null)
    setShareFeedback(null)
    setLog(session.kind === 'campaign' ? t.operationReady : t.awaiting)
  }

  function requestRestart() {
    if (phaseRef.current === 'running' || boardRef.current.cells.some((cell) => cell.quarantined)) {
      setConfirmReset(true)
    } else {
      resetGame()
    }
  }

  function finishLoss(nextBoard: Board, row: number, col: number) {
    const seconds = Math.floor(elapsedMilliseconds() / 1000)
    // Chording can detonate a neighboring mine rather than the tapped number.
    const hitCell = findExplodedCell(nextBoard) ?? { row, col }
    setElapsed(seconds)
    startedAt.current = null
    setLossCoord(coord(hitCell.row, hitCell.col))
    setBoard(revealMines(nextBoard, hitCell.row, hitCell.col))
    switchPhase('lost')
    clearActiveSession()
    setLog(t.signalLost)
    audioEngine.ui('loss')
  }

  function finishWin(nextBoard: Board) {
    const seconds = Math.floor(elapsedMilliseconds() / 1000)
    const score = scoreFor(session, seconds)
    const rank = rankFor(session.mission?.parSeconds ?? Math.max(45, session.mines * 4), seconds)
    const completedBoard: Board = {
      ...nextBoard,
      cells: nextBoard.cells.map((cell) => cell.mine ? { ...cell, quarantined: true } : cell),
    }
    setBoard(completedBoard)
    setElapsed(seconds)
    startedAt.current = null
    setResult({ score, rank, time: seconds })
    switchPhase('won')
    clearActiveSession()
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
      elapsedMsRef.current = 0
      startedAt.current = document.hidden ? null : performance.now()
      switchPhase('running')
      setLog(language === 'ru' ? `HANDSHAKE // узел ${coord(row, col)} принят.` : `HANDSHAKE // node ${coord(row, col)} accepted.`)
      audioEngine.ui('start')
    }

    const target = working.cells[row * working.cols + col]
    let revealResult
    if (target.revealed && target.adjacent > 0) {
      const nearby = neighbors(working, row, col)
      const marked = nearby.filter((cell) => cell.quarantined).length
      if (marked !== target.adjacent) {
        updateBoard(working)
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

    if (isWon(revealResult.board)) {
      finishWin(revealResult.board)
      return
    }

    updateBoard(revealResult.board)
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
    updateBoard(next)
    const after = next.cells[key]
    setLog(after.quarantined ? t.quarantineOn : t.quarantineOff)
    audioEngine.ui('flag')
  }

  function activateCell(row: number, col: number) {
    if (interactionMode === 'quarantine') quarantineCell(row, col)
    else scanCell(row, col)
  }

  // Recognise a long press while held, but change the board only on pointer release.
  function pointerDown(event: React.PointerEvent, row: number, col: number) {
    if (event.pointerType !== 'touch' || !event.isPrimary) return
    const previous = longPress.current
    if (previous) window.clearTimeout(previous.timer)

    const key = `${row}:${col}`
    const timer = window.setTimeout(() => {
      if (longPress.current?.key === key) longPress.current.ready = true
    }, 430)
    longPress.current = { key, timer, x: event.clientX, y: event.clientY, ready: false }
  }

  function pointerMove(event: React.PointerEvent) {
    const press = longPress.current
    if (!press || event.pointerType !== 'touch') return
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 12) {
      window.clearTimeout(press.timer)
      suppressClick.current = { key: press.key, expires: performance.now() + 700 }
      longPress.current = null
    }
  }

  function pointerEnd(event: React.PointerEvent, row: number, col: number) {
    // Browser contextmenu may open on right-button down. We suppress it and
    // quarantine only when the right mouse button is released.
    if (event.pointerType === 'mouse') {
      if (event.button === 2) quarantineCell(row, col)
      return
    }
    if (event.pointerType !== 'touch') return

    const press = longPress.current
    if (!press) return
    window.clearTimeout(press.timer)
    longPress.current = null
    if (press.key !== `${row}:${col}`) return

    const rect = event.currentTarget.getBoundingClientRect()
    const inside = event.clientX >= rect.left && event.clientX <= rect.right
      && event.clientY >= rect.top && event.clientY <= rect.bottom
    if (!inside) {
      suppressClick.current = { key: press.key, expires: performance.now() + 700 }
      return
    }
    if (!press.ready) return

    suppressClick.current = { key: press.key, expires: performance.now() + 700 }
    quarantineCell(row, col)
    navigator.vibrate?.(22)
  }

  function pointerCancel() {
    const press = longPress.current
    if (!press) return
    window.clearTimeout(press.timer)
    suppressClick.current = { key: press.key, expires: performance.now() + 700 }
    longPress.current = null
  }

  function handleClick(row: number, col: number) {
    const key = `${row}:${col}`
    const suppressed = suppressClick.current
    suppressClick.current = null
    if (suppressed?.key === key && performance.now() <= suppressed.expires) return
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
    setShareFeedback(null)
    const missionLabel = session.mission ? `OP ${String(session.mission.id).padStart(2, '0')} // ${session.mission.code}` : session.label
    const text = formatResultShareText(missionLabel, result.rank, result.score, formatTime(result.time))
    const outcome = await shareResultText(text, t.shareResult)
    if (outcome === 'copied' || outcome === 'failed') setShareFeedback(outcome)
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
          <div className="brand-line"><span className="brand-mark" />SIGNAL // BREACH</div>
          <div className="brand-sub">relay recovery / anomaly isolation protocol</div>
        </div>
        <div className="game-top-actions">
          {session.kind === 'campaign' && session.mission && (
            <button className="chip-btn operation-chip" onClick={() => { persistCurrent(); onOperations() }}><span className="dot active-dot" />OP {String(session.mission.id).padStart(2, '0')} / 10</button>
          )}
          <AudioToggle enabled={audioOn} onToggle={onAudioToggle} t={t} variant="game" />
          <button type="button" className="chip-btn restart-chip" onClick={requestRestart} aria-label={t.newSession}><RotateCcw size={17} strokeWidth={1.8} aria-hidden="true" /><span className="restart-label">{t.newSession}</span></button>
          <button type="button" className="chip-btn menu-chip" onClick={() => { persistCurrent(); onMenu() }} aria-label={t.menu}><House size={17} strokeWidth={1.8} aria-hidden="true" /><span className="menu-label">{t.menu}</span></button>
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
              <div className="coords-top"><span>{t.nodeMap} / X:{String(revealedSafe).padStart(2, '0')}</span><span>{t.gridLabel} {String(session.rows).padStart(2, '0')}{t.gridSeparator}{String(session.cols).padStart(2, '0')}</span></div>
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
                      onContextMenu={(event: { preventDefault(): void }) => event.preventDefault()}
                      onPointerDown={(event: React.PointerEvent) => pointerDown(event, cell.row, cell.col)}
                      onPointerMove={pointerMove}
                      onPointerUp={(event: React.PointerEvent) => pointerEnd(event, cell.row, cell.col)}
                      onPointerCancel={pointerCancel}
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
                {phase === 'lost' && <button className="state-close" type="button" onClick={() => switchPhase('review')} aria-label={t.close}>×</button>}
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
                  {phase === 'won' && <button type="button" className="secondary" onClick={shareResult}>{t.shareResult}</button>}
                </div>
                {phase === 'won' && shareFeedback && (
                  <div className="share-feedback" role="status" aria-live="polite">
                    {shareFeedback === 'copied' ? t.shareCopied : t.shareFailed}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {phase === 'review' ? (
          <div className="review-modebar"><span className="review-dot" /><span>{t.mapReview}</span></div>
        ) : phase !== 'won' ? (
          <div className="mobile-modebar">
            <button className={`mode-toggle ${interactionMode === 'scan' ? 'active' : ''}`} onClick={() => changeInteractionMode('scan')}>{t.scan}</button>
            <button className={`mode-toggle ${interactionMode === 'quarantine' ? 'active' : ''}`} onClick={() => changeInteractionMode('quarantine')}>{t.quarantine}</button>
          </div>
        ) : null}

        <div className="terminal-foot"><div className="log">{log}</div><div className="foot-meta">{t.protocol}</div></div>
      </section>

      {confirmReset && (
        <div className="modal-layer" role="presentation">
          <section className="help-card session-replace-dialog" role="dialog" aria-modal="true" aria-label={t.resetSessionTitle}>
            <div className="state-kicker">SIGNAL // BREACH</div>
            <h2>{t.resetSessionTitle}</h2>
            <p>{t.resetSessionDescription}</p>
            <div className="session-replace-actions">
              <button className="secondary" type="button" onClick={() => setConfirmReset(false)}>{t.back}</button>
              <button className="primary" type="button" onClick={() => { setConfirmReset(false); resetGame() }}>{t.newSession}</button>
            </div>
          </section>
        </div>
      )}

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
