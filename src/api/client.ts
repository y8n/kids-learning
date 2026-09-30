/* ════════════════════════════════════════════════════════════════
   请求客户端 —— 业务代码唯一接触的「出口」
   ────────────────────────────────────────────────────────────────
   设计要点：
   1. 业务代码只调 `request()` / endpoints 里的函数，**从不直接 fetch**。
   2. 现在 USE_MOCK = true，请求被打到本地 mock 服务（见 ./mock/server.ts），
      **包含延迟、状态码、异常**，所以 UI 的 loading / error 分支是真的在跑。
   3. 后端建好后，把 USE_MOCK 改成 false（或配 VITE_USE_MOCK=false），
      下面的 realRequest 就接管了 —— **业务代码零改动**。
   ════════════════════════════════════════════════════════════════ */

import { dispatchMock } from './mock/server'
import type { ApiEnvelope } from './types'

/** 是否使用本地 mock。也可通过环境变量 VITE_USE_MOCK=false 关闭。 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

/** 真实后端地址。将来后端上线后配 VITE_API_BASE 即可。 */
export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestConfig {
  method?: HttpMethod
  /** 相对路径，如 '/subjects'。不要带 /api 前缀，前缀由 client 统一处理 */
  url: string
  /** query 参数，值为 undefined 的会被忽略 */
  query?: Record<string, string | number | boolean | undefined>
  /** 请求体 */
  body?: unknown
  /** 用于取消请求 */
  signal?: AbortSignal
}

/** 统一的错误类型。UI 只认这个，不关心是 mock 还是真实网络出错。 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, message: string, code = 'unknown') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/** 把 config 拼成一个可读的 URL（mock 日志和真实请求共用） */
export function buildUrl(config: RequestConfig): string {
  const qs = new URLSearchParams()
  Object.entries(config.query ?? {}).forEach(([k, v]) => {
    if (v !== undefined) qs.append(k, String(v))
  })
  const suffix = qs.toString()
  return suffix ? `${config.url}?${suffix}` : config.url
}

/**
 * 发起请求。
 * 返回**已解包**的业务数据；失败时抛 ApiError。
 */
export async function request<T>(config: RequestConfig): Promise<T> {
  if (USE_MOCK) {
    return dispatchMock<T>(config)
  }
  return realRequest<T>(config)
}

/* ── 真实后端实现（后端就绪后自动启用）───────────────────────── */

async function realRequest<T>(config: RequestConfig): Promise<T> {
  const { method = 'GET', body, signal } = config
  const url = `${API_BASE}${buildUrl(config)}`

  let res: Response
  try {
    res = await fetch(url, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err
    throw new ApiError(0, '网络连接失败，请检查网络后重试', 'network-error')
  }

  if (!res.ok) {
    throw new ApiError(res.status, `请求失败（HTTP ${res.status}）`, 'http-error')
  }

  const payload = (await res.json()) as ApiEnvelope<T> | T
  // 兼容两种后端风格：带信封 { code, message, data } 或直接返回数据
  if (payload && typeof payload === 'object' && 'data' in payload && 'code' in payload) {
    const env = payload as ApiEnvelope<T>
    if (env.code !== 0) throw new ApiError(res.status, env.message || '业务处理失败', 'business-error')
    return env.data
  }
  return payload as T
}
