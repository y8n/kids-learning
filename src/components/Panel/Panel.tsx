import type { ReactNode } from 'react'
import styles from './Panel.module.css'

interface PanelProps {
  title: string
  /** 标题右侧的次要说明，如「8 项待完成」 */
  hint?: string
  /** 右上角操作文字，如「查看详情 ›」 */
  action?: string
  onAction?: () => void
  children: ReactNode
}

/** 右栏两张横卡的公共外壳：毛玻璃面板 + 标题行 */
export function Panel({ title, hint, action, onAction, children }: PanelProps) {
  return (
    <section className={styles.panel}>
      <span className={styles.glow} aria-hidden="true" />

      <header className={styles.head}>
        <b className={styles.title}>{title}</b>
        {hint && <span className={styles.hint}>{hint}</span>}
        {action && (
          <button type="button" className={styles.action} onClick={onAction}>
            {action}
          </button>
        )}
      </header>

      <div className={styles.body}>{children}</div>
    </section>
  )
}
