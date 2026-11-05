import { writeFileSync } from 'node:fs'

// Owner approved on 2026-11-01. Stable package identity across all Android builds.
const appId = 'com.hoseantonio85.signalbreach'
const config = { appId, appName: 'SIGNAL//BREACH', webDir: 'dist' }

writeFileSync('capacitor.config.json', JSON.stringify(config, null, 2) + '\n')
console.log('Generated local Capacitor config for ' + appId)
