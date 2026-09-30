import type { ApiError, TodayProgress } from '@/api'
import { Panel } from '@/components/Panel/Panel'
import styles from './TodayPanel.module.css'

interface TodayPanelProps {
  data: TodayProgress | null
  loading: boolean
  error: ApiError | null
  onRetry: () => void
  onContinue: () => void
  onDetail: () => void
}

/** 右栏上卡：今日学习入口（只给进度，不铺细节，留白给"继续"按钮） */
export function TodayPanel({
  data,
  loading,
  error,
  onRetry,
  onContinue,
  onDetail,
}: TodayPanelProps) {
  const total = data?.total ?? 0
  const completed = data?.completed ?? 0
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  const remaining = Math.max(total - completed, 0)

  return (
    <Panel
      title="今日学习"
      hint={loading || error ? '' : `${remaining} 项待完成`}
      action="查看详情 ›"
      onAction={onDetail}
      error={error}
      onRetry={onRetry}
    >
      <div className={styles.big}>
        {loading ? (
          <span className={styles.skel} aria-hidden="true" />
        ) : (
          <>
            <b>
              {completed}/{total}
            </b>
            <span>{completed > 0 ? `今天已经完成 ${completed} 项啦` : '今天还没有开始哦'}</span>
          </>
        )}
      </div>

      {/* 进度条给屏幕阅读器完整语义，而不是一个光秃秃的 <div> */}
      <div
        className={styles.bar}
        role="progressbar"
        aria-label="今日学习进度"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
        aria-valuetext={total > 0 ? `${total} 项中已完成 ${completed} 项` : '今天没有安排'}
      >
        <i style={{ width: `${percent}%` }} />
      </div>

      <button type="button" className={styles.go} onClick={onContinue}>
        <span aria-hidden="true">▶</span>
        继续今天的学习
      </button>
    </Panel>
  )
}
