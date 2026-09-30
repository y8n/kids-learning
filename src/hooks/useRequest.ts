/* ════════════════════════════════════════════════════════════════
   useRequest —— 极简的请求状态管理
   ────────────────────────────────────────────────────────────────
   把「加载中 / 出错 / 拿到数据」三态收敛成一个 hook，页面里不用重复写。
   后面如果引入 SWR / React Query，替换这一个文件即可，页面不用动。

   用法：
     const { data, loading, error, reload } = useRequest(fetchSubjects)
   ════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '@/api'

export interface UseRequestResult<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
  /** 手动重新请求（下拉刷新、重试按钮用） */
  reload: () => void
}

export function useRequest<T>(fetcher: (signal?: AbortSignal) => Promise<T>): UseRequestResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [tick, setTick] = useState(0)

  // 用 ref 存 fetcher，避免调用方每次渲染传新函数导致重复请求
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    const controller = new AbortController()
    let alive = true

    setLoading(true)
    setError(null)

    fetcherRef
      .current(controller.signal)
      .then((res) => {
        if (!alive) return
        setData(res)
      })
      .catch((err: unknown) => {
        if (!alive || (err as Error)?.name === 'AbortError') return
        setError(err instanceof ApiError ? err : new ApiError(0, '未知错误', 'unknown'))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
      controller.abort()
    }
  }, [tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])

  return { data, loading, error, reload }
}
