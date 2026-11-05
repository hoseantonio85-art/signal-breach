import { mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

// IMPORTANT: CI runners otherwise sign every build with a different ephemeral key.
// The encrypted GitHub Actions secret is required before a tester APK is generated.
// It contains a private *debug* keystore. It must never be committed or uploaded.
const b64 = process.env.SIGNAL_BREACH_DEBUG_KEYSTORE_B64
if (!b64 || b64.length < 1000) {
  console.error('ERROR: Persistent Android debug signing is not configured.')
  console.error('Set GitHub Actions secret SIGNAL_BREACH_DEBUG_KEYSTORE_B64.')
  console.error('No APK will be published until this is configured (issue #7).')
  process.exit(1)
}
if (!/^[A-Za-z0-9+/\s=]+$/.test(b64)) {
  console.error('ERROR: Invalid base64-encoded signing keystore.')
  process.exit(1)
}
const bytes = Buffer.from(b64.replace(/\s/g, ''), 'base64')
if (bytes.length < 1000 || bytes.length > 100000) {
  console.error('ERROR: Unexpected debug signing keystore size.')
  process.exit(1)
}
const dir = join(homedir(), '.android')
mkdirSync(dir, { recursive: true })
const target = join(dir, 'debug.keystore')
writeFileSync(target, bytes, { mode: 0o600 })
console.log('Persistent Android TEST signing identity supplied to build (no key contents logged).')
