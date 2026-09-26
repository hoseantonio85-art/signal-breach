import type { Language } from '../i18n'

const LANGUAGE_KEY = 'signal_breach_language'

export function loadLanguage(): Language {
  const stored = localStorage.getItem(LANGUAGE_KEY)
  return stored === 'en' ? 'en' : 'ru'
}

export function saveLanguage(language: Language) {
  localStorage.setItem(LANGUAGE_KEY, language)
}
