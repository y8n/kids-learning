/* ════════════════════════════════════════════════════════════════
   Mock 入口
   ────────────────────────────────────────────────────────────────
   这里只做一件事：把所有 handler 模块 import 进来，触发它们的
   defineMock() 注册。新增接口时，写一个 handler 文件、在这里加一行 import 即可。
   ════════════════════════════════════════════════════════════════ */

import './handlers/profile'
import './handlers/subjects'
import './handlers/progress'

export { listMockRoutes } from './server'
