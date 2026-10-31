/**
 * Sound is a shared state in App and a single accessible UI component.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const app = read('src/app/App.tsx')
const game = read('src/screens/GameScreen.tsx')
const toggle = read('src/components/AudioToggle.tsx')
const styles = read('src/styles/parity.css')

assert.match(app, /const \[audioOn, setAudioOn\] = useState\(false\)/)
assert.match(app, /audioOn=\{audioOn\}/, 'Game inherits the actual app sound state')
assert.match(app, /<AudioToggle enabled=\{audioOn\} onToggle=\{toggleAudio\} t=\{t\} variant="menu"\s*\/>/)
assert.match(game, /<AudioToggle enabled=\{audioOn\} onToggle=\{onAudioToggle\} t=\{t\} variant="game"\s*\/>/)
assert.match(toggle, /aria-pressed=\{enabled\}/)
assert.match(toggle, /aria-label=\{label\}/)
assert.match(toggle, /enabled\s*\?\s*<Volume2[^>]*>[\s\S]*:\s*<VolumeX/)
assert.match(toggle, /audio-toggle \$\{enabled \? 'active' : ''\}/)
assert.match(styles, /\.chip-btn\.audio-toggle\.active\s*\{[^}]*color:\s*var\(--cyan\)/)
assert.match(styles, /\.chip-btn\.audio-toggle\.active\s*>\s*svg\s*\{[^}]*drop-shadow/)
console.log('OK: the shared audio toggle is consistent across all screens.')
