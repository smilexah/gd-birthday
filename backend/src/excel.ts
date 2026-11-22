import ExcelJS from 'exceljs'
import { pool, wishColumns, type WishRow } from './db.js'

const workplaceNames: Record<string, string> = {
  apt: 'Аптека',
  fil: 'Филиал',
  off: 'Головной офис',
  log: 'Логистический центр',
  reg: 'Регионы',
}

const flavorNames: Record<string, string> = {
  V: 'Ванильный',
  B: 'Ягодный',
  C: 'Шоколадный',
  G: 'Фисташковый',
}

const statusNames: Record<string, string> = {
  visible: 'Показано',
  hidden: 'Скрыто',
  deleted: 'Удалено',
}

const langNames: Record<string, string> = {
  ru: 'Русский',
  kk: 'Қазақша',
}

const astanaOffsetMs = 5 * 60 * 60 * 1000

export function astanaDate(date: Date) {
  return new Date(date.getTime() + astanaOffsetMs).toISOString().slice(0, 10)
}

export async function buildWishesWorkbook() {
  const result = await pool.query<WishRow>(
    `SELECT ${wishColumns}, (SELECT count(*)::int FROM reports r WHERE r.wish_id = w.id) AS reports
     FROM wishes w ORDER BY w.number`,
  )

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'INKAR'
  workbook.created = new Date()
  const sheet = workbook.addWorksheet('Поздравления', { views: [{ state: 'frozen', ySplit: 1 }] })
  sheet.columns = [
    { header: '№', key: 'number', width: 8 },
    { header: 'Имя', key: 'name', width: 18 },
    { header: 'Место работы', key: 'workplace', width: 22 },
    { header: 'Город', key: 'city', width: 16 },
    { header: 'Пожелание', key: 'text', width: 70 },
    { header: 'Вкус', key: 'flavor', width: 14 },
    { header: 'Язык', key: 'lang', width: 11 },
    { header: 'Дата (Астана)', key: 'createdAt', width: 18, style: { numFmt: 'dd.mm.yyyy hh:mm' } },
    { header: 'Статус', key: 'status', width: 12 },
    { header: 'Жалобы', key: 'reports', width: 10 },
  ]

  for (const row of result.rows) {
    sheet.addRow({
      number: row.number,
      name: row.name,
      workplace: workplaceNames[row.workplace] ?? row.workplace,
      city: row.city ?? '',
      text: row.text,
      flavor: flavorNames[row.flavor] ?? row.flavor,
      lang: langNames[row.lang] ?? row.lang,
      createdAt: new Date(row.created_at.getTime() + astanaOffsetMs),
      status: statusNames[row.status] ?? row.status,
      reports: row.reports ?? 0,
    })
  }

  sheet.getRow(1).font = { bold: true }
  sheet.getColumn('text').alignment = { wrapText: true, vertical: 'top' }
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 10 } }

  return Buffer.from(await workbook.xlsx.writeBuffer())
}
