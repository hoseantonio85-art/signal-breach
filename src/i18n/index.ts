import { en } from './en'
import { ru } from './ru'

export type Language = 'ru' | 'en'
export const dictionaries = { ru, en } as const
