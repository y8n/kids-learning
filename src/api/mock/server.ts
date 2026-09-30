/* ════════════════════════════════════════════════════════════════
   本地 Mock 服务 —— 模拟的不只是「数据」，还有「调用过程」
   ────────────────────────────────────────────────────────────────
   和直接写死一个常量对象不同，这里模拟了真实的网络行为：

     · 路由匹配（支持 /subjects/:id 这种动态段）
     · 延迟（默认 120~420ms 随机，可用 query 覆盖）
     · HTTP 状态码与业务错误码 → 抛 ApiError
     · 主动制造失败：任意请求加 ?__fail=1 就返回 500
                   加 ?__slow=1500 就延迟 1.5 秒
     · AbortSignal 取消

   这样写出来的页面，loading / empty / error 三种状态都是**真的能跑到的**，
   而不是等接上后端才发现没处理。
   ════════════════════════════════════════════════════════════════ */

import { ApiError, buildUrl, type RequestConfig } from '../client'

export interface MockContext {
  params: Record<string, string>
  query: URLSearchParams
  body: unknown
  method: string
  url: string
}

export type MockHandler = (ctx: MockContext) => unknown | Promise<unknown>

interface Route {
  method: string
  keys: string[]
  regex: RegExp
  handler: MockHandler
}

const routes: Route[] = []

/** 注册一条 mock 路由。path 支持 :id 动态段，如 '/subjects/:id' */
export function defineMock(method: string, path: string, handler: MockHandler): void {
  const keys: string[] = []
  const pattern = path
    .replace(/[.+*?^${}()|[\]\\]/g, '\\$&')
    .replace(/:([A-Za-z0-9_]+)/g, (_m, key: string) => {
      keys.push(key)
      return '([^/]+)'
    })
  routes.push({ method: method.toUpperCase(), keys, regex: new RegExp(`^${pattern}$`), handler })
}

/* ── 模拟网络延迟 ─────────────────────────────────────────────── */

const MIN_DELAY = 120
const MAX_DELAY = 420

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError())
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    function onAbort() {
      clearTimeout(timer)
      reject(abortError())
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function abortError(): Error {
  const e = new Error('The operation was aborted.')
  e.name = 'AbortError'
  return e
}

/* ── 派发 ─────────────────────────────────────────────────────── */

export async function dispatchMock<T>(config: RequestConfig): Promise<T> {
  const method = (config.method ?? 'GET').toUpperCase()
  const full = buildUrl(config)
  const [path, search = ''] = full.split('?')
  const query = new URLSearchParams(search)

  // 主动制造故障，用来验证 UI 的错误分支
  const slow = Number(query.get('__slow') ?? 0)
  await delay(slow > 0 ? slow : MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY), config.signal)

  if (query.get('__fail') === '1') {
    throw new ApiError(500, '服务器开小差了，请稍后重试', 'mock-server-error')
  }

  const route = routes.find((r) => r.method === method && r.regex.test(path))
  if (!route) {
    throw new ApiError(404, `Mock 接口不存在：${method} ${path}`, 'mock-not-found')
  }

  const matched = route.regex.exec(path)!
  const params: Record<string, string> = {}
  route.keys.forEach((key, i) => {
    params[key] = decodeURIComponent(matched[i + 1] ?? '')
  })

  // 未来做鉴权时，这里可以读 localStorage 里的 token 并抛 401
  // const token = localStorage.getItem('token')
  // if (!token) throw new ApiError(401, '登录已过期', 'unauthorized')

  return (await route.handler({ params, query, body: config.body, method, url: path })) as T
}

/** 仅用于调试：列出已注册的接口 */
export function listMockRoutes(): string[] {
  return routes.map((r) => `${r.method} ${r.regex.source}`)
}
