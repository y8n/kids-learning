import { request } from '../client'
import type { TodayProgress, WeeklyRecord } from '../types'

/** 今日学习总览（右侧上方卡片） */
export function fetchTodayProgress(signal?: AbortSignal): Promise<TodayProgress> {
  return request<TodayProgress>({ url: '/progress/today', signal })
}

/** 最近一周学习记录（右侧下方卡片） */
export function fetchWeeklyRecord(signal?: AbortSignal): Promise<WeeklyRecord> {
  return request<WeeklyRecord>({ url: '/progress/weekly', signal })
}
