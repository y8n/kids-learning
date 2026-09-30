import type { ReactNode } from 'react'
import type { ApiError } from '@/api'
import styles from './Panel.module.css'

interface PanelProps {
  title: string
  /** 标题右侧的次要说明，如「8 项待完成」 */
  hint?: string
  /** 右上角操作文字，如「查看详情 ›」 */
  action?: string
  onAction?: () => void
  /** 数据加载失败时传入，面板会在内容区显示错误提示而**不是**显示空数据 */
  error?: ApiError | null
  onRetry?: () => void
  children: ReactNode
}

/**
 * 右栏卡片的公共外壳：毛玻璃面板 + 标题行
 *
 * 关于 error：接口挂掉时如果只是把 data 当 null 渲染，页面会显示
 * 「今天还没有开始哦」「连续打卡 0 天」这类**错误但看起来正常**的数据。
 * 对打卡类应用这是数据可信度问题，所以错误态必须在面板内部显式呈现。
 */
export function Panel({ title, hint, action, onAction, error, onRetry, children }: PanelProps) {
  return (
    <section className={styles.panel}>
      <span className={styles.glow} aria-hidden="true" />

      <header className={styles.head}>
        <b className={styles.title}>{title}</b>
        {hint && <span className={styles.hint}>{hint}</span>}
        {action && !error && (
          <button type="button" className={styles.action} onClick={onAction}>
            {action}
          </button>
        )}
      </header>

      <div className={styles.body}>
        {error ? (
          <div className={styles.errorBox} role="alert">
            <span className={styles.errorIcon} aria-hidden="true">
              ⚠️
            </span>
            <span className={styles.errorText}>{error.message}</span>
            {onRetry && (
              <button type="button" className={styles.errorRetry} onClick={onRetry}>
                重试
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}
