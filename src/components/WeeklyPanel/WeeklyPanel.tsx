import type { ApiError, WeeklyRecord } from '@/api'
import { Panel } from '@/components/Panel/Panel'
import styles from './WeeklyPanel.module.css'

const SKELETON_DAYS = 7

interface WeeklyPanelProps {
  data: WeeklyRecord | null
  loading: boolean
  error: ApiError | null
  onRetry: () => void
  onDetail: () => void
}

/** 右栏下卡：最近一周学习记录 */
export function WeeklyPanel({ data, loading, error, onRetry, onDetail }: WeeklyPanelProps) {
  return (
    <Panel
      title="最近一周"
      hint="学习记录"
      action="全部记录 ›"
      onAction={onDetail}
      error={error}
      onRetry={onRetry}
    >
      <div className={styles.days}>
        {loading || !data
          ? Array.from({ length: SKELETON_DAYS }, (_, i) => (
              <div key={i} className={styles.day} aria-hidden="true">
                <span className={styles.label} />
                <span className={`${styles.cell} ${styles.skel}`} />
              </div>
            ))
          : data.days.map((d) => (
              <div key={d.date} className={styles.day}>
                <span className={styles.label} aria-hidden="true">
                  {d.label}
                </span>
                <span
                  className={[
                    styles.cell,
                    d.stars > 0 ? styles.on : '',
                    d.isToday ? styles.today : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  /* 星星是纯 emoji，读屏软件读不出"周几几颗星"，这里补一句完整描述 */
                  aria-label={`${d.label}${d.isToday ? '（今天）' : ''}：${
                    d.stars > 0 ? `${d.stars} 颗星` : '没有学习'
                  }`}
                >
                  {d.stars > 0 && (
                    <>
                      <em aria-hidden="true">⭐</em>
                      <b aria-hidden="true">{d.stars}</b>
                    </>
                  )}
                </span>
              </div>
            ))}
      </div>

      <div className={styles.sum}>
        <Stat label="连续打卡（天）" value={data?.streakDays} loading={loading} />
        <Stat label="本月打卡（天）" value={data?.monthCheckInDays} loading={loading} />
        <Stat label="本周星星" value={data?.weekStars} loading={loading} />
      </div>
    </Panel>
  )
}

function Stat({
  label,
  value,
  loading,
}: {
  label: string
  value: number | undefined
  loading: boolean
}) {
  return (
    <div className={styles.stat}>
      {loading ? <span className={styles.skelNum} aria-hidden="true" /> : <b>{value ?? 0}</b>}
      <span>{label}</span>
    </div>
  )
}
