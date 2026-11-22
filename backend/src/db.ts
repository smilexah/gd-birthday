import pg from 'pg'
import { config } from './config.js'

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

pool.on('error', (error) => {
  console.error('Postgres pool error:', error.message)
})

export type WishRow = {
  id: number
  number: number
  name: string
  workplace: string
  city: string | null
  text: string
  flavor: string
  lang: string
  status: string
  created_at: Date
  reports?: number
}

export const wishColumns = 'w.id, w.number, w.name, w.workplace, w.city, w.text, w.flavor, w.lang, w.status, w.created_at'

export function toWish(row: WishRow) {
  return {
    id: row.id,
    number: row.number,
    name: row.name,
    workplace: row.workplace,
    city: row.city,
    text: row.text,
    flavor: row.flavor,
    createdAt: row.created_at.toISOString(),
  }
}

export function toAdminWish(row: WishRow) {
  return {
    ...toWish(row),
    status: row.status,
    lang: row.lang,
    reports: row.reports ?? 0,
  }
}

export type Settings = {
  isOpen: boolean
  closesAt: string | null
  accepting: boolean
}

export async function getSettings(): Promise<Settings> {
  const result = await pool.query('SELECT is_open, closes_at FROM settings WHERE id = 1')
  const row = result.rows[0]
  const isOpen: boolean = row ? row.is_open : false
  const closesAt: Date | null = row ? row.closes_at : null
  const accepting = isOpen && (closesAt === null || Date.now() < closesAt.getTime())
  return {
    isOpen,
    closesAt: closesAt ? closesAt.toISOString() : null,
    accepting,
  }
}
