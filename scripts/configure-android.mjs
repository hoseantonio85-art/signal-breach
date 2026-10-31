import { writeFileSync } from 'node:fs'

// The permanent Android identifier is a product decision, not a guessed value.
const appId = process.env.SIGNAL_ANDROID_APP_ID?.trim()
if (!appId || !/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/.test(appId)) {
  console.error(
    'SIGNAL_ANDROID_APP_ID is required. Ask the owner to approve a unique reverse-DNS ID. ' +
    'Do not use a sample app ID as a release identifier.'
  )
  process.exit(1)
}

const config = { appId, appName: 'SIGNAL//BREACH', webDir: 'dist' }
writeFileSync('capacitor.config.json', JSON.stringify(config, null, 2) + '\n')
console.log('Generated local Capacitor config for ' + appId)
