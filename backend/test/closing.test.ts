import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import crypto from 'node:crypto'
import path from 'node:path'
import pg from 'pg'

const databaseUrl = process.env.TEST_DATABASE_URL ?? ''
const port = 3199
const base = `http://127.0.0.1:${port}`
const adminPassword = crypto.randomBytes(12).toString('hex')
const backendDir = path.join(import.meta.dirname, '..')

let server: ChildProcess | undefined
let cookie = ''
let ipCounter = 0
const events: Array<{ at: number; name: string; data: any }> = []
const sseAbort = new AbortController()

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function resetDatabase() {
  const client = new pg.Client({ connectionString: databaseUrl })
  await client.connect()
  const tables = await client.query("SELECT to_regclass('public.wishes') AS name")
  if (tables.rows[0].name) {
    await client.query('TRUNCATE reports, wishes RESTART IDENTITY')
    await client.query('ALTER SEQUENCE wish_number_seq RESTART WITH 1')
    await client.query("UPDATE settings SET is_open = true, closes_at = '2026-11-25 00:00:00+05' WHERE id = 1")
  }
  await client.end()
}

async function waitForServer() {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const response = await fetch(`${base}/api/health`)
      if (response.ok) {
        return
      }
    } catch {}
    await sleep(200)
  }
  throw new Error('Server did not start')
}

function sendWish(text: string) {
  ipCounter += 1
  return fetch(`${base}/api/wishes`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.20.${Math.floor(ipCounter / 250)}.${ipCounter % 250}` },
    body: JSON.stringify({ name: 'Тест', workplace: 'off', text: `${text} ${crypto.randomUUID()}`, flavor: 'V', lang: 'ru', website: '' }),
  })
}

async function putSettings(body: Record<string, unknown>) {
  const response = await fetch(`${base}/api/admin/settings`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify(body),
  })
  assert.equal(response.status, 200)
  return response.json()
}

async function getAdminSettings() {
  const response = await fetch(`${base}/api/admin/settings`, { headers: { cookie } })
  return response.json()
}

async function listenToEvents() {
  const response = await fetch(`${base}/api/events`, { signal: sseAbort.signal })
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  ;(async () => {
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) {
          return
        }
        buffer += decoder.decode(value, { stream: true })
        let end = buffer.indexOf('\n\n')
        while (end !== -1) {
          const block = buffer.slice(0, end)
          buffer = buffer.slice(end + 2)
          const name = block.match(/^event: (.+)$/m)
          const data = block.match(/^data: (.+)$/m)
          if (name && data) {
            events.push({ at: Date.now(), name: name[1], data: JSON.parse(data[1]) })
          }
          end = buffer.indexOf('\n\n')
        }
      }
    } catch {}
  })()
}

function settingsEventsSince(since: number) {
  return events.filter((event) => event.name === 'settings' && event.at >= since)
}

before(async () => {
  if (!databaseUrl) {
    return
  }
  await resetDatabase()
  server = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], {
    cwd: backendDir,
    env: {
      ...process.env,
      TZ: 'America/New_York',
      PORT: String(port),
      HOST: '127.0.0.1',
      DATABASE_URL: databaseUrl,
      ADMIN_LOGIN: 'admin',
      ADMIN_PASSWORD: adminPassword,
      SESSION_SECRET: crypto.randomBytes(24).toString('hex'),
      IP_HASH_SALT: crypto.randomBytes(24).toString('hex'),
      TRUST_PROXY: 'true',
      COOKIE_SECURE: 'false',
      STATIC_DIR: path.join(backendDir, 'missing-static'),
      LOG_LEVEL: 'warn',
    },
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  await waitForServer()
  const login = await fetch(`${base}/api/admin/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ login: 'admin', password: adminPassword }),
  })
  assert.equal(login.status, 204)
  cookie = (login.headers.get('set-cookie') ?? '').split(';')[0]
  await listenToEvents()
  await sleep(300)
})

after(async () => {
  sseAbort.abort()
  server?.kill('SIGTERM')
  await sleep(500)
  if (databaseUrl) {
    await resetDatabase()
  }
})

test('default deadline is midnight of 25.11.2026 in Astana', { skip: !databaseUrl }, async () => {
  const settings = await getAdminSettings()
  assert.equal(settings.closesAt, '2026-11-24T19:00:00.000Z')
  assert.equal(settings.accepting, true)
})

test('accepts until the last moment and refuses at the deadline', { skip: !databaseUrl }, async () => {
  const closesAt = Math.ceil(Date.now() / 1000) * 1000 + 3000
  await putSettings({ isOpen: true, closesAt: new Date(closesAt).toISOString() })
  await sleep(closesAt - 1000 - Date.now())
  const lastSecond = await sendWish('Последняя секунда')
  assert.equal(lastSecond.status, 201)
  await sleep(closesAt + 20 - Date.now())
  const atDeadline = await sendWish('Ровно в срок')
  assert.equal(atDeadline.status, 403)
  assert.equal((await atDeadline.json()).error, 'closed')
  await putSettings({ isOpen: true })
})

test('closes automatically one minute later and notifies SSE subscribers on time', { skip: !databaseUrl, timeout: 120000 }, async () => {
  const startedAt = Date.now()
  await putSettings({ isOpen: true, closesAt: new Date(startedAt + 5000).toISOString() })
  const closesAt = startedAt + 60000
  const updated = await putSettings({ closesAt: new Date(closesAt).toISOString() })
  assert.equal(updated.accepting, true)

  await sleep(8000)
  assert.equal(settingsEventsSince(startedAt).some((event) => event.data.accepting === false), false, 'old timer must be replaced')
  const beforeDeadline = await sendWish('До закрытия')
  assert.equal(beforeDeadline.status, 201)

  await sleep(closesAt + 1500 - Date.now())
  const closedEvent = settingsEventsSince(startedAt).find((event) => event.data.accepting === false)
  assert.ok(closedEvent, 'SSE subscriber did not get the closing event')
  assert.ok(closedEvent.at >= closesAt - 50, `event came too early: ${closedEvent.at - closesAt} ms`)
  assert.ok(closedEvent.at - closesAt < 1500, `event came late: ${closedEvent.at - closesAt} ms`)

  const afterDeadline = await sendWish('После закрытия')
  assert.equal(afterDeadline.status, 403)
  assert.equal((await afterDeadline.json()).error, 'closed')

  const adminSettings = await getAdminSettings()
  assert.equal(adminSettings.accepting, false)
  const stats = await (await fetch(`${base}/api/stats`)).json()
  assert.equal(stats.accepting, false)
})

test('manual reopening after the automatic close accepts wishes again', { skip: !databaseUrl }, async () => {
  const reopenedAt = Date.now()
  const reopened = await putSettings({ isOpen: true })
  assert.equal(reopened.accepting, true)
  assert.equal(reopened.closesAt, null)
  await sleep(300)
  assert.ok(settingsEventsSince(reopenedAt).some((event) => event.data.accepting === true))
  const wish = await sendWish('После ручного открытия')
  assert.equal(wish.status, 201)
  const stats = await (await fetch(`${base}/api/stats`)).json()
  assert.equal(stats.accepting, true)
})
