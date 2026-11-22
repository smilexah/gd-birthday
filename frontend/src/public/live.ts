import { fetchFeed, fetchStats, type Wish } from './api'
import { addWishOnTop, applyStats, refreshStats, reloadFeed, removeWishById, setAccepting, state } from './state'

let source: EventSource | null = null
let pollTimer: number | undefined
let retryTimer: number | undefined
let running = false

function readData(event: Event) {
  try {
    return JSON.parse((event as MessageEvent).data)
  } catch {
    return null
  }
}

async function refreshAll() {
  await refreshStats()
  if (!state.loaded) {
    await reloadFeed(state.filter)
  }
}

async function poll() {
  try {
    applyStats(await fetchStats())
  } catch {
    return
  }
  if (!state.loaded) {
    await reloadFeed(state.filter)
    return
  }
  try {
    const page = await fetchFeed('all', null, state.maxNumber)
    for (const wish of page.items) {
      addWishOnTop(wish)
    }
  } catch {
    return
  }
}

function startPolling() {
  if (pollTimer === undefined) {
    pollTimer = window.setInterval(poll, 5000)
  }
}

function stopPolling() {
  window.clearInterval(pollTimer)
  pollTimer = undefined
}

function connect() {
  if (!running) {
    return
  }
  if (typeof EventSource === 'undefined') {
    startPolling()
    return
  }
  source = new EventSource('/api/events')
  source.onopen = () => {
    stopPolling()
    refreshAll()
  }
  source.addEventListener('wish', (event) => {
    const wish = readData(event) as Wish | null
    if (wish && typeof wish.id === 'number') {
      addWishOnTop(wish)
    }
  })
  source.addEventListener('removed', (event) => {
    const data = readData(event)
    if (data && typeof data.id === 'number') {
      removeWishById(data.id)
    }
  })
  source.addEventListener('stats', (event) => {
    const data = readData(event)
    if (data && typeof data.total === 'number') {
      state.total = data.total
    }
  })
  source.addEventListener('settings', (event) => {
    const data = readData(event)
    if (data && typeof data.accepting === 'boolean') {
      setAccepting(data.accepting)
    }
  })
  source.onerror = () => {
    closeSource()
    startPolling()
    window.clearTimeout(retryTimer)
    retryTimer = window.setTimeout(connect, 30000)
  }
}

function closeSource() {
  if (source) {
    source.close()
    source = null
  }
}

export function startLive() {
  running = true
  connect()
}

export function stopLive() {
  running = false
  closeSource()
  stopPolling()
  window.clearTimeout(retryTimer)
}
