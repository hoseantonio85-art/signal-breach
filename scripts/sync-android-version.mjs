import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'

// Native Android version is derived from the same package.json as the UI.
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)
assert(match, 'package.json version must be major.minor.patch')
const [, major, minor, patch] = match.map(Number)
assert(minor <= 999 && patch <= 999, 'minor and patch must be below 1000')
const versionCode = major * 1_000_000 + minor * 1_000 + patch
assert(versionCode > 0 && versionCode <= 2_100_000_000, 'versionCode outside Android range')

const gradle = new URL('../android/app/build.gradle', import.meta.url)
let source = readFileSync(gradle, 'utf8')
const codePattern = /\bversionCode\s+\d+\b/g
const namePattern = /\bversionName\s+["'][^"']+["']/g
assert.equal([...source.matchAll(codePattern)].length, 1, 'Expected exactly one Android versionCode')
assert.equal([...source.matchAll(namePattern)].length, 1, 'Expected exactly one Android versionName')
source = source.replace(codePattern, `versionCode ${versionCode}`)
source = source.replace(namePattern, `versionName "${version}"`)
writeFileSync(gradle, source, 'utf8')
console.log(`Android version: ${version} (versionCode ${versionCode})`)
