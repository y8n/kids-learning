/* ════════════════════════════════════════════════════════════════
   领域模型 —— 前后端的「共同语言」
   ────────────────────────────────────────────────────────────────
   这里只描述**业务数据长什么样**，不含任何 mock / 请求实现细节。
   将来后端建好，只要接口返回符合这些类型，前端一行都不用改。
   ════════════════════════════════════════════════════════════════ */

/** 四大学科。新增学科时：先加到这里，加错编译器会直接报错。 */
export type SubjectId = 'english' | 'thinking' | 'encyclopedia' | 'literacy'

/** 孩子档案（顶栏左上角） */
export interface ChildProfile {
  id: string
  /** 昵称 */
  name: string
  /** 头像，emoji 或图片 URL */
  avatar: string
  /** 年级/班级，如「中班」 */
  grade: string
  /** 等级 */
  level: number
  /** 累计星星 */
  stars: number
}

/** 一个学科的可点击卡片 */
export interface Subject {
  id: SubjectId
  /** 卡片主标题，如「英语」 */
  name: string
  /** 卡片副标题：写课程信息 + 结合卡通角色，控制在 6 个汉字以内 */
  subtitle: string
  /** 角色立绘地址（后端可直接返回 CDN 地址） */
  characterUrl: string
  /** 卡片主题色（渐变两端） */
  theme: { from: string; to: string }
  /** 是否已开放。false 时前端只展示、点了给「敬请期待」提示 */
  enabled: boolean
  /**
   * 立绘缩放系数，默认 1。
   * 立绘按 contain 适配固定容器，宽高比越大的角色显示得越"矮胖"、视觉分量越重，
   * 需要单独收一点（如小马宝莉 0.87 宽高比 → 0.76）。
   * 这是**角色素材自身的属性**，所以放在数据层由后端/mock 给出，而不是写死在 CSS 里。
   */
  artScale?: number
  /** 今日进度 */
  progress: { done: number; total: number }
}

/** 今日学习总览（右侧上方卡片） */
export interface TodayProgress {
  /** 今日总项数 */
  total: number
  /** 已完成项数 */
  completed: number
  /** 分科明细 */
  items: Array<{ subjectId: SubjectId; done: number; total: number }>
}

/** 一周中的某一天 */
export interface WeekDayRecord {
  /** YYYY-MM-DD */
  date: string
  /** 周几，如「一」 */
  label: string
  /** 当天获得的星星数，0 表示没学 */
  stars: number
  isToday: boolean
}

/** 最近一周学习记录（右侧下方卡片） */
export interface WeeklyRecord {
  days: WeekDayRecord[]
  /** 连续打卡天数 */
  streakDays: number
  /** 本月打卡天数 */
  monthCheckInDays: number
  /** 本周总星星 */
  weekStars: number
}

/* ── 请求/响应的通用信封 ───────────────────────────────────── */

/** 后端统一返回格式。将来后端按这个约定返回即可。 */
export interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}
