import { ref } from 'vue'

export interface AdminWish {
  id: number
  number: number
  name: string
  workplace: string
  city: string | null
  text: string
  flavor: string
  createdAt: string
  status: string
  lang: string
  reports: number
}

export interface Stats {
  total: number
  visible: number
  hidden: number
  reported: number
  byWorkplace: Record<string, number>
  byDay: { day: string; count: number }[]
  latest: AdminWish[]
  accepting: boolean
  isOpen: boolean
  closesAt: string | null
}

export interface Settings {
  isOpen: boolean
  closesAt: string | null
  accepting: boolean
}

export interface WishPage {
  items: AdminWish[]
  total: number
  page: number
  pageSize: number
}

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string) {
    super(code || 'error ' + status)
    this.status = status
    this.code = code
  }
}

export const loggedIn = ref<boolean | null>(null)

export async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const options: RequestInit = { method: method, credentials: 'same-origin' }
  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }
  const response = await fetch(url, options)
  if (response.status === 401 && url !== '/api/admin/login') {
    loggedIn.value = false
    throw new ApiError(401, 'unauthorized')
  }
  if (!response.ok) {
    let code = ''
    try {
      const data = await response.json()
      code = data.error || ''
    } catch {
      code = ''
    }
    throw new ApiError(response.status, code)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}
