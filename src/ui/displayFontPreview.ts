/**
 * Test-only typography switch for GitHub Pages preview:
 * /signal-breach/preview/?font=unbounded|tektur|russo
 * Approved Unbounded is now local; diagnostic Tektur/Russo are web-only.
 */
const choices = {
  unbounded: "'Unbounded Variable'",
  tektur: "'Tektur'",
  russo: "'Russo One'",
} as const

// Android always uses approved local font; the ?font= experiment is web-only.
const query = new URLSearchParams(window.location.search).get('font')
const selected = import.meta.env.MODE === 'android'
  ? 'unbounded'
  : query && Object.prototype.hasOwnProperty.call(choices, query)
    ? query as keyof typeof choices
    : 'unbounded'

document.documentElement.dataset.displayFont = selected
document.documentElement.style.setProperty('--signal-display-font', choices[selected])
