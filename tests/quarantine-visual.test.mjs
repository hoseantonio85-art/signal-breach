import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const base=readFileSync(new URL('../src/styles/global.css',import.meta.url),'utf8')
const visual=readFileSync(new URL('../src/styles/parity.css',import.meta.url),'utf8')
const game=readFileSync(new URL('../src/screens/GameScreen.tsx',import.meta.url),'utf8')

test('quarantine hypothesis is amber and uses the existing cyan center dot',()=>{
  assert.match(base,/\.cell\.flagged\{[^}]*rgba\(255,197,107,.62\)/)
  const diamond=visual.match(/\.cell\.flagged::before\{[^}]*\}/)?.[0]??''
  assert.match(diamond,/#ffc56b/)
  assert.doesNotMatch(diamond,/var\(--pink\)|var\(--danger\)/)
  assert.match(visual,/\.cell\.flagged::after\{[^}]*var\(--cyan\)/)
})
test('confirmed mine remains a red reticle rather than an amber diamond',()=>{
  assert.match(visual,/\.mine-core\{[^}]*var\(--danger\)/)
  assert.match(visual,/\.glitch-ready \.cell\.flagged\.revealed::before,[\s\S]*?display:none/)
  assert.match(visual,/\.glitch-ready \.cell\.flagged\.revealed\{[^}]*background:rgba\(7,12,25,.88\)/)
  assert.match(game,/cell\.quarantined\) classes\.push\('flagged'\)/)
  assert.match(game,/cell\.revealed && cell\.mine \? <span className="mine-core"/)
})
test('no new game flags or mine-count semantics introduced',()=>{
  assert.match(game,/cell\.quarantined && !cell\.revealed \? <span className="flag-core"/)
  assert.doesNotMatch(game,/tentativeFlag|confirmedFlag|markKind/)
})
