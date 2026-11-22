import { reactive } from 'vue'
import { ApiError, request, type AdminWish } from './api'

export const workplaces: Record<string, string> = {
  apt: 'Аптека',
  fil: 'Филиал',
  off: 'Головной офис',
  log: 'Логистический центр',
  reg: 'Регионы'
}

export const workplaceKeys = ['apt', 'fil', 'off', 'log', 'reg']

const astanaOffset = 5 * 3600000

function twoDigits(n: number): string {
  return n < 10 ? '0' + n : String(n)
}

function astanaDate(iso: string): Date {
  return new Date(new Date(iso).getTime() + astanaOffset)
}

export function formatDate(iso: string): string {
  const d = astanaDate(iso)
  return twoDigits(d.getUTCDate()) + '.' + twoDigits(d.getUTCMonth() + 1) + ' ' + twoDigits(d.getUTCHours()) + ':' + twoDigits(d.getUTCMinutes())
}

export function formatFullDate(iso: string): string {
  const d = astanaDate(iso)
  return twoDigits(d.getUTCDate()) + '.' + twoDigits(d.getUTCMonth() + 1) + '.' + d.getUTCFullYear() + ' в ' + twoDigits(d.getUTCHours()) + ':' + twoDigits(d.getUTCMinutes())
}

export function toAstanaInput(iso: string | null): string {
  if (!iso) {
    return ''
  }
  return astanaDate(iso).toISOString().slice(0, 16)
}

export function fromAstanaInput(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value)
  if (!match) {
    return null
  }
  const utc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]))
  return new Date(utc - astanaOffset).toISOString()
}

export function place(wish: AdminWish): string {
  return (workplaces[wish.workplace] || wish.workplace) + (wish.city ? ' · ' + wish.city : '')
}

export const toast = reactive({ text: '', on: false })
let toastTimer = 0

export function showToast(text: string) {
  toast.text = text
  toast.on = true
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toast.on = false
  }, 2400)
}

export function showError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return
  }
  if (error instanceof ApiError) {
    showToast('Ошибка сервера, попробуйте ещё раз')
  } else {
    showToast('Нет связи с сервером')
  }
}

export const confirmBox = reactive({ text: '', open: false })
let confirmAnswer: ((value: boolean) => void) | null = null

export function askConfirm(text: string): Promise<boolean> {
  if (confirmAnswer) {
    confirmAnswer(false)
  }
  confirmBox.text = text
  confirmBox.open = true
  return new Promise((resolve) => {
    confirmAnswer = resolve
  })
}

export function answerConfirm(value: boolean) {
  confirmBox.open = false
  if (confirmAnswer) {
    confirmAnswer(value)
  }
  confirmAnswer = null
}

export function downloadExcel() {
  window.location.href = '/api/admin/export.xlsx'
  showToast('Файл выгружается')
}

export async function toggleWish(wish: AdminWish): Promise<boolean> {
  const status = wish.status === 'visible' ? 'hidden' : 'visible'
  try {
    await request('PATCH', '/api/admin/wishes/' + wish.id, { status: status })
    showToast(status === 'hidden' ? 'Скрыто с сайта' : 'Снова показано')
    return true
  } catch (error) {
    showError(error)
    return false
  }
}

export async function deleteWish(wish: AdminWish): Promise<boolean> {
  const yes = await askConfirm('Удалить поздравление №' + wish.number + ' навсегда?')
  if (!yes) {
    return false
  }
  try {
    await request('DELETE', '/api/admin/wishes/' + wish.id)
    showToast('Удалено')
    return true
  } catch (error) {
    showError(error)
    return false
  }
}

export async function dismissReports(wish: AdminWish): Promise<boolean> {
  try {
    await request('POST', '/api/admin/wishes/' + wish.id + '/dismiss-reports')
    showToast('Жалобы сняты')
    return true
  } catch (error) {
    showError(error)
    return false
  }
}
