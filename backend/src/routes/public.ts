import crypto from 'node:crypto'
import type { FastifyInstance, FastifyReply } from 'fastify'
import { pool, toWish, getSettings, wishColumns, type WishRow } from '../db.js'
import { feedQuerySchema, wishSchema, idSchema, firstIssue, workplaces, type FeedQuery } from '../validation.js'
import { hashIp, sha256, createAuthorToken, normalizeForDuplicates, hasLink, hasProfanity } from '../spam.js'
import { cachedJson, clearCache } from '../cache.js'
import { addClient, removeClient, broadcast } from '../events.js'

export async function countVisible() {
  const result = await pool.query("SELECT count(*)::int AS total FROM wishes WHERE status = 'visible'")
  return result.rows[0].total as number
}

export async function announceStats() {
  broadcast('stats', { total: await countVisible() })
}

async function getPublicStats() {
  const result = await pool.query(
    "SELECT workplace, count(*)::int AS count FROM wishes WHERE status = 'visible' GROUP BY workplace",
  )
  const byWorkplace: Record<string, number> = {}
  for (const workplace of workplaces) {
    byWorkplace[workplace] = 0
  }
  let total = 0
  for (const row of result.rows) {
    byWorkplace[row.workplace] = row.count
    total += row.count
  }
  const settings = await getSettings()
  return { total, byWorkplace, accepting: settings.accepting, closesAt: settings.closesAt }
}

export function sendError(reply: FastifyReply, status: number, error: string, message: string, field?: string) {
  const body: Record<string, string> = { error, message }
  if (field) {
    body.field = field
  }
  return reply.code(status).send(body)
}

function sameHash(a: string, b: string) {
  const first = Buffer.from(a)
  const second = Buffer.from(b)
  return first.length === second.length && crypto.timingSafeEqual(first, second)
}

export async function publicRoutes(app: FastifyInstance) {
  app.get('/api/health', async () => {
    await pool.query('SELECT 1')
    return { ok: true }
  })

  app.get('/api/feed', async (request, reply) => {
    const parsed = feedQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      const issue = firstIssue(parsed.error)
      return sendError(reply, 400, 'validation', issue.message, issue.field)
    }
    const query = parsed.data
    const json = await cachedJson('feed:' + JSON.stringify(query), () => loadFeed(query))
    return reply.type('application/json; charset=utf-8').send(json)
  })

  async function loadFeed(query: FeedQuery) {
    const conditions = ["w.status = 'visible'"]
    const values: unknown[] = []
    if (query.filter !== 'all') {
      values.push(query.filter)
      conditions.push(`w.workplace = $${values.length}`)
    }
    if (query.city) {
      values.push(query.city)
      conditions.push(`lower(w.city) = lower($${values.length})`)
    }

    const useSince = query.cursor === undefined && query.since !== undefined
    if (useSince) {
      values.push(query.since)
      conditions.push(`w.number > $${values.length}`)
    } else if (query.cursor !== undefined) {
      values.push(query.cursor)
      conditions.push(`w.number < $${values.length}`)
    }
    values.push(query.limit + 1)
    const order = useSince ? 'ASC' : 'DESC'
    const sql = `SELECT ${wishColumns} FROM wishes w WHERE ${conditions.join(' AND ')} ORDER BY w.number ${order} LIMIT $${values.length}`
    const result = await pool.query<WishRow>(sql, values)

    const rows = result.rows.slice(0, query.limit)
    const hasMore = result.rows.length > query.limit
    return {
      items: rows.map(toWish),
      nextCursor: hasMore && !useSince ? rows[rows.length - 1].number : null,
    }
  }

  app.get('/api/stats', async (request, reply) => {
    const json = await cachedJson('stats', getPublicStats)
    return reply.type('application/json; charset=utf-8').send(json)
  })

  app.post('/api/wishes', { config: { rateLimit: { max: 30, timeWindow: '10 minutes' } } }, async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>

    if (body.website !== undefined && body.website !== null && String(body.website).trim() !== '') {
      const fakeNumber = 1000 + crypto.randomInt(9000)
      return reply.code(201).send({
        wish: {
          id: fakeNumber,
          number: fakeNumber,
          name: String(body.name ?? '').slice(0, 30),
          workplace: workplaces.includes(body.workplace as any) ? body.workplace : 'apt',
          city: null,
          text: String(body.text ?? '').slice(0, 500),
          flavor: 'V',
          createdAt: new Date().toISOString(),
        },
        authorToken: createAuthorToken(),
      })
    }

    const settings = await getSettings()
    if (!settings.accepting) {
      return sendError(reply, 403, 'closed', 'Wishes are not accepted anymore')
    }

    const parsed = wishSchema.safeParse(body)
    if (!parsed.success) {
      const issue = firstIssue(parsed.error)
      return sendError(reply, 400, 'validation', issue.message, issue.field)
    }
    const wish = parsed.data
    const city = wish.workplace === 'apt' || wish.workplace === 'fil' ? wish.city || null : null

    const fields: Array<[string, string | null]> = [
      ['name', wish.name],
      ['city', city],
      ['text', wish.text],
    ]
    for (const [field, value] of fields) {
      if (value && hasLink(value)) {
        return sendError(reply, 400, 'links', 'Links are not allowed', field)
      }
    }
    for (const [field, value] of fields) {
      if (value && hasProfanity(value)) {
        return sendError(reply, 400, 'profanity', 'Inappropriate words are not allowed', field)
      }
    }

    const ipHash = hashIp(request.ip)
    const textNormalized = normalizeForDuplicates(wish.text)

    const recent = await pool.query(
      `SELECT count(*)::int AS total FROM wishes WHERE ip_hash = $1 AND created_at > now() - interval '10 minutes'`,
      [ipHash],
    )
    if (recent.rows[0].total >= 30) {
      return sendError(reply, 429, 'rate_limited', 'Too many wishes from this address, try later')
    }

    const token = createAuthorToken()
    const inserted = await pool.query<WishRow>(
      `INSERT INTO wishes AS w (name, workplace, city, text, text_normalized, flavor, lang, author_token_hash, ip_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT DO NOTHING
       RETURNING ${wishColumns}`,
      [wish.name, wish.workplace, city, wish.text, textNormalized, wish.flavor, wish.lang, sha256(token), ipHash],
    )
    const row = inserted.rows[0]
    if (!row) {
      return sendError(reply, 409, 'duplicate', 'The same wish already exists')
    }

    const publicWish = toWish(row)
    broadcast('wish', publicWish)
    await announceStats()
    return reply.code(201).send({ wish: publicWish, authorToken: token })
  })

  app.delete('/api/wishes/:id', async (request, reply) => {
    const id = idSchema.safeParse((request.params as { id: string }).id)
    if (!id.success) {
      return sendError(reply, 404, 'not_found', 'Wish not found')
    }
    const settings = await getSettings()
    if (!settings.accepting) {
      return sendError(reply, 403, 'closed', 'Wishes are not accepted anymore')
    }
    const found = await pool.query(
      "SELECT status, author_token_hash FROM wishes WHERE id = $1 AND status <> 'deleted'",
      [id.data],
    )
    const wish = found.rows[0]
    if (!wish) {
      return sendError(reply, 404, 'not_found', 'Wish not found')
    }
    const token = request.headers['x-author-token']
    if (typeof token !== 'string' || token === '' || !sameHash(sha256(token), wish.author_token_hash)) {
      return sendError(reply, 403, 'forbidden', 'Wrong author token')
    }
    await pool.query("UPDATE wishes SET status = 'deleted' WHERE id = $1", [id.data])
    clearCache()
    if (wish.status === 'visible') {
      broadcast('removed', { id: id.data })
      await announceStats()
    }
    return reply.code(204).send()
  })

  app.post('/api/wishes/:id/report', { config: { rateLimit: { max: 20, timeWindow: '10 minutes' } } }, async (request, reply) => {
    const id = idSchema.safeParse((request.params as { id: string }).id)
    if (!id.success) {
      return sendError(reply, 404, 'not_found', 'Wish not found')
    }
    const found = await pool.query("SELECT id FROM wishes WHERE id = $1 AND status = 'visible'", [id.data])
    if (found.rowCount === 0) {
      return sendError(reply, 404, 'not_found', 'Wish not found')
    }
    await pool.query('INSERT INTO reports (wish_id, ip_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
      id.data,
      hashIp(request.ip),
    ])
    return reply.code(204).send()
  })

  app.get('/api/events', (request, reply) => {
    reply.hijack()
    const response = reply.raw
    response.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    response.write('retry: 5000\n\n')
    addClient(response)
    request.raw.on('close', () => removeClient(response))
  })
}
