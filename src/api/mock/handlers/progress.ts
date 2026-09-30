/* ════════════════════════════════════════════════════════════════
   GET /progress/today   今日学习总览
   GET /progress/weekly  最近一周记录（按「今天」动态生成）
   ════════════════════════════════════════════════════════════════ */

import { defineMock } from '../server'
import { todayBySubject, weekStars, weeklyRecord } from '../db'
import type { TodayProgress, WeeklyRecord } from '../../types'

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六']

function buildWeekly(): WeeklyRecord {
  const today = new Date()
  const days = weekStars.map((stars, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (weekStars.length - 1 - i))
    return {
      date: d.toISOString().slice(0, 10),
      label: WEEK_LABELS[d.getDay()],
      stars,
      isToday: i === weekStars.length - 1,
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
