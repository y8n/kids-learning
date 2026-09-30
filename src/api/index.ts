/* ════════════════════════════════════════════════════════════════
   API 层总出口
   ────────────────────────────────────────────────────────────────
   业务代码统一从这里 import：

     import { fetchSubjects, type Subject } from '@/api'

   ── 关于下面这行 `import './mock'` ──
   mock 路由是「副作用注册」：模块被加载时才把接口登记进 mock 服务。
   现在必须加载；**后端接好后，删掉这一行（并关掉 client 里的 USE_MOCK）即可**。
   ════════════════════════════════════════════════════════════════ */

import './mock'

export { ApiError, USE_MOCK, API_BASE } from './client'

export type {
  ApiEnvelope,
  ChildProfile,
  Subject,
  SubjectId,
  TodayProgress,
  WeekDayRecord,
  WeeklyRecord,
} from './types'

export { fetchProfile } from './endpoints/profile'
export { fetchSubjects } from './endpoints/subjects'
export { fetchTodayProgress, fetchWeeklyRecord } from './endpoints/progress'
