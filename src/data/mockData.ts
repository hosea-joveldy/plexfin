import { contentRows } from './mock-rows'

export const mockContentRows = contentRows.map((row) => ({
  ...row,
  type: row.id === 'continue-watching' ? 'continue_watching' : row.id,
}))
