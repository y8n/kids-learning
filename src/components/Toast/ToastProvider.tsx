import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { TOAST_DURATION_MS } from '@/constants/ui'
import { ToastContext, type ShowToast } from './ToastContext'
import styles from './Toast.module.css'

/**
 * 全局轻提示。
 *
 * 容器始终挂在 DOM 上（只是 opacity 为 0）—— role="status" 属于 live region，
 * 必须**先存在、后变内容**，屏幕阅读器才会播报；动态插入整个节点通常不会被读到。
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  const show = useCallback<ShowToast>((next) => {
    setText(next)
    // 连续触发时重置计时，避免前一条的计时器把后一条提前收掉
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setText(null), TOAST_DURATION_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [])

  const value = useMemo(() => show, [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={`${styles.toast} ${text ? styles.on : ''}`} role="status">
        {text}
      </div>
    </ToastContext.Provider>
  )
}
