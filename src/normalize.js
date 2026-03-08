const ALLOWED_AREAS = ['생활', '직장', '건강', '집안일', '관리']

function formatDate(date) {
  return date.toISOString().slice(0, 10)
}

function addDays(base, days) {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

function nextWeekMonday(base) {
  const d = new Date(base)
  const day = d.getDay() // 0=일, 1=월
  const diff = day === 0 ? 1 : 8 - day
  d.setDate(d.getDate() + diff)
  return d
}

function resolveRelativeDate(relative) {
  if (!relative) return ''

  const value = String(relative).trim()

  if (!value) return ''

  const now = new Date()

  if (value === '오늘' || value.toLowerCase() === 'today') {
    return formatDate(now)
  }

  if (value === '내일' || value.toLowerCase() === 'tomorrow') {
    return formatDate(addDays(now, 1))
  }

  if (value === '다음주 월요일') {
    return formatDate(nextWeekMonday(now))
  }

  return ''
}

export function normalizeTask(raw) {
  const task = String(raw?.task ?? '').trim()
  if (!task) {
    throw new Error('task is required')
  }

  const area = ALLOWED_AREAS.includes(raw?.area) ? raw.area : '관리'
  const startDate = resolveRelativeDate(raw?.startRelative)
  const dueDate = resolveRelativeDate(raw?.dueRelative)
  const note = String(raw?.note ?? '').trim()

  return {
    task,
    area,
    startDate,
    dueDate,
    priority: 2,
    points: 1,
    note,
  }
}