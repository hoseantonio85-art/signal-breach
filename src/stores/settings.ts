import type { Language } from '../game/types'

const LANGUAGE_KEY = 'signal_breach_language'

export function loadLanguage(): Language {
  return localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'ru'
}

export function saveLanguage(language: Language) {
  localStorage.setItem(LANGUAGE_KEY, language)
}
