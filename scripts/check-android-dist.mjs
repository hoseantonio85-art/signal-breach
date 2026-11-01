import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import assert from 'node:assert/strict'

const html = readFileSync('dist/index.html', 'utf8')
const assetsDir = 'dist/assets'
const assets = readdirSync(assetsDir)

assert(!html.includes('fonts.googleapis.com'), 'Android HTML references remote fonts')
assert(!html.includes('fonts.gstatic.com'), 'Android HTML references remote fonts')
assert(!html.includes('/signal-breach/'), 'Android still has the Pages base path')
assert(html.includes('./assets/'), 'Android assets do not use relative URLs')
assert(assets.some((file) => file.endsWith('.woff2')), 'No local WOFF2 included in Android')
assert(assets.some((file) => file.endsWith('.js')), 'No JavaScript bundle found')
assert(assets.some((file) => file.endsWith('.css')), 'No CSS bundle found')

for (const file of assets.filter((name) => name.endsWith('.css'))) {
  const css = readFileSync(join(assetsDir, file), 'utf8')
  assert(!/https?:\/\//i.test(css), 'Remote URL in Android CSS: ' + file)
  assert(!/url\(\s*['"]?\//i.test(css), 'Absolute URL in Android CSS: ' + file)
}
console.log('Android offline bundle verified: relative URLs, local WOFF2, no remote CSS fonts')
