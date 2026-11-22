import fs from 'node:fs'
import path from 'node:path'
import Fastify, { type FastifyError } from 'fastify'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import { pino } from 'pino'
import { config, missingVariables, clientIp } from './config.js'
import { pool } from './db.js'
import { runMigrations } from './migrate.js'
import { closeAllClients } from './events.js'
import { startClosingWatch, stopClosingWatch } from './closing.js'
import { publicRoutes } from './routes/public.js'
import { adminRoutes } from './routes/admin.js'

if (missingVariables.length > 0) {
  console.error(`Missing required environment variables: ${missingVariables.join(', ')}. Set them in .env`)
  process.exit(1)
}

const logger = pino({ level: config.logLevel })

const app = Fastify({
  loggerInstance: logger,
  trustProxy: config.trustProxy,
  bodyLimit: 16 * 1024,
  disableRequestLogging: true,
})

app.removeContentTypeParser('application/json')
app.addContentTypeParser('application/json', { parseAs: 'string' }, (request, body, done) => {
  const text = String(body)
  if (text.trim() === '') {
    done(null, {})
    return
  }
  try {
    done(null, JSON.parse(text))
  } catch {
    const error = new Error('Invalid JSON body') as FastifyError
    error.statusCode = 400
    done(error, undefined)
  }
})

const errorCodes: Record<number, string> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  413: 'payload_too_large',
  415: 'unsupported_media_type',
  429: 'rate_limited',
}

app.setErrorHandler((error: FastifyError, request, reply) => {
  const status = error.statusCode && error.statusCode >= 400 && error.statusCode < 500 ? error.statusCode : 500
  if (status === 500) {
    request.log.error(error)
    return reply.code(500).send({ error: 'internal', message: 'Internal server error' })
  }
  return reply.code(status).send({ error: errorCodes[status] ?? 'bad_request', message: error.message })
})

app.addHook('onRequest', async (request, reply) => {
  if (config.forceHttps && request.headers['x-forwarded-proto'] === 'http') {
    return reply.redirect(`https://${request.headers.host}${request.url}`, 301)
  }
})

await app.register(helmet, {
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
    },
  },
})

await app.register(rateLimit, {
  global: true,
  max: 1200,
  timeWindow: '1 minute',
  keyGenerator: (request) => clientIp(request),
  errorResponseBuilder: (request, context) => ({
    statusCode: 429,
    error: 'rate_limited',
    message: `Too many requests, retry in ${context.after}`,
  }),
})

await app.register(publicRoutes)
await app.register(adminRoutes, { prefix: '/api/admin' })

const indexFile = path.join(config.staticDir, 'index.html')
const hasStatic = fs.existsSync(indexFile)

if (hasStatic) {
  await app.register(fastifyStatic, {
    root: config.staticDir,
    wildcard: true,
    setHeaders: (reply, filePath) => {
      if (filePath.endsWith('index.html')) {
        reply.header('Cache-Control', 'no-cache')
      } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        reply.header('Cache-Control', 'public, max-age=31536000, immutable')
      }
    },
  })
} else {
  app.log.warn(`Static directory ${config.staticDir} has no index.html, only API is served`)
}

app.setNotFoundHandler((request, reply) => {
  const isApi = request.url === '/api' || request.url.startsWith('/api/')
  const isAsset = request.url.startsWith('/assets/')
  const isPage = request.method === 'GET' || request.method === 'HEAD'
  if (!isApi && !isAsset && isPage && hasStatic) {
    reply.header('Cache-Control', 'no-cache')
    return reply.sendFile('index.html')
  }
  return reply.code(404).send({ error: 'not_found', message: 'Not found' })
})

let shuttingDown = false

async function shutdown(signal: string) {
  if (shuttingDown) {
    return
  }
  shuttingDown = true
  app.log.info(`${signal} received, shutting down`)
  stopClosingWatch()
  closeAllClients()
  try {
    await app.close()
    await pool.end()
  } catch (error) {
    app.log.error(error, 'Shutdown error')
  }
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

try {
  await runMigrations((message) => app.log.info(message))
  await startClosingWatch((message) => app.log.info(message))
  await app.listen({ port: config.port, host: config.host })
} catch (error) {
  app.log.error(error, 'Server failed to start')
  await pool.end().catch(() => {})
  process.exit(1)
}
