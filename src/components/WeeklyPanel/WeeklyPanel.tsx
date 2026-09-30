import type { WeeklyRecord } from '@/api'
import { Panel } from '@/components/Panel/Panel'
import styles from './WeeklyPanel.module.css'

interface WeeklyPanelProps {
  data: WeeklyRecord | null
  loading: boolean
  onDetail: () => void
}

/** 右栏下卡：最近一周学习记录 */
export function WeeklyPanel({ data, loading, onDetail }: WeeklyPanelProps) {
  return (
    <Panel title="最近一周" hint="学习记录" action="全部记录 ›" onAction={onDetail}>
      <div className={styles.days}>
        {loading || !data
          ? Array.from({ length: 7 }, (_, i) => (
              <div key={i} className={styles.day}>
                <span className={styles.label} />
                <span className={`${styles.cell} ${styles.skel}`} />
              </div>
            ))
          : data.days.map((d) => (
              <div key={d.date} className={styles.day}>
                <span className={styles.label}>{d.label}</span>
                <span
                  className={[
                    styles.cell,
                    d.stars > 0 ? styles.on : '',
                    d.isToday ? styles.today : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {d.stars > 0 && (
                    <>
                      <em>⭐</em>
                      <b>{d.stars}</b>
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
      {loading ? <span className={styles.skelNum} /> : <b>{value ?? 0}</b>}
      <span>{label}</span>
    </div>
  )
}
