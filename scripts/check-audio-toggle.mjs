/**
 * Audio enablement is a single app-level state. Every sound control must
 * render the same icon and highlighted state on the menu and in-game HUD.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const app = read('src/app/App.tsx')
const game = read('src/screens/GameScreen.tsx')
const styles = read('src/styles/parity.css')

assert.match(app, /const \[audioOn, setAudioOn\] = useState\(false\)/,
  'Sound enabled state lives in the top-level App')
assert.match(app, /audioOn=\{audioOn\}/,
  'Game inherits the actual app-wide sound state')

for (const [name, markup] of [['menu', app], ['game', game]]) {
  assert.match(markup, /audio-toggle \$\{audioOn \? 'active' : ''\}/,
    `The ${name} sound button must share the active style hook`)
  assert.match(markup, /aria-pressed=\{audioOn\}/,
    `The ${name} sound button must announce on\/off state`)
  assert.match(markup, /audioOn \? <Volume2[^>]*>.*?: <VolumeX/,
    `The ${name} sound button must use the same two icons`)
}
assert.match(styles, /\.chip-btn\.audio-toggle\.active\s*\{[^}]*color:\s*var\(--cyan\)/,
  'The enabled state must be cyan on both screens')
assert.match(styles, /\.chip-btn\.audio-toggle\.active\s*>\s*svg\s*\{[^}]*drop-shadow/,
  'An enabled sound icon must glow on both screens')
console.log('OK: audio state, pressed semantics and active glow match on all screens.')
