import crypto from 'node:crypto'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { config } from '../config.js'
import { pool, toWish, toAdminWish, getSettings, wishColumns, type WishRow } from '../db.js'
import { loginSchema, adminListSchema, statusSchema, settingsSchema, idSchema, firstIssue, workplaces } from '../validation.js'
import { broadcast, announceSettings } from '../events.js'
import { clearCache } from '../cache.js'
import { buildWishesWorkbook, astanaDate } from '../excel.js'
import { announceStats, sendError } from './public.js'

const cookieName = 'gd_admin'
const sessionLifetimeSeconds = 12 * 60 * 60

const reportCount = '(SELECT count(*)::int FROM reports r WHERE r.wish_id = w.id)'

function sign(value: string) {
  return crypto.createHmac('sha256', config.sessionSecret).update(value).digest('hex')
}

function sameText(a: string, b: string) {
  const first = crypto.createHash('sha256').update(a).digest()
  const second = crypto.createHash('sha256').update(b).digest()
  return crypto.timingSafeEqual(first, second)
}

function createSessionToken() {
  const expiresAt = Date.now() + sessionLifetimeSeconds * 1000
  const payload = `${config.adminLogin}:${expiresAt}`
  return `${expiresAt}.${sign(payload)}`
}

function isValidSessionToken(token: string) {
  const [expiresText, signature] = token.split('.')
  if (!expiresText || !signature) {
    return false
  }
  const expiresAt = Number(expiresText)
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return false
  }
  return sameText(signature, sign(`${config.adminLogin}:${expiresAt}`))
}

function readCookie(request: FastifyRequest, name: string) {
  const header = request.headers.cookie
  if (!header) {
    return undefined
  }
  for (const part of header.split(';')) {
    const separator = part.indexOf('=')
    if (separator === -1) {
      continue
    }
    if (part.slice(0, separator).trim() === name) {
      return decodeURIComponent(part.slice(separator + 1).trim())
    }
  }
  return undefined
}

function sessionCookie(value: string, maxAge: number) {
  let cookie = `${cookieName}=${value}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`
  if (config.cookieSecure) {
    cookie += '; Secure'
  }
  return cookie
}

async function findAdminWish(id: number) {
  const result = await pool.query<WishRow>(
    `SELECT ${wishColumns}, ${reportCount} AS reports FROM wishes w WHERE w.id = $1 AND w.status <> 'deleted'`,
    [id],
  )
  return result.rows[0]
}

function parseId(request: FastifyRequest) {
  const parsed = idSchema.safeParse((request.params as { id: string }).id)
  return parsed.success ? parsed.data : undefined
}

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    if (request.routeOptions.url === '/api/admin/login') {
      return
    }
    const token = readCookie(request, cookieName)
    if (!token || !isValidSessionToken(token)) {
      return sendError(reply, 401, 'unauthorized', 'Login required')
    }
  })

  app.post('/login', { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }, async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return sendError(reply, 401, 'bad_credentials', 'Wrong login or password')
    }
    const loginOk = sameText(parsed.data.login, config.adminLogin)
    const passwordOk = sameText(parsed.data.password, config.adminPassword)
    if (!loginOk || !passwordOk) {
      return sendError(reply, 401, 'bad_credentials', 'Wrong login or password')
    }
    reply.header('Set-Cookie', sessionCookie(createSessionToken(), sessionLifetimeSeconds))
    return reply.code(204).send()
  })

  app.post('/logout', async (request, reply) => {
    reply.header('Set-Cookie', sessionCookie('', 0))
    return reply.code(204).send()
  })

  app.get('/me', async () => {
    return { login: config.adminLogin }
  })

  app.get('/stats', async () => {
    const counts = await pool.query(`
      SELECT
        count(*) FILTER (WHERE status <> 'deleted')::int AS total,
        count(*) FILTER (WHERE status = 'visible')::int AS visible,
        count(*) FILTER (WHERE status = 'hidden')::int AS hidden,
        count(*) FILTER (WHERE status <> 'deleted' AND EXISTS (SELECT 1 FROM reports r WHERE r.wish_id = w.id))::int AS reported
      FROM wishes w
    `)
    const byWorkplaceResult = await pool.query(
      "SELECT workplace, count(*)::int AS count FROM wishes WHERE status <> 'deleted' GROUP BY workplace",
    )
    const byDayResult = await pool.query(`
      SELECT to_char(created_at AT TIME ZONE 'UTC' + interval '5 hours', 'YYYY-MM-DD') AS day, count(*)::int AS count
      FROM wishes WHERE status <> 'deleted'
      GROUP BY day ORDER BY day
    `)
    const latestResult = await pool.query<WishRow>(
      `SELECT ${wishColumns}, ${reportCount} AS reports FROM wishes w
       WHERE w.status <> 'deleted' ORDER BY w.number DESC LIMIT 6`,
    )
    const byWorkplace: Record<string, number> = {}
    for (const workplace of workplaces) {
      byWorkplace[workplace] = 0
    }
    for (const row of byWorkplaceResult.rows) {
      byWorkplace[row.workplace] = row.count
    }
    const settings = await getSettings()
    return {
      ...counts.rows[0],
      byWorkplace,
      byDay: byDayResult.rows,
      latest: latestResult.rows.map(toAdminWish),
      accepting: settings.accepting,
      isOpen: settings.isOpen,
      closesAt: settings.closesAt,
    }
  })

  app.get('/wishes', async (request, reply) => {
    const parsed = adminListSchema.safeParse(request.query)
    if (!parsed.success) {
      const issue = firstIssue(parsed.error)
      return sendError(reply, 400, 'validation', issue.message, issue.field)
    }
    const query = parsed.data
    const conditions: string[] = []
    const values: unknown[] = []
    if (query.status === 'visible' || query.status === 'hidden') {
      values.push(query.status)
      conditions.push(`w.status = $${values.length}`)
    } else {
      conditions.push("w.status <> 'deleted'")
    }
    if (query.status === 'reported') {
      conditions.push('EXISTS (SELECT 1 FROM reports r WHERE r.wish_id = w.id)')
    }
    if (query.workplace !== 'all') {
      values.push(query.workplace)
      conditions.push(`w.workplace = $${values.length}`)
    }
    if (query.q) {
      values.push('%' + query.q.replace(/[\\%_]/g, (symbol) => '\\' + symbol) + '%')
      conditions.push(`(w.name ILIKE $${values.length} OR w.text ILIKE $${values.length})`)
    }
    const where = conditions.join(' AND ')
    const totalResult = await pool.query(`SELECT count(*)::int AS total FROM wishes w WHERE ${where}`, values)
    const offset = (query.page - 1) * query.pageSize
    const listResult = await pool.query<WishRow>(
      `SELECT ${wishColumns}, ${reportCount} AS reports FROM wishes w WHERE ${where}
       ORDER BY w.number DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, query.pageSize, offset],
    )
    return {
      items: listResult.rows.map(toAdminWish),
      total: totalResult.rows[0].total,
      page: query.page,
      pageSize: query.pageSize,
    }
  })

  app.patch('/wishes/:id', async (request, reply) => {
    const id = parseId(request)
    const parsed = statusSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      const issue = firstIssue(parsed.error)
      return sendError(reply, 400, 'validation', issue.message, issue.field)
    }
    const before = id ? await findAdminWish(id) : undefined
    if (!id || !before) {
      return sendError(reply, 404, 'not_found', 'Wish not found')
    }
    const newStatus = parsed.data.status
    await pool.query('UPDATE wishes SET status = $1 WHERE id = $2', [newStatus, id])
    const after = await findAdminWish(id)
    if (!after) {
      return sendError(reply, 404, 'not_found', 'Wish not found')
    }
    if (before.status !== newStatus) {
      if (newStatus === 'visible') {
        broadcast('wish', toWish(after))
      } else {
        broadcast('removed', { id })
      }
      await announceStats()
    }
    return toAdminWish(after)
  })

  app.delete('/wishes/:id', async (request, reply) => {
    const id = parseId(request)
    const found = id ? await pool.query('SELECT status FROM wishes WHERE id = $1', [id]) : undefined
    if (!id || !found || found.rowCount === 0) {
      return sendError(reply, 404, 'not_found', 'Wish not found')
    }
    const oldStatus = found.rows[0].status
    if (oldStatus !== 'deleted') {
      await pool.query("UPDATE wishes SET status = 'deleted' WHERE id = $1", [id])
      if (oldStatus === 'visible') {
        broadcast('removed', { id })
        await announceStats()
      } else {
        clearCache()
      }
    }
    return reply.code(204).send()
  })

  app.get('/reports', async () => {
    const result = await pool.query<WishRow>(
      `SELECT * FROM (
         SELECT ${wishColumns}, ${reportCount} AS reports FROM wishes w WHERE w.status <> 'deleted'
       ) AS list
       WHERE list.reports > 0
       ORDER BY list.reports DESC, list.number DESC`,
    )
    return { items: result.rows.map(toAdminWish) }
  })

  app.post('/wishes/:id/dismiss-reports', async (request, reply) => {
    const id = parseId(request)
    const found = id ? await findAdminWish(id) : undefined
    if (!id || !found) {
      return sendError(reply, 404, 'not_found', 'Wish not found')
    }
    await pool.query('DELETE FROM reports WHERE wish_id = $1', [id])
    return reply.code(204).send()
  })

  app.get('/settings', async () => {
    return getSettings()
  })

  app.put('/settings', async (request, reply) => {
    const parsed = settingsSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      const issue = firstIssue(parsed.error)
      return sendError(reply, 400, 'validation', issue.message, issue.field)
    }
    const current = await getSettings()
    const isOpen = parsed.data.isOpen ?? current.isOpen
    let closesAt = parsed.data.closesAt === undefined ? current.closesAt : parsed.data.closesAt
    const closesAtPassed = closesAt !== null && new Date(closesAt).getTime() <= Date.now()
    if (parsed.data.isOpen === true && parsed.data.closesAt === undefined && closesAtPassed) {
      closesAt = null
    }
    await pool.query('UPDATE settings SET is_open = $1, closes_at = $2, updated_at = now() WHERE id = 1', [isOpen, closesAt])
    const settings = await getSettings()
    clearCache()
    announceSettings(settings)
    return settings
  })

  app.get('/export.xlsx', async (request, reply) => {
    const file = await buildWishesWorkbook()
    const fileName = `gd-wishes-${astanaDate(new Date())}.xlsx`
    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    reply.header('Content-Disposition', `attachment; filename="${fileName}"`)
    reply.header('Cache-Control', 'no-store')
    return reply.send(file)
  })
}
