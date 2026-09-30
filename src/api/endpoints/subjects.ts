import { request } from '../client'
import type { Subject } from '../types'

/** 获取首页四张学科卡片 */
export function fetchSubjects(signal?: AbortSignal): Promise<Subject[]> {
  return request<Subject[]>({ url: '/subjects', signal })
}
