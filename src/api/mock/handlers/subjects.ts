/* ════════════════════════════════════════════════════════════════
   GET /subjects  —— 首页四张学科卡片
   ────────────────────────────────────────────────────────────────
   注意 characterUrl：mock 里直接返回打包后的资源地址，
   将来后端返回 CDN 地址即可，前端只管 <img src={characterUrl}>。
   ════════════════════════════════════════════════════════════════ */

import { defineMock } from '../server'
import { todayBySubject } from '../db'
import type { Subject, SubjectId } from '../../types'

import peppaUrl from '@/assets/characters/peppa.webp'
import blueyUrl from '@/assets/characters/bluey.webp'
import chaseUrl from '@/assets/characters/chase.webp'
import pinkieUrl from '@/assets/characters/pinkie.webp'

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
    // 佩奇本身接近正方（202×201），而且头顶皇冠、身体铺得开，
    // 在卡片里显得比另外三个角色「满」，收 10% 让它和其它角色重量相当。
    artScale: 0.9,
    progress: progressOf('english'),
  },
  {
    id: 'thinking',
    name: '思维',
    subtitle: '和布鲁伊动脑',
    characterUrl: blueyUrl,
    theme: { from: '#4FD8F5', to: '#0EA5C9' },
    enabled: false,
    // 比其它角色高（162×236 顶到卡片上沿），收一点避免压到右上角进度标
    artScale: 0.93,
    progress: progressOf('thinking'),
  },
  {
    id: 'encyclopedia',
    name: '百科',
    subtitle: '汪汪队看世界',
    characterUrl: chaseUrl,
    theme: { from: '#FFB067', to: '#F2632E' },
    enabled: false,
    // 阿奇很高（130×236），耳朵/头盔顶到卡片上沿，会压在右上角进度标上。
    // 收到 0.85 后头顶下移到约 y=58，让开进度标（底部 y=51）。
    artScale: 0.85,
    // 他是四张里最窄的（宽高比 0.55），右对齐后左边空一大块、看着贴边。
    // 6cqw ≈ 15px 是试出来的上限：再往左（10/14）头盔就贴到副标题了。
    artOffsetX: 6,
    progress: progressOf('encyclopedia'),
  },
  {
    id: 'literacy',
    name: '识字',
    subtitle: '小马陪你认字',
    characterUrl: pinkieUrl,
    theme: { from: '#8BE06A', to: '#3FA83C' },
    enabled: false,
    // 碧琪宽高比 0.87（四张里最宽），不收缩会明显比其他角色大一圈。
    // 设计稿给她的立绘容器是 168px，基准 202px → 168/202 ≈ 0.831
    artScale: 0.831,
    progress: progressOf('literacy'),
  },
]

defineMock('GET', '/subjects', () => subjects)
