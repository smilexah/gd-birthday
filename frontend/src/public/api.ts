export type Workplace = 'apt' | 'fil' | 'off' | 'log' | 'reg'
export type Flavor = 'V' | 'B' | 'C' | 'G'

export interface Wish {
  id: number
  number: number
  name: string
  workplace: Workplace
  city: string | null
  text: string
  flavor: Flavor
  createdAt: string
}

export interface FeedPage {
  items: Wish[]
  nextCursor: number | null
}

export interface Stats {
  total: number
  accepting: boolean
}

export interface NewWish {
  name: string
  workplace: Workplace
  city: string
  text: string
  flavor: Flavor
  lang: string
  website: string
}

export interface CreatedWish {
  wish: Wish
  authorToken: string
}

export class ApiError extends Error {
  code: string
  field: string

  constructor(code: string, field = '') {
    super(code)
    this.code = code
    this.field = field
  }
}

export function errorKey(error: unknown) {
  const code = error instanceof ApiError ? error.code : 'unknown'
  const field = error instanceof ApiError ? error.field : ''
  if (code === 'validation') {
    return field === 'name' ? 'errors.name' : 'errors.validation'
  }
  if (code === 'links') {
    return 'errors.links'
  }
  if (code === 'profanity') {
    return 'errors.profanity'
  }
  if (code === 'duplicate') {
    return 'errors.duplicate'
  }
  if (code === 'closed') {
    return 'errors.closed'
  }
  if (code === 'rate_limited') {
    return 'errors.rateLimited'
  }
  if (code === 'network') {
    return 'errors.network'
  }
  return 'errors.unknown'
}

async function send(url: string, options: RequestInit = {}): Promise<Response> {
  let response: Response
  try {
    response = await fetch(url, options)
  } catch {
    throw new ApiError('network')
  }
  if (response.ok) {
    return response
  }
  if (response.status === 429) {
    throw new ApiError('rate_limited')
  }
  let body: { error?: unknown; field?: unknown } | null = null
  try {
    body = await response.json()
  } catch {
    body = null
  }
  if (body && typeof body.error === 'string') {
    throw new ApiError(body.error, typeof body.field === 'string' ? body.field : '')
  }
  throw new ApiError(response.status >= 500 ? 'network' : 'unknown')
}

export async function fetchFeed(filter: string, cursor: number | null, since: number | null = null): Promise<FeedPage> {
  const params = new URLSearchParams()
  params.set('filter', filter)
  params.set('limit', '50')
  if (cursor !== null) {
    params.set('cursor', String(cursor))
  }
  if (since !== null) {
    params.set('since', String(since))
  }
  const response = await send('/api/feed?' + params.toString())
  const page = await response.json()
  return {
    items: Array.isArray(page.items) ? page.items : [],
    nextCursor: typeof page.nextCursor === 'number' ? page.nextCursor : null
  }
}

export async function fetchStats(): Promise<Stats> {
  const response = await send('/api/stats')
  const stats = await response.json()
  return {
    total: Number(stats.total) || 0,
    accepting: stats.accepting !== false
  }
}

export async function createWish(newWish: NewWish): Promise<CreatedWish> {
  const response = await send('/api/wishes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newWish)
  })
  return await response.json()
}

export async function deleteWish(id: number, token: string): Promise<void> {
  await send('/api/wishes/' + id, {
    method: 'DELETE',
    headers: { 'X-Author-Token': token }
  })
}

export async function reportWish(id: number): Promise<void> {
  await send('/api/wishes/' + id + '/report', { method: 'POST' })
}
