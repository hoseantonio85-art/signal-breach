/**
 * Test-only typography switch for GitHub Pages preview:
 * /signal-breach/preview/?font=unbounded|tektur|russo
 * The production Android version must bundle approved font files locally.
 */
const choices = {
  unbounded: "'Unbounded'",
  tektur: "'Tektur'",
  russo: "'Russo One'",
} as const

const query = new URLSearchParams(window.location.search).get('font')
if (query && Object.prototype.hasOwnProperty.call(choices, query)) {
  const family = choices[query as keyof typeof choices]
  document.documentElement.dataset.displayFont = query
  document.documentElement.style.setProperty('--signal-display-font', family)

  const sheet = document.createElement('link')
  sheet.rel = 'stylesheet'
  sheet.href = 'https://fonts.googleapis.com/css2?family=Russo+One&family=Tektur:wght@500;600;700;800&family=Unbounded:wght@500;600;700;800&display=swap'
  document.head.appendChild(sheet)
}
