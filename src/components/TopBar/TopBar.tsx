import type { ApiError, ChildProfile } from '@/api'
import styles from './TopBar.module.css'

const WEEK = ['日', '一', '二', '三', '四', '五', '六']
const pad2 = (n: number) => String(n).padStart(2, '0')

function greetingOf(hour: number): string {
  if (hour < 6) return '夜深了，早点休息哦'
  if (hour < 11) return '早上好，今天也要加油哦'
  if (hour < 13) return '中午好，休息一下再学吧'
  if (hour < 18) return '下午好，今天也要加油哦'
  return '晚上好，今天也要加油哦'
}

interface TopBarProps {
  profile: ChildProfile | null
  loading: boolean
  error: ApiError | null
  onRetryProfile: () => void
  onOpenProfile: () => void
}

/**
 * 顶栏
 * 左：孩子头像 / 昵称 / 等级 / 星星 / 年级
 * 右：日期星期 + 个人中心入口
 *
 * 档案加载失败时显示可点击的「重试」，而不是留一个永远转不完的骨架屏，
 * 也不会拿默认值冒充真实数据（Lv.0 / 0 星）。
 */
export function TopBar({ profile, loading, error, onRetryProfile, onOpenProfile }: TopBarProps) {
  const now = new Date()
  const dateText = `${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} 星期${WEEK[now.getDay()]}`
  const greeting = greetingOf(now.getHours())

  const showSkeleton = loading && !profile

  return (
    <header className={styles.bar}>
      <div className={styles.me}>
        <div className={styles.avatar} aria-hidden="true">
          {profile?.avatar ?? '🐰'}
        </div>

        <div className={styles.who}>
          {error && !profile ? (
            <button type="button" className={styles.retry} onClick={onRetryProfile}>
              资料加载失败 · 点此重试
            </button>
          ) : showSkeleton ? (
            <>
              <span className={`${styles.skel} ${styles.skelName}`} aria-hidden="true" />
              <span className={`${styles.skel} ${styles.skelMeta}`} aria-hidden="true" />
            </>
          ) : profile ? (
            <>
              <b>{profile.name}</b>
              <span>
                Lv.{profile.level} · {profile.stars} ⭐ · {profile.grade}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className={styles.spacer} />

      <div className={styles.date}>
        <b>{dateText}</b>
        <span>{greeting}</span>
      </div>

      <button type="button" className={styles.mine} onClick={onOpenProfile} aria-label="个人中心">
        <span className={styles.mineIcon} aria-hidden="true">
          👤
        </span>
        <span className={styles.mineLabel}>个人中心</span>
      </button>
    </header>
  )
}
