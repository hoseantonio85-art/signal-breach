import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const base = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8')
const visual = readFileSync(new URL('../src/styles/parity.css', import.meta.url), 'utf8')
const game = readFileSync(new URL('../src/screens/GameScreen.tsx', import.meta.url), 'utf8')
const engine = readFileSync(new URL('../src/game/engine.ts', import.meta.url), 'utf8')

test('Scan-confirmed cells have the original pink mark, independent of active mode', () => {
  const normal = base.match(/\.cell\.flagged\{[^}]*\}/)?.[0] ?? ''
  assert.match(normal,/rgba\(255,79,216,.44\)/)
  const diamond = visual.match(/\.cell\.flagged::before\{[^}]*\}/)?.[0] ?? ''
  assert.match(diamond,/border:1\.5px solid var\(--pink\)/)
  assert.match(game,/classes\.push\(cell\.markOrigin === 'quarantine' \? 'flagged-tentative' : 'flagged-confirmed'\)/)
})

test('quarantine hypotheses use an amber diamond and amber cell background simultaneously', () => {
  const amber = base.match(/\.cell\.flagged\.flagged-tentative\{[^}]*\}/)?.[0] ?? ''
  assert.match(amber,/rgba\(255,197,107,.62\)/)
  const diamond = visual.match(/\.cell\.flagged\.flagged-tentative::before\{[^}]*\}/)?.[0] ?? ''
  assert.match(diamond,/#ffc56b/)
  assert.match(visual,/\.cell\.flagged::after\{[^}]*var\(--cyan\)/)
})

test('mode switch never changes existing marks; creation passes stored origin to engine', () => {
  assert.doesNotMatch(game,/game-app mode-\$\{interactionMode\}/)
  assert.doesNotMatch(base,/\.game-app\.mode-quarantine \.cell\.flagged/)
  assert.doesNotMatch(visual,/\.game-app\.mode-quarantine \.cell\.flagged::before/)
  assert.match(game,/toggleQuarantine\(board, row, col, interactionModeRef\.current\)/)
  assert.match(engine,/markOrigin: 'scan' \| 'quarantine' = 'scan'/)
  assert.match(game,/useState<InteractionMode>\(\(\) => initialSave\?\.interactionMode \?\? 'scan'\)/)
})

test('post-mortem actual mines remain red reticles regardless of mark source', () => {
  assert.match(visual,/\.mine-core\{[^}]*var\(--danger\)/)
  assert.match(visual,/\.glitch-ready \.cell\.flagged\.revealed::before,[\s\S]*?display:none/)
  assert.match(visual,/\.game-app\.glitch-ready \.cell\.flagged\.revealed\{[^}]*background:rgba\(7,12,25,.88\)/)
  assert.match(game,/cell\.revealed && cell\.mine \? <span className="mine-core"/)
})

test('Scan long press and Quarantine tap use distinct mark origins without extra buttons', () => {
  assert.match(game,/if \(interactionMode === 'quarantine'\) quarantineCell\(row, col\)/)
  assert.match(game,/if \(event\.button === 2\) quarantineCell\(row, col\)/)
  assert.match(game,/quarantineCell\(row, col\)\s+navigator\.vibrate/)
  assert.match(game,/cell\.quarantined && !cell\.revealed \? <span className="flag-core"/)
  assert.doesNotMatch(game,/tentativeFlag|confirmedFlag/)
})
