/* ════════════════════════════════════════════════════════════════
   useRequest —— 极简的请求状态管理
   ────────────────────────────────────────────────────────────────
   把「加载中 / 出错 / 拿到数据」三态收敛成一个 hook，页面里不用重复写。
   后面如果引入 SWR / React Query，替换这一个文件即可，页面不用动。

   用法：
     const { data, loading, error, reload } = useRequest(fetchSubjects)

   ⚠️ fetcher 必须是**稳定引用**（模块级函数或 useCallback 包过的函数）。
      它出现在 effect 依赖里，每次渲染传新的箭头函数会导致无限请求。
      src/api/endpoints/ 导出的都是模块级函数，直接用即可。
   ════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/api'

type Status = 'loading' | 'success' | 'error'

interface RequestState<T> {
  data: T | null
  error: ApiError | null
  status: Status
}

export interface UseRequestResult<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
  /** 手动重新请求（下拉刷新、重试按钮用） */
  reload: () => void
}

function toApiError(err: unknown): ApiError {
  return err instanceof ApiError ? err : new ApiError(0, '未知错误，请稍后重试', 'unknown')
}

const INITIAL = { data: null, error: null, status: 'loading' } as const

export function useRequest<T>(fetcher: (signal?: AbortSignal) => Promise<T>): UseRequestResult<T> {
  const [state, setState] = useState<RequestState<T>>(INITIAL)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let alive = true

    // 注意：这里刻意**不在 effect 主体里同步 setState**。
    // 同步 setState 会触发级联渲染（react-hooks/set-state-in-effect），
    // 而 loading 状态由 reload() 在事件回调里切换，初始值本身就是 loading。
    fetcher(controller.signal)
      .then((data) => {
        if (alive) setState({ data, error: null, status: 'success' })
      })
      .catch((err: unknown) => {
        if (!alive || (err as Error)?.name === 'AbortError') return
        setState({ data: null, error: toApiError(err), status: 'error' })
      })

    return () => {
      alive = false
      controller.abort()
    }
  }, [fetcher, tick])

  const reload = useCallback(() => {
    // 事件回调里切换状态是安全的
    setState((prev) => ({ ...prev, error: null, status: 'loading' }))
    setTick((t) => t + 1)
  }, [])

  return {
    data: state.data,
    loading: state.status === 'loading',
    error: state.error,
    reload,
  }
}
