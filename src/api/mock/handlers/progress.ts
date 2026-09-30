/* ════════════════════════════════════════════════════════════════
   GET /progress/today   今日学习总览
   GET /progress/weekly  本周学习记录（自然周：周一 → 周日，按「今天」定位）
   ════════════════════════════════════════════════════════════════ */

import { defineMock } from '../server'
import { todayBySubject, weekStarsByWeekday, weeklyRecord } from '../db'
import type { TodayProgress, WeeklyRecord } from '../../types'

/** 自然周以周一为首，所以索引 0 = 周一 …… 6 = 周日（Date.getDay() 是周日为首，要挪） */
const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

/** 本地时区的 YYYY-MM-DD —— 不能用 toISOString()，那是 UTC，凌晨会串到前一天 */
function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function buildWeekly(): WeeklyRecord {
  const today = new Date()
  const todayIndex = weekdayIndex(today)

  // 本周一 00:00；跨月 / 跨年交给 Date 自己算
  const monday = new Date(today)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - todayIndex)

  const days = WEEKDAY_LABELS.map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return {
      date: toISODate(d),
      label,
      stars: weekStarsByWeekday[i],
      isToday: i === todayIndex,
    }
  })

  return { ...weeklyRecord, days }
}

defineMock('GET', '/progress/today', (): TodayProgress => {
  const total = todayBySubject.reduce((sum, x) => sum + x.total, 0)
  const completed = todayBySubject.reduce((sum, x) => sum + x.done, 0)
  return { total, completed, items: todayBySubject }
})

defineMock('GET', '/progress/weekly', () => buildWeekly())
