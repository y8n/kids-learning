import type { ApiError, WeeklyRecord } from '@/api'
import { Panel } from '@/components/Panel/Panel'
import styles from './WeeklyPanel.module.css'

const SKELETON_DAYS = 7

/** 一天最多显示 3 颗星，多出来的不再堆（空位留给「没学」的线框星） */
const MAX_STARS = 3

interface WeeklyPanelProps {
  data: WeeklyRecord | null
  loading: boolean
  error: ApiError | null
  onRetry: () => void
  onDetail: () => void
}

/** 右栏下卡：本周学习记录（自然周，周一 → 周日） */
export function WeeklyPanel({ data, loading, error, onRetry, onDetail }: WeeklyPanelProps) {
  return (
    <Panel
      title="本周"
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
                  <Stars count={d.stars} />
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

/**
 * 星星 —— 只按数量画，不写数字：
 *   0 颗 → 一个不填充的线框星（这天没拿到星）
 *   1 颗 → 和原来一样的一颗
 *   2 颗 → 小一号，并排
 *   3 颗 → 在 2 颗的基础上，下面再放一颗（上二下一）
 * 具体排布由 CSS 按 `data-count` 切换，见 WeeklyPanel.module.css。
 */
function Stars({ count }: { count: number }) {
  const filled = Math.min(Math.max(count, 0), MAX_STARS)

  if (filled === 0) {
    return (
      <i className={styles.emptyStar} aria-hidden="true">
        ☆
      </i>
    )
  }

  return (
    <span className={styles.stars} data-count={filled} aria-hidden="true">
      {Array.from({ length: filled }, (_, i) => (
        <i key={i} className={styles.star}>
          ⭐
        </i>
      ))}
    </span>
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
