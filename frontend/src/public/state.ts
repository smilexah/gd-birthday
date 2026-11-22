import { reactive } from 'vue'
import { fetchFeed, fetchStats, type Stats, type Wish } from './api'
import { loadTokens } from './device'

export const state = reactive({
  wishes: [] as Wish[],
  filter: 'all',
  nextCursor: null as number | null,
  loadingMore: false,
  loaded: false,
  active: 0,
  version: 0,
  total: 0,
  accepting: true,
  maxNumber: 0,
  lastTouch: 0,
  tokens: loadTokens()
})

let feedRequest = 0

export function slotCount() {
  return state.accepting ? 1 : 0
}

export function listLength() {
  return state.wishes.length + slotCount()
}

export function poke() {
  state.lastTouch = Date.now()
}

function rememberNumbers(items: Wish[]) {
  for (const wish of items) {
    if (wish.number > state.maxNumber) {
      state.maxNumber = wish.number
    }
  }
}

export async function reloadFeed(filter: string) {
  state.filter = filter
  feedRequest++
  const request = feedRequest
  let items: Wish[] = []
  let nextCursor: number | null = null
  let ok = false
  try {
    const page = await fetchFeed(filter, null)
    items = page.items
    nextCursor = page.nextCursor
    ok = true
  } catch {
    ok = false
  }
  if (request !== feedRequest) {
    return
  }
  state.wishes = items
  state.nextCursor = nextCursor
  state.loadingMore = false
  if (ok) {
    state.loaded = true
  }
  state.version++
  state.active = state.accepting && items.length > 0 ? 1 : 0
  rememberNumbers(items)
}

export async function loadMore() {
  if (state.nextCursor === null || state.loadingMore) {
    return
  }
  state.loadingMore = true
  const request = feedRequest
  try {
    const page = await fetchFeed(state.filter, state.nextCursor)
    if (request !== feedRequest) {
      return
    }
    for (const wish of page.items) {
      if (!state.wishes.some((item) => item.id === wish.id)) {
        state.wishes.push(wish)
      }
    }
    state.nextCursor = page.nextCursor
    rememberNumbers(page.items)
  } catch {
    return
  } finally {
    if (request === feedRequest) {
      state.loadingMore = false
    }
  }
}

export function addWishOnTop(wish: Wish) {
  rememberNumbers([wish])
  if (state.filter !== 'all' && wish.workplace !== state.filter) {
    return false
  }
  if (state.wishes.some((item) => item.id === wish.id)) {
    return false
  }
  const oldLength = listLength()
  state.wishes.unshift(wish)
  if (oldLength > 0 && state.active >= slotCount()) {
    state.active++
  }
  return true
}

export function removeWishById(id: number) {
  const index = state.wishes.findIndex((item) => item.id === id)
  if (index === -1) {
    return
  }
  state.wishes.splice(index, 1)
  if (index + slotCount() < state.active) {
    state.active--
  }
  state.active = Math.max(0, Math.min(state.active, listLength() - 1))
}

export function setAccepting(accepting: boolean) {
  if (state.accepting === accepting) {
    return
  }
  const oldLength = listLength()
  state.accepting = accepting
  if (!accepting && state.active > 0) {
    state.active--
  }
  if (accepting && oldLength > 0) {
    state.active++
  }
}

export function applyStats(stats: Stats) {
  state.total = stats.total
  setAccepting(stats.accepting)
}

export async function refreshStats() {
  try {
    applyStats(await fetchStats())
  } catch {
    return
  }
}

export async function showOwnWish(wish: Wish) {
  state.total++
  setTimeout(refreshStats, 4000)
  if (state.filter !== 'all') {
    await reloadFeed('all')
  }
  addWishOnTop(wish)
  state.version++
  state.active = slotCount()
}
