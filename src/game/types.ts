export type Cell = {
  row: number
  col: number
  mine: boolean
  revealed: boolean
  quarantined: boolean
  adjacent: number
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
}
