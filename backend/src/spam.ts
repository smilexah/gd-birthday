import crypto from 'node:crypto'
import { config } from './config.js'

export function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

export function hashIp(ip: string) {
  return sha256(config.ipHashSalt + ip)
}

export function createAuthorToken() {
  return crypto.randomBytes(24).toString('base64url')
}

export function normalizeForDuplicates(text: string) {
  const normalized = text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
  if (normalized === '') {
    return text.trim().toLowerCase()
  }
  return normalized
}

const linkPatterns = [
  /https?:\/\//i,
  /\bwww\./i,
  /\bt\.me\b/i,
  /\b(wa\.me|bit\.ly|vk\.cc|goo\.gl|tinyurl)\b/i,
  /[a-z0-9-]+\.(kz|com|ru|net|org|info|io|me|su|ua|uz|kg|by|biz|site|online|shop|app|dev|xyz|top|club|pro|link|ly|gg|tv|cc)\b/i,
  /[а-яёәғқңөұүһі0-9-]+\.(рф|қаз|каз|бел|укр)(?![\p{L}])/iu,
]

export function hasLink(text: string) {
  return linkPatterns.some((pattern) => pattern.test(text))
}

const lookalikes: Record<string, string> = {
  a: 'а',
  b: 'в',
  c: 'с',
  e: 'е',
  h: 'н',
  i: 'и',
  k: 'к',
  m: 'м',
  o: 'о',
  p: 'р',
  t: 'т',
  u: 'и',
  x: 'х',
  y: 'у',
  '0': 'о',
  '3': 'з',
  '4': 'ч',
  '6': 'б',
  '@': 'а',
  'ё': 'е',
  'і': 'и',
}

const badWordPatterns = [
  /^(о|по|на|от|ни|за|до|при)?ху[йеяию]/,
  /пизд/,
  /^(на|по|за|от|вы|до|раз|при|пере|про|у|въ|съ|отъ|разъ|подъ|изъ|объ)?[е]б(а|у|л|н|и|е|к|ыр|ош)/,
  /бляд|блят|^бля$/,
  /^муд(ак|ил|оз|еб)/,
  /пид[оа]р/,
  /залуп/,
  /г[ао]ндон/,
  /шлюх/,
  /^сук(а|и|у|ой|ам|ами|ин|ина)$/,
  /^сикт/,
  /^сиг(еи|ей|ем)/,
  /^қотақ/,
  /^жалап/,
  /^шешеңди/,
  /^боқ(тық|тан)?$/,
]

function normalizeWord(word: string) {
  let result = ''
  for (const letter of word.toLowerCase()) {
    result += lookalikes[letter] ?? letter
  }
  return result.replace(/[^\p{L}]/gu, '').replace(/(\p{L})\1+/gu, '$1')
}

export function hasProfanity(text: string) {
  const words = text.split(/[\s,!?;:()"«»–—]+/)
  for (const word of words) {
    const normalized = normalizeWord(word)
    if (normalized === '') {
      continue
    }
    if (badWordPatterns.some((pattern) => pattern.test(normalized))) {
      return true
    }
  }
  return false
}
