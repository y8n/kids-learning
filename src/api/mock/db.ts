/* ════════════════════════════════════════════════════════════════
   Mock 数据库 —— 假数据的唯一来源
   ────────────────────────────────────────────────────────────────
   所有 handler 都从这里取数据，方便统一改、也方便将来对照着写后端。
   数据刻意贴近真实：星星数是按「打卡天数 × 每天 2~4 颗」凑出来的。
   ════════════════════════════════════════════════════════════════ */

import type { ChildProfile, TodayProgress, WeeklyRecord } from '../types'

export const childProfile: ChildProfile = {
  id: 'child_001',
  name: '宝贝',
  avatar: '🐰',
  grade: '中班',
  level: 5,
  stars: 286,
}

/** 今日分科进度 —— 也是 subject.progress 的来源，保证两处一致 */
export const todayBySubject: TodayProgress['items'] = [
  { subjectId: 'english', done: 1, total: 5 },
  { subjectId: 'thinking', done: 0, total: 2 },
  { subjectId: 'encyclopedia', done: 0, total: 1 },
  { subjectId: 'literacy', done: 0, total: 0 },
]

/**
 * 自然周（周一 → 周日）的星星记录，索引 0 = 周一、6 = 周日。
 * 0 表示当天没学 —— 还没到的日子也是 0，落到界面上是「空格子 + 线框星」。
 * 刻意凑齐 1 / 2 / 3 颗三种排布，方便一眼看全卡片的所有形态。
 */
export const weekStarsByWeekday: number[] = [3, 1, 2, 0, 0, 0, 0]

export const weeklyRecord: WeeklyRecord = {
  days: [], // 由 handler 按「今天是本周第几天」动态生成，见 handlers/progress.ts
  streakDays: 4,
  monthCheckInDays: 8,
  weekStars: weekStarsByWeekday.reduce((a, b) => a + b, 0),
}
