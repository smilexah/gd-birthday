import { z } from 'zod'

export const workplaces = ['apt', 'fil', 'off', 'log', 'reg'] as const
export const flavors = ['V', 'B', 'C', 'G'] as const
export const langs = ['ru', 'kk'] as const

function emptyToUndefined(value: unknown) {
  if (value === '' || value === null) {
    return undefined
  }
  return value
}

export const wishSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .regex(/^[\p{L}\p{M}'’]+(-[\p{L}\p{M}'’]+)*$/u, 'Name must be one word, letters and hyphen only'),
  workplace: z.enum(workplaces),
  city: z.preprocess(emptyToUndefined, z.string().trim().max(30).optional()),
  text: z.string().trim().min(1).max(500),
  flavor: z.enum(flavors),
  lang: z.enum(langs),
})

const positiveInt = z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).optional())

export const feedQuerySchema = z.object({
  cursor: positiveInt,
  since: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).optional()),
  filter: z.preprocess(emptyToUndefined, z.enum(['all', ...workplaces]).default('all')),
  city: z.preprocess(emptyToUndefined, z.string().trim().max(30).optional()),
  limit: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(100).default(50)),
})

export type FeedQuery = z.infer<typeof feedQuerySchema>

export const loginSchema = z.object({
  login: z.string().max(200),
  password: z.string().max(200),
})

export const adminListSchema = z.object({
  q: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
  workplace: z.preprocess(emptyToUndefined, z.enum(['all', ...workplaces]).default('all')),
  status: z.preprocess(emptyToUndefined, z.enum(['all', 'visible', 'hidden', 'reported']).default('all')),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).default(1)),
  pageSize: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(100).default(20)),
})

export const statusSchema = z.object({
  status: z.enum(['visible', 'hidden']),
})

export const settingsSchema = z.object({
  isOpen: z.boolean().optional(),
  closesAt: z.iso.datetime({ offset: true }).nullable().optional(),
})

export const idSchema = z.coerce.number().int().min(1).max(2147483647)

export function firstIssue(error: z.ZodError) {
  const issue = error.issues[0]
  return {
    field: issue && issue.path.length > 0 ? String(issue.path[0]) : undefined,
    message: issue ? issue.message : 'Invalid input',
  }
}
