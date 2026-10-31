/**
 * Lightweight structural regression test for card layouts. For true visual
 * proof, test the responsive preview in a browser at the QA breakpoints.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const file = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const app = file('src/app/App.tsx')
const card = file('src/components/MissionCard.tsx')
const css = file('src/components/MissionCard.css')
const otherCards = file('src/styles/card-layout.css')
const globalCss = file('src/styles/global.css')

assert.match(app, /missions\.map\([\s\S]*?<MissionCard[\s\S]*?\/\>/,
  'Campaign must render the extracted MissionCard component')
assert.doesNotMatch(app, /className=["'`].*mission-card/,
  'Keep mission card markup out of the App screen')
assert.match(card, /<div className="mission-card-top">[\s\S]*?<strong className="mission-card-title">[\s\S]*?<div className="mission-card-footer">/,
  'Card layout must have explicit header, title and footer zones')
assert.match(card, /className="mission-card-details"/,
  'Metric belongs inside the card footer')
assert.match(card, /className="mission-status"/,
  'Status belongs inside the card footer')

const block = (source, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return source.match(new RegExp(escaped + '\\s*\\{([^}]+)\\}'))?.[1] ?? ''
}

assert.match(block(css, '.campaign-panel .mission-card'), /display:\s*flex/,
  'Mission card must be a flex column')
assert.match(block(css, '.campaign-panel .mission-card'), /flex-direction:\s*column/,
  'Mission card must stack its three zones')
assert.match(block(css, '.campaign-panel .mission-card-footer'), /margin-top:\s*auto/,
  'Footer must be anchored to card bottom')
assert.match(block(css, '.campaign-panel .mission-card .mission-card-details'), /min-height:\s*2\.8em/,
  'Reserve same two-line metric slot on all cards')
assert.match(block(otherCards, '.mode-grid > .mode-card'), /display:\s*flex/,
  'Menu mode cards must allow bottom-aligned footers')
assert.match(block(otherCards, '.difficulty-cards > .difficulty-card > em'), /margin-top:\s*auto/,
  'Free Run density caption must stay at bottom')
assert.doesNotMatch(globalCss, /mission-card\.completed:after/,
  'Do not re-introduce diagonal RESTORED ribbons')

console.log('OK: campaign, menu and Free Run cards have stable footer layouts.')
