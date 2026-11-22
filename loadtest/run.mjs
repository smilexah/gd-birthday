import { execFile, spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)
const loadtestDir = import.meta.dirname
const projectDir = path.join(loadtestDir, '..')

if (!process.argv.includes('--wipe-database')) {
  console.error('This test fills the database with test wishes and then deletes ALL wishes and reports.')
  console.error('Run it only on a local or test stand: npm start -- --wipe-database')
  process.exit(1)
}

function readEnv(name, fallback) {
  const file = path.join(projectDir, '.env')
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
  const line = text.split(/\r?\n/).find((item) => item.startsWith(`${name}=`))
  return line ? line.slice(name.length + 1).trim() : fallback
}

const dbUser = readEnv('POSTGRES_USER', 'gd')
const dbName = readEnv('POSTGRES_DB', 'gd_birthday')
const network = process.env.NETWORK ?? 'gd-birthday_default'
const seedCount = Number(process.env.SEED_COUNT ?? 2000)

async function compose(args) {
  const result = await run('docker', ['compose', ...args], { cwd: projectDir, maxBuffer: 10 * 1024 * 1024 })
  return result.stdout.trim()
}

function sql(query) {
  return compose(['exec', '-T', 'db', 'psql', '-U', dbUser, '-d', dbName, '-tA', '-c', query])
}

async function appContainer() {
  const id = await compose(['ps', '-q', 'app'])
  if (!id) {
    throw new Error('Container app is not running: docker compose up -d')
  }
  return id
}

async function fillDatabase() {
  await sql(`
    INSERT INTO wishes (name, workplace, city, text, text_normalized, flavor, lang, author_token_hash, ip_hash)
    SELECT 'Сотрудник',
           (ARRAY['apt','fil','off','log','reg'])[1 + n % 5],
           CASE WHEN n % 5 < 2 THEN 'Алматы' END,
           'Нагрузочное поздравление номер ' || n || '. Здоровья, счастья и успехов во всех делах!',
           'loadtest ' || n,
           (ARRAY['V','B','C','G'])[1 + n % 4],
           'ru',
           repeat('a', 64),
           repeat('b', 64)
    FROM generate_series(1, ${seedCount}) AS n`)
}

async function cleanDatabase() {
  await sql("TRUNCATE reports, wishes RESTART IDENTITY; ALTER SEQUENCE wish_number_seq RESTART WITH 1; UPDATE settings SET is_open = true, closes_at = '2026-11-25 00:00:00+05', updated_at = now() WHERE id = 1")
}

function parseMemory(text) {
  const value = parseFloat(text)
  if (text.includes('GiB')) return value * 1024
  if (text.includes('KiB')) return value / 1024
  return value
}

const samples = []
let sampling = true

async function sampleLoop(container) {
  while (sampling) {
    try {
      const stats = await run('docker', ['stats', '--no-stream', '--format', '{{.CPUPerc}};{{.MemUsage}}', container])
      const [cpu, memory] = stats.stdout.trim().split(';')
      const connections = await sql(`SELECT count(*) FROM pg_stat_activity WHERE datname = '${dbName}' AND backend_type = 'client backend'`)
      samples.push({ cpu: parseFloat(cpu), memoryMb: parseMemory(memory.split('/')[0]), memoryLimit: memory.split('/')[1].trim(), dbConnections: Number(connections) - 1 })
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

function runGenerator() {
  return new Promise((resolve, reject) => {
    const env = ['DURATION', 'READERS', 'READER_RATE', 'SSE_CLIENTS', 'WISHES_PER_MINUTE'].flatMap((name) => (process.env[name] ? ['-e', `${name}=${process.env[name]}`] : []))
    const child = spawn('docker', ['run', '--rm', '--network', network, '--ulimit', 'nofile=65535:65535', '-v', `${loadtestDir}:/lt`, '-w', '/lt', ...env, 'node:26-alpine', 'node', 'generator.mjs'], { stdio: ['ignore', 'pipe', 'inherit'] })
    let output = ''
    child.stdout.on('data', (chunk) => {
      output += chunk
    })
    child.on('close', (code) => {
      const line = output.split('\n').find((item) => item.startsWith('RESULT '))
      if (!line) {
        reject(new Error(`Generator failed with code ${code}: ${output.slice(-2000)}`))
        return
      }
      resolve(JSON.parse(line.slice(7)))
    })
  })
}

function row(item) {
  return `${item.name.padEnd(18)} requests ${String(item.requests).padStart(7)}  errors ${(item.errorRate * 100).toFixed(2).padStart(6)}%  p50 ${String(Math.round(item.p50)).padStart(5)} ms  p95 ${String(Math.round(item.p95)).padStart(5)} ms  p99 ${String(Math.round(item.p99)).padStart(5)} ms  max ${String(Math.round(item.max)).padStart(5)} ms`
}

const container = await appContainer()
const restartsBefore = (await run('docker', ['inspect', '-f', '{{.RestartCount}}', container])).stdout.trim()
console.log(`Filling database with ${seedCount} wishes`)
await cleanDatabase()
await fillDatabase()

console.log('Running load test')
const sampler = sampleLoop(container)
let result
try {
  result = await runGenerator()
} finally {
  sampling = false
  await sampler
}

const restartsAfter = (await run('docker', ['inspect', '-f', '{{.RestartCount}}', container])).stdout.trim()
const oomKilled = (await run('docker', ['inspect', '-f', '{{.State.OOMKilled}}', container])).stdout.trim()
const peakCpu = Math.max(...samples.map((item) => item.cpu))
const averageCpu = samples.reduce((sum, item) => sum + item.cpu, 0) / Math.max(1, samples.length)
const peakMemory = Math.max(...samples.map((item) => item.memoryMb))
const peakConnections = Math.max(...samples.map((item) => item.dbConnections))

console.log('')
console.log(row(result.feed))
console.log(row(result.stats))
console.log(row(result.wishes) + `  statuses ${JSON.stringify(result.wishes.statuses)}`)
console.log(`SSE                opened ${result.sse.opened}  connected ${result.sse.connected}  dropped ${result.sse.droppedEarly}  wish events per client ${result.sse.minWishEvents}..${result.sse.maxWishEvents}`)
console.log(`Container          CPU avg ${averageCpu.toFixed(0)}%  peak ${peakCpu.toFixed(0)}%  memory peak ${peakMemory.toFixed(0)} MiB of ${samples[0]?.memoryLimit}  restarts ${restartsBefore} -> ${restartsAfter}  OOMKilled ${oomKilled}`)
console.log(`Database           peak client connections ${peakConnections}`)

const readRequests = result.feed.requests + result.stats.requests
const readErrors = result.feed.errors + result.stats.errors
const totalErrorRate = (readErrors + result.wishes.errors) / (readRequests + result.wishes.requests)
const checks = [
  ['errors below 1%', totalErrorRate < 0.01],
  ['feed p95 below 500 ms', result.feed.p95 < 500],
  ['container alive, no OOM', restartsBefore === restartsAfter && oomKilled === 'false'],
  ['SSE not dropped', result.sse.connected === result.sse.opened && result.sse.droppedEarly === 0],
]
console.log('')
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`)
}

fs.mkdirSync(path.join(loadtestDir, 'results'), { recursive: true })
const resultFile = path.join(loadtestDir, 'results', `result-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
fs.writeFileSync(resultFile, JSON.stringify({ result, samples, checks, totalErrorRate }, null, 2))
console.log(`Saved ${resultFile}`)

console.log('Cleaning database')
await cleanDatabase()
process.exit(checks.every(([, ok]) => ok) ? 0 : 1)
