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
const metricCss = file('src/components/MissionMetrics.css')
const metricComponent = file('src/components/MissionMetrics.tsx')
const otherCards = file('src/styles/card-layout.css')
const globalCss = file('src/styles/global.css')

assert.match(app, /missions\.map\([\s\S]*?<MissionCard[\s\S]*?\/\>/,
  'Campaign must render the extracted MissionCard component')
assert.doesNotMatch(app, /className=["'`].*mission-card/,
  'Keep mission card markup out of the App screen')
assert.match(card, /<div className="mission-card-top">[\s\S]*?<strong className="mission-card-title">[\s\S]*?<div className="mission-card-footer">/,
  'Card layout must have explicit header, title and footer zones')
assert.match(card, /<MissionMetrics[^>]*rows=\{mission\.rows\}[^>]*cols=\{mission\.cols\}[^>]*mines=\{mission\.mines\}/,
  'Mission card must use the shared localized metrics component')
assert.match(metricComponent, /className="mission-metrics-grid"/,
  'Metrics component must have one grid row')
assert.match(metricComponent, /className="mission-metrics-corruption"/,
  'Metrics component must have one corruption row')

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
assert.match(block(css, '.campaign-panel .mission-card-top'), /flex:\s*0 0 20px/,
  'Every card header must occupy the same fixed height, with or without a completion icon')
assert.match(block(css, '.campaign-panel .mission-card-top'), /height:\s*20px/,
  'Header must be aligned to the top with a stable height')
assert.match(block(css, '.campaign-panel .mission-card .mission-card-top > span'), /color:\s*var\(--cyan\)/,
  'OP numbers must retain the original cyan regardless of mission status')
for (const status of ['ready', 'completed', 'locked']) {
  assert.doesNotMatch(css, new RegExp('mission-card\\.status-' + status + '[^\\{]*mission-card-top\\s*>\\s*span'),
    'Do not recolor operation numbers for individual statuses')
}
assert.match(block(css, '.campaign-panel .mission-card.status-ready'), /--mission-status-color:\s*var\(--pink\)/,
  'READY must use the synthwave pink accent')
assert.match(block(css, '.campaign-panel .mission-card.status-completed'), /--mission-status-color:\s*var\(--cyan\)/,
  'COMPLETED must use cyan')
assert.doesNotMatch(css, /#7dffb2|125,255,178/,
  'Do not reintroduce the old green palette into mission cards')
assert.match(block(css, '.campaign-panel .mission-card-footer'), /margin-top:\s*auto/,
  'Footer must be anchored to card bottom')
assert.match(block(metricCss, '.campaign-panel .mission-card .mission-metrics-card'), /min-height:\s*2\.8em/,
  'Reserve exactly two metric rows in Campaign cards')
assert.match(block(metricCss, '.campaign-panel .mission-card .mission-metrics-card'), /display:\s*flex/,
  'Use a deterministic layout for metric rows')
assert.match(block(metricCss, '.campaign-panel .mission-card .mission-metrics-card'), /flex-direction:\s*column/,
  'The two labeled metric rows must always be stacked')
assert.match(block(metricCss, '.campaign-panel .mission-card .mission-metrics-card > span'), /white-space:\s*nowrap/,
  'Labeled values must never wrap internally')
assert.match(block(metricCss, '.briefing-grid .mission-metrics-briefing'), /display:\s*contents/,
  'Briefing keeps separate metric pills and the existing PAR item')

assert.match(block(otherCards, '.mode-grid > .mode-card'), /display:\s*flex/,
  'Menu mode cards must allow bottom-aligned footers')
assert.match(block(otherCards, '.difficulty-cards > .difficulty-card > em'), /margin-top:\s*auto/,
  'Free Run density caption must stay at bottom')
assert.doesNotMatch(globalCss, /mission-card\.completed:after/,
  'Do not re-introduce diagonal RESTORED ribbons')

console.log('OK: campaign, menu and Free Run cards have stable footer layouts.')
