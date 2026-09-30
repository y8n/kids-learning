import { request } from '../client'
import type { ChildProfile } from '../types'

/** 获取孩子档案 */
export function fetchProfile(signal?: AbortSignal): Promise<ChildProfile> {
  return request<ChildProfile>({ url: '/profile', signal })
}
