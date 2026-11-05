import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const base = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8')
const visual = readFileSync(new URL('../src/styles/parity.css', import.meta.url), 'utf8')
const game = readFileSync(new URL('../src/screens/GameScreen.tsx', import.meta.url), 'utf8')

test('Scan mode restores original pink mark and cell background', () => {
  const normal = base.match(/\.cell\.flagged\{[^}]*\}/)?.[0] ?? ''
  assert.match(normal,/rgba\(255,79,216,.44\)/)
  assert.doesNotMatch(normal,/255,197,107/)
  const diamond = visual.match(/\.cell\.flagged::before\{[^}]*\}/)?.[0] ?? ''
  assert.match(diamond,/border:1\.5px solid var\(--pink\)/)
  assert.doesNotMatch(diamond,/#ffc56b/)
})

test('Quarantine mode paints marked cell and diamond amber', () => {
  const amber = base.match(/\.game-app\.mode-quarantine \.cell\.flagged\{[^}]*\}/)?.[0] ?? ''
  assert.match(amber,/rgba\(255,197,107,.62\)/)
  const diamond = visual.match(/\.game-app\.mode-quarantine \.cell\.flagged::before\{[^}]*\}/)?.[0] ?? ''
  assert.match(diamond,/#ffc56b/)
  assert.match(visual,/\.cell\.flagged::after\{[^}]*var\(--cyan\)/)
})

test('existing flags recolor when mode is switched; mode restores from save', () => {
  assert.match(game,/useState<InteractionMode>\(\(\) => initialSave\?\.interactionMode \?\? 'scan'\)/)
  assert.match(game,/function changeInteractionMode\(next: InteractionMode\) \{[\s\S]*?setInteractionMode\(next\)/)
  assert.match(game,/game-app mode-\$\{interactionMode\}/)
  assert.match(game,/cell\.quarantined\) classes\.push\('flagged'\)/)
})

test('confirmed mines stay red reticles in post-mortem, not amber', () => {
  assert.match(visual,/\.mine-core\{[^}]*var\(--danger\)/)
  assert.match(visual,/\.glitch-ready \.cell\.flagged\.revealed::before,[\s\S]*?display:none/)
  assert.match(visual,/\.game-app\.glitch-ready \.cell\.flagged\.revealed\{[^}]*background:rgba\(7,12,25,.88\)/)
  assert.match(game,/cell\.revealed && cell\.mine \? <span className="mine-core"/)
})

test('mines, flag mechanics and game state remain unchanged', () => {
  assert.match(game,/cell\.quarantined && !cell\.revealed \? <span className="flag-core"/)
  assert.doesNotMatch(game,/tentativeFlag|confirmedFlag|markKind/)
})
