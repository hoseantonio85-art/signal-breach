import type { Language } from '../game/types'
import { en } from './en'
import { ru } from './ru'

export type Dictionary = { [K in keyof typeof ru]: string }
export const dictionaries: Record<Language, Dictionary> = { ru, en }
