import type { TodayProgress } from '@/api'
import { Panel } from '@/components/Panel/Panel'
import styles from './TodayPanel.module.css'

interface TodayPanelProps {
  data: TodayProgress | null
  loading: boolean
  onContinue: () => void
  onDetail: () => void
}

/** 右栏上卡：今日学习入口（只给进度，不铺细节，留白给"继续"按钮） */
export function TodayPanel({ data, loading, onContinue, onDetail }: TodayPanelProps) {
  const total = data?.total ?? 0
  const completed = data?.completed ?? 0
  const percent = total > 0 ? (completed / total) * 100 : 0

  return (
    <Panel
      title="今日学习"
      hint={loading ? '' : `${Math.max(total - completed, 0)} 项待完成`}
      action="查看详情 ›"
      onAction={onDetail}
    >
      <div className={styles.big}>
        {loading ? (
          <span className={styles.skel} />
        ) : (
          <>
            <b>
              {completed}/{total}
            </b>
            <span>
              {completed > 0 ? `今天已经完成 ${completed} 项啦` : '今天还没有开始哦'}
            </span>
          </>
        )}
      </div>

      <div className={styles.bar}>
        <i style={{ width: `${percent}%` }} />
      </div>

      <button type="button" className={styles.go} onClick={onContinue}>
        ▶&nbsp; 继续今天的学习
      </button>
    </Panel>
  )
}
