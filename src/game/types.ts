export type Language = 'ru' | 'en'

export type Cell = {
  row: number
  col: number
  mine: boolean
  revealed: boolean
  quarantined: boolean
  adjacent: number
  exploded?: boolean
}

export type Board = {
  rows: number
  cols: number
  mineCount: number
  cells: Cell[]
  generated: boolean
}

export type Mission = {
  id: number
  code: string
  rows: number
  cols: number
  mines: number
  parSeconds: number
  location: Record<Language, string>
  briefing: Record<Language, string>
  debrief: Record<Language, string>
}

export type GameSession = {
  kind: 'campaign' | 'free'
  label: string
  rows: number
  cols: number
  mines: number
  mission?: Mission
}

export type GamePhase = 'idle' | 'running' | 'won' | 'lost' | 'review'
export type InteractionMode = 'scan' | 'quarantine'
