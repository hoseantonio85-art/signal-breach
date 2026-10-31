/**
 * Prevent copy differences between English corrupted-node counters.
 * Narrative text may still describe corruption; only numeric UI labels are
 * unified. No test dependencies required.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const en = read('src/i18n/en.ts')
const app = read('src/app/App.tsx')
const game = read('src/screens/GameScreen.tsx')

assert.match(en, /const bugCountLabel = 'BUGS'/,
  'English bug count must have one shared label')
assert.match(en, /corruption:\s*bugCountLabel/,
  'Campaign / briefing / Free Run must read the shared bug count label')
assert.match(en, /corruptNodes:\s*bugCountLabel/,
  'Game HUD must use the same shared bug count label')

assert.match(app, /mission\.mines\}\s*\{t\.corruption\}/,
  'Campaign cards must use the localized count label')
assert.match(app, /selectedMission\.mines\}\s*\{t\.corruption\}/,
  'Mission briefing must use the localized count label')
assert.match(app, /preset\.mines\}\s*\{t\.corruption\}/,
  'Free Run presets must use the localized count label')
assert.match(game, /\{t\.corruptNodes\}/,
  'Active game HUD must use the localized count label')

assert.doesNotMatch(app, /language\s*===\s*'en'\s*\?\s*['"]BUGS['"]/,
  'Do not hard-code English translations in JSX')
assert.doesNotMatch(en, /\bcorruptions\b|\bCORRUPT NODES\b/,
  'Old competing count label is not allowed in English localization')

console.log('OK: English numeric labels use the same BUGS terminology.')
