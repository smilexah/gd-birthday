import type { ServerResponse } from 'node:http'

const clients = new Set<ServerResponse>()

const pingTimer = setInterval(() => {
  for (const client of clients) {
    client.write(': ping\n\n')
  }
}, 25000)

export function addClient(client: ServerResponse) {
  clients.add(client)
}

export function removeClient(client: ServerResponse) {
  clients.delete(client)
}

export function broadcast(event: 'wish' | 'removed' | 'stats' | 'settings', data: unknown) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const client of clients) {
    client.write(message)
  }
}

export function closeAllClients() {
  clearInterval(pingTimer)
  for (const client of clients) {
    client.end()
  }
  clients.clear()
}

let lastAccepting: boolean | null = null

export function announceSettings(settings: { accepting: boolean; closesAt: string | null }) {
  lastAccepting = settings.accepting
  broadcast('settings', { accepting: settings.accepting, closesAt: settings.closesAt })
}

export function announceSettingsIfChanged(settings: { accepting: boolean; closesAt: string | null }) {
  if (lastAccepting === null) {
    lastAccepting = settings.accepting
    return false
  }
  if (lastAccepting === settings.accepting) {
    return false
  }
  announceSettings(settings)
  return true
}
