import fs from 'node:fs'
import path from 'node:path'
import { pool } from './db.js'

const migrationsDir = path.join(import.meta.dirname, '..', 'migrations')

async function waitForDatabase(log: (message: string) => void) {
  for (let attempt = 1; attempt <= 15; attempt++) {
    try {
      await pool.query('SELECT 1')
      return
    } catch (error) {
      if (attempt === 15) {
        throw error
      }
      log(`Database is not ready (attempt ${attempt}), retrying in 2 s`)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }
}

export async function runMigrations(log: (message: string) => void) {
  await waitForDatabase(log)
  const client = await pool.connect()
  try {
    await client.query('SELECT pg_advisory_lock(20261124)')
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    const appliedResult = await client.query('SELECT name FROM schema_migrations')
    const applied = new Set(appliedResult.rows.map((row) => row.name))
    const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort()
    for (const file of files) {
      if (applied.has(file)) {
        continue
      }
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      try {
        await client.query('BEGIN')
        await client.query(sql)
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file])
        await client.query('COMMIT')
        log(`Migration applied: ${file}`)
      } catch (error) {
        await client.query('ROLLBACK')
        throw new Error(`Migration ${file} failed: ${(error as Error).message}`)
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(20261124)').catch(() => {})
    client.release()
  }
}
