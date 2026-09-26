import type { Mission } from '../game/types'

export const missions: Mission[] = [
  { id: 1, code: 'WAKE PROTOCOL', rows: 8, cols: 8, mines: 8, parSeconds: 45 },
  { id: 2, code: 'GHOST PACKET', rows: 9, cols: 9, mines: 10, parSeconds: 65 },
  { id: 3, code: 'GLASS HARBOR', rows: 10, cols: 10, mines: 16, parSeconds: 90 },
  { id: 4, code: 'NIGHT GRID', rows: 11, cols: 11, mines: 22, parSeconds: 120 },
  { id: 5, code: 'PALE ORBIT', rows: 12, cols: 12, mines: 28, parSeconds: 150 },
  { id: 6, code: 'DEAD CURRENT', rows: 13, cols: 13, mines: 35, parSeconds: 190 },
  { id: 7, code: 'CHOIR SIGNATURE', rows: 14, cols: 14, mines: 45, parSeconds: 230 },
  { id: 8, code: 'MIRROR GATE', rows: 15, cols: 15, mines: 55, parSeconds: 280 },
  { id: 9, code: 'BLACK ICE', rows: 16, cols: 16, mines: 65, parSeconds: 340 },
  { id: 10, code: 'ZERO SIGNAL', rows: 16, cols: 18, mines: 80, parSeconds: 420 },
]
