import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const file = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
const { version, scripts } = JSON.parse(file('package.json'))
assert.match(version, /^\d+\.\d+\.\d+$/)
assert.match(file('vite.config.ts'), /__APP_VERSION__:\s*JSON\.stringify\(appVersion\)/)
assert.match(file('src/app/App.tsx'), /__APP_VERSION__/)
assert.match(file('src/app/App.tsx'), /__BUILD_TARGET__/)
assert.match(file('.github/workflows/android-debug.yml'), /node scripts\/sync-android-version\.mjs/)
assert.match(file('scripts/sync-android-version.mjs'), /versionCode/)
assert.doesNotMatch(file('src/i18n/ru.ts') + file('src/i18n/en.ts'), /build:\s*['"]v\d/)
assert.match(scripts.build, /check:version/)
assert.match(scripts['build:android'], /check:version/)
console.log('OK: web UI and Android package version use package.json as one source.')
