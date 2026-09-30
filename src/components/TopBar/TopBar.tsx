import type { ChildProfile } from '@/api'
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
  onOpenProfile?: () => void
}

/**
 * 顶栏
 * 左：孩子头像 / 昵称 / 等级 / 星星 / 年级
 * 右：日期星期 + 个人中心入口
 */
export function TopBar({ profile, loading, onOpenProfile }: TopBarProps) {
  const now = new Date()
  const dateText = `${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} 星期${WEEK[now.getDay()]}`
  const greeting = greetingOf(now.getHours())

  return (
    <header className={styles.bar}>
      <div className={styles.me}>
        <div className={styles.avatar}>{profile?.avatar ?? '🐰'}</div>
        <div className={styles.who}>
          {loading || !profile ? (
            <>
              <span className={`${styles.skel} ${styles.skelName}`} />
              <span className={`${styles.skel} ${styles.skelMeta}`} />
            </>
          ) : (
            <>
              <b>{profile.name}</b>
              <span>
                Lv.{profile.level} · {profile.stars} ⭐ · {profile.grade}
              </span>
            </>
          )}
        </div>
      </div>

      <div className={styles.spacer} />

      <div className={styles.date}>
        <b>{dateText}</b>
        <span>{greeting}</span>
      </div>

      <button type="button" className={styles.mine} onClick={onOpenProfile}>
        👤 个人中心
      </button>
    </header>
  )
}
