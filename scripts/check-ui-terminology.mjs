/**
 * Keep operation metrics consistently label-first throughout the game.
 * Narrative copy may still naturally mention corruption/corrupted nodes.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const en = read('src/i18n/en.ts')
const ru = read('src/i18n/ru.ts')
const app = read('src/app/App.tsx')
const missionCard = read('src/components/MissionCard.tsx')
const metrics = read('src/components/MissionMetrics.tsx')
const game = read('src/screens/GameScreen.tsx')

assert.match(en, /const bugCountLabel = 'BUGS'/)
assert.match(en, /gridLabel: 'GRID'/)
assert.match(en, /gridSeparator: '×'/)
assert.match(en, /corruption:\s*bugCountLabel/)
assert.match(en, /corruptNodes:\s*bugCountLabel/)

assert.match(ru, /const corruptionCountLabel = 'ЗАРАЖЕНИЕ'/)
assert.match(ru, /gridLabel: 'СЕТКА'/)
assert.match(ru, /gridSeparator: ' на '/)
assert.match(ru, /corruption:\s*corruptionCountLabel/)
assert.match(ru, /corruptNodes:\s*corruptionCountLabel/)

assert.match(metrics, /\{t\.gridLabel\}&nbsp;\{rows\}\{t\.gridSeparator\}\{cols\}/,
  'Grid label precedes dimensions and uses the localized separator')
assert.match(metrics, /\{t\.corruption\}&nbsp;\{mines\}/,
  'Corruption label precedes number with an inseparable space')
assert.match(missionCard, /<MissionMetrics[^>]*rows=\{mission\.rows\}[^>]*cols=\{mission\.cols\}[^>]*mines=\{mission\.mines\}/,
  'Campaign card uses shared labeled metrics')
assert.match(app, /<MissionMetrics[^>]*rows=\{preset\.rows\}[^>]*variant="free"/,
  'Free Run uses shared labeled metrics')
assert.match(app, /<MissionMetrics[^>]*rows=\{selectedMission\.rows\}[^>]*variant="briefing"/,
  'Briefing uses shared labeled metrics')
assert.match(game, /\{t\.gridLabel\} \{String\(session\.rows\)/,
  'Active board grid label is localized too')
assert.match(game, /\{t\.corruptNodes\}/,
  'Active HUD uses the same localized corruption label')

assert.doesNotMatch(app + missionCard, /\{(?:mission|preset|selectedMission)\.mines\}\s*\{t\.corruption\}/,
  'Do not revive the old number-first count format')
assert.doesNotMatch(en, /\bcorruptions\b|\bCORRUPT NODES\b/,
  'Do not revive old competing English counter labels')

console.log('OK: localized GRID and BUGS / ЗАРАЖЕНИЕ labels are consistent.')
