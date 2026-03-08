import dotenv from 'dotenv'
import { google } from 'googleapis'

dotenv.config()

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })

function formatSeoulDateTime(date = new Date()) {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const map = Object.fromEntries(parts.map(p => [p.type, p.value]))
  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`
}

function formatDateOnly(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

export async function appendTask(task) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Dump!A:A',
  })

  const rows = res.data.values || []
  const nextRow = rows.length + 1

  const nowText = formatSeoulDateTime(new Date())

  const values = [[
    task.task,
    task.area,
    formatDateOnly(task.startDate),
    formatDateOnly(task.dueDate),
    task.priority ?? 2,
    task.points ?? 1,
    nowText,          // Created
    nowText,          // Modified
    task.note || '',
    false,
  ]]

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `Dump!A${nextRow}:J${nextRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  })
}