/**
 * Test-only typography switch for GitHub Pages preview:
 * /signal-breach/preview/?font=unbounded|tektur|russo
 * Display fonts are linked in index.html before the brief boot screen.
 * The production Android version must bundle approved font files locally.
 */
const choices = {
  unbounded: "'Unbounded'",
  tektur: "'Tektur'",
  russo: "'Russo One'",
} as const

// The approved display face is Unbounded. Other candidates remain accessible
// through ?font=tektur or ?font=russo for design comparison only.
const query = new URLSearchParams(window.location.search).get('font')
const selected = query && Object.prototype.hasOwnProperty.call(choices, query) ? query as keyof typeof choices : 'unbounded'
{
  const family = choices[selected]
  document.documentElement.dataset.displayFont = selected
  document.documentElement.style.setProperty('--signal-display-font', family)

}
