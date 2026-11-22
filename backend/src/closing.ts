import { getSettings, type Settings } from './db.js'
import { announceSettingsIfChanged } from './events.js'
import { clearCache } from './cache.js'

const longestTimerMs = 2147483647
const safetyCheckMs = 30000

let closingTimer: NodeJS.Timeout | undefined
let safetyTimer: NodeJS.Timeout | undefined
let logMessage: (message: string) => void = () => {}

export function scheduleClosing(settings: Settings) {
  clearTimeout(closingTimer)
  closingTimer = undefined
  if (!settings.accepting || settings.closesAt === null) {
    return
  }
  const delay = new Date(settings.closesAt).getTime() - Date.now()
  closingTimer = setTimeout(checkSettings, Math.min(Math.max(delay, 0), longestTimerMs))
}

export async function checkSettings() {
  try {
    const settings = await getSettings()
    if (announceSettingsIfChanged(settings)) {
      clearCache()
      logMessage(`Accepting state changed: ${settings.accepting}`)
    }
    scheduleClosing(settings)
  } catch (error) {
    logMessage(`Settings check failed: ${(error as Error).message}`)
  }
}

export async function startClosingWatch(log: (message: string) => void) {
  logMessage = log
  await checkSettings()
  safetyTimer = setInterval(checkSettings, safetyCheckMs)
}

export function stopClosingWatch() {
  clearTimeout(closingTimer)
  clearInterval(safetyTimer)
}
