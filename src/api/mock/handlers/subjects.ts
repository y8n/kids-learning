/* ════════════════════════════════════════════════════════════════
   GET /subjects  —— 首页四张学科卡片
   ────────────────────────────────────────────────────────────────
   注意 characterUrl：mock 里直接返回打包后的资源地址，
   将来后端返回 CDN 地址即可，前端只管 <img src={characterUrl}>。
   ════════════════════════════════════════════════════════════════ */

import { defineMock } from '../server'
import { todayBySubject } from '../db'
import type { Subject, SubjectId } from '../../types'

import peppaUrl from '@/assets/characters/peppa.png'
import blueyUrl from '@/assets/characters/bluey.png'
import chaseUrl from '@/assets/characters/chase.png'
import pinkieUrl from '@/assets/characters/pinkie.png'

const progressOf = (id: SubjectId) => {
  const found = todayBySubject.find((x) => x.subjectId === id)
  return { done: found?.done ?? 0, total: found?.total ?? 0 }
}

const subjects: Subject[] = [
  {
    id: 'english',
    name: '英语',
    subtitle: '和佩奇读单词',
    characterUrl: peppaUrl,
    theme: { from: '#FF8FB6', to: '#FF3D7F' },
    enabled: true,
    progress: progressOf('english'),
  },
  {
    id: 'thinking',
    name: '思维',
    subtitle: '和布鲁伊动脑',
    characterUrl: blueyUrl,
    theme: { from: '#4FD8F5', to: '#0EA5C9' },
    enabled: false,
    progress: progressOf('thinking'),
  },
  {
    id: 'encyclopedia',
    name: '百科',
    subtitle: '汪汪队看世界',
    characterUrl: chaseUrl,
    theme: { from: '#FFB067', to: '#F2632E' },
    enabled: false,
    progress: progressOf('encyclopedia'),
  },
  {
    id: 'literacy',
    name: '识字',
    subtitle: '小马陪你认字',
    characterUrl: pinkieUrl,
    theme: { from: '#8BE06A', to: '#3FA83C' },
    enabled: false,
    progress: progressOf('literacy'),
  },
]

defineMock('GET', '/subjects', () => subjects)
