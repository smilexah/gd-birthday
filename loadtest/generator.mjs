import http from 'node:http'
import autocannon from 'autocannon'

const target = new URL(process.env.TARGET ?? 'http://app:3000')
const durationSeconds = Number(process.env.DURATION ?? 60)
const readers = Number(process.env.READERS ?? 2000)
const readerRate = Number(process.env.READER_RATE ?? 1)
const sseClients = Number(process.env.SSE_CLIENTS ?? 500)
const wishesPerMinute = Number(process.env.WISHES_PER_MINUTE ?? 100)

let ipCounter = 0
function nextIp() {
  ipCounter += 1
  return `10.${Math.floor(ipCounter / 65000) % 250}.${Math.floor(ipCounter / 250) % 250}.${ipCounter % 250 + 1}`
}

function percentile(sorted, value) {
  if (sorted.length === 0) {
    return 0
  }
  const index = Math.min(sorted.length - 1, Math.ceil((value / 100) * sorted.length) - 1)
  return sorted[Math.max(0, index)]
}

function summary(name, times, errors, total) {
  const sorted = [...times].sort((a, b) => a - b)
  return {
    name,
    requests: total,
    errors,
    errorRate: total === 0 ? 0 : errors / total,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    max: sorted.length ? sorted[sorted.length - 1] : 0,
  }
}

const feedPaths = ['/api/feed', '/api/feed?filter=apt', '/api/feed?filter=fil', '/api/feed?filter=off', '/api/feed?filter=log', '/api/feed?filter=reg', '/api/feed?limit=50&cursor=1500', '/api/feed?limit=50&cursor=1000']

function runReaders(name, pickPath) {
  const times = []
  let errors = 0
  let total = 0
  const instance = autocannon({
    url: target.origin,
    connections: readers,
    connectionRate: readerRate,
    duration: durationSeconds,
    timeout: 10,
    requests: [
      {
        setupRequest: (request, context) => {
          if (!context.ip) {
            context.ip = nextIp()
          }
          request.path = pickPath()
          request.headers = { ...request.headers, 'x-forwarded-for': context.ip }
          return request
        },
      },
    ],
  })
  instance.on('response', (client, statusCode, bytes, responseTime) => {
    total += 1
    times.push(responseTime)
    if (statusCode >= 400) {
      errors += 1
    }
  })
  instance.on('reqError', () => {
    total += 1
    errors += 1
  })
  return new Promise((resolve) => {
    instance.on('done', (result) => {
      resolve({ ...summary(name, times, errors, total), timeouts: result.timeouts, non2xx: result.non2xx })
    })
  })
}

function openSseClients() {
  const clients = []
  for (let index = 0; index < sseClients; index++) {
    const client = { connected: false, events: 0, wishEvents: 0, droppedEarly: false, finished: false }
    const request = http.get(
      { hostname: target.hostname, port: target.port, path: '/api/events', headers: { 'x-forwarded-for': nextIp() } },
      (response) => {
        client.connected = response.statusCode === 200
        response.setEncoding('utf8')
        response.on('data', (chunk) => {
          client.events += (chunk.match(/^event: /gm) ?? []).length
          client.wishEvents += (chunk.match(/^event: wish$/gm) ?? []).length
        })
        response.on('close', () => {
          if (!client.finished) {
            client.droppedEarly = true
          }
        })
      },
    )
    request.on('error', () => {
      if (!client.finished) {
        client.droppedEarly = true
      }
    })
    client.request = request
    clients.push(client)
  }
  return clients
}

function closeSseClients(clients) {
  for (const client of clients) {
    client.finished = true
    client.request.destroy()
  }
  const wishEvents = clients.map((client) => client.wishEvents).sort((a, b) => a - b)
  return {
    opened: clients.length,
    connected: clients.filter((client) => client.connected).length,
    droppedEarly: clients.filter((client) => client.droppedEarly).length,
    minWishEvents: wishEvents[0] ?? 0,
    maxWishEvents: wishEvents[wishEvents.length - 1] ?? 0,
  }
}

async function sendWishes() {
  const total = Math.round((wishesPerMinute * durationSeconds) / 60)
  const gapMs = (durationSeconds * 1000) / total
  const times = []
  const statuses = {}
  let errors = 0
  const pending = []
  for (let index = 0; index < total; index++) {
    const startedAt = Date.now()
    const body = JSON.stringify({
      name: 'Нагрузка',
      workplace: ['apt', 'fil', 'off', 'log', 'reg'][index % 5],
      city: index % 5 < 2 ? 'Алматы' : '',
      text: `Тестовое поздравление под нагрузкой номер ${index} ${Date.now()}`,
      flavor: ['V', 'B', 'C', 'G'][index % 4],
      lang: 'ru',
      website: '',
    })
    pending.push(
      fetch(`${target.origin}/api/wishes`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': nextIp() },
        body,
        signal: AbortSignal.timeout(10000),
      })
        .then((response) => {
          statuses[response.status] = (statuses[response.status] ?? 0) + 1
          if (response.status !== 201) {
            errors += 1
          }
          times.push(Date.now() - startedAt)
        })
        .catch(() => {
          errors += 1
          statuses.network = (statuses.network ?? 0) + 1
        }),
    )
    await new Promise((resolve) => setTimeout(resolve, gapMs))
  }
  await Promise.all(pending)
  return { ...summary('POST /api/wishes', times, errors, total), statuses }
}

const sse = openSseClients()
await new Promise((resolve) => setTimeout(resolve, 2000))
const [feed, stats, wishes] = await Promise.all([
  runReaders('GET /api/feed', () => feedPaths[Math.floor(Math.random() * feedPaths.length)]),
  runReaders('GET /api/stats', () => '/api/stats'),
  sendWishes(),
])
await new Promise((resolve) => setTimeout(resolve, 2000))
const sseResult = closeSseClients(sse)

console.log('RESULT ' + JSON.stringify({ feed, stats, wishes, sse: sseResult }))
process.exit(0)
