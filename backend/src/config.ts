import path from 'node:path'

function readText(name: string, fallback = ''): string {
  const value = process.env[name]
  if (value === undefined || value.trim() === '') {
    return fallback
  }
  return value.trim()
}

function readBoolean(name: string, fallback: boolean): boolean {
  const value = readText(name).toLowerCase()
  if (value === '') {
    return fallback
  }
  return value === 'true' || value === '1' || value === 'yes'
}

const requiredNames = ['DATABASE_URL', 'ADMIN_PASSWORD', 'SESSION_SECRET', 'IP_HASH_SALT']

export function clientIp(request: { ip: string; headers: Record<string, string | string[] | undefined> }) {
  if (config.clientIpHeader) {
    const value = request.headers[config.clientIpHeader]
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim()
    }
  }
  return request.ip
}

export const missingVariables = requiredNames.filter((name) => readText(name) === '')

export const config = {
  port: Number(readText('PORT', '3000')),
  host: readText('HOST', '0.0.0.0'),
  databaseUrl: readText('DATABASE_URL'),
  adminLogin: readText('ADMIN_LOGIN', 'admin'),
  adminPassword: process.env.ADMIN_PASSWORD ?? '',
  sessionSecret: readText('SESSION_SECRET'),
  ipHashSalt: readText('IP_HASH_SALT'),
  cookieSecure: readBoolean('COOKIE_SECURE', false),
  trustProxy: readBoolean('TRUST_PROXY', false),
  clientIpHeader: readText('CLIENT_IP_HEADER').toLowerCase(),
  forceHttps: readBoolean('FORCE_HTTPS', false),
  staticDir: path.resolve(readText('STATIC_DIR', path.join(import.meta.dirname, '..', '..', 'frontend', 'dist'))),
  logLevel: readText('LOG_LEVEL', 'info'),
  seedEnabled: readBoolean('SEED_ENABLED', false),
}
