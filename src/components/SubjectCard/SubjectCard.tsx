import type { CSSProperties } from 'react'
import type { Subject } from '@/api'
import styles from './SubjectCard.module.css'

interface SubjectCardProps {
  subject: Subject
  onSelect: (subject: Subject) => void
}

/**
 * 学科卡片
 *
 * 版式：左上主标题 → 副标题 → 右下角角色立绘
 * 交互：没有独立按钮，整卡可点，按下时轻微缩放 + 阴影收紧
 *
 * 为什么外面套一层 .slot：
 * 卡片的内部排版要跟着**卡片自身宽度**缩放，而不是跟着视口。
 * 这样在 iPad 横屏、竖屏、手机三种布局下卡片长得完全一样，只是大小不同。
 * 而 `container-type` 只能在祖先元素上声明（元素不能查询自己），所以需要这层壳。
 */
export function SubjectCard({ subject, onSelect }: SubjectCardProps) {
  const { name, subtitle, characterUrl, theme, enabled, artScale, progress } = subject

  return (
    <div className={styles.slot} style={{ '--art-scale': artScale ?? 1 } as CSSProperties}>
      <button
        type="button"
        className={`${styles.card} ${enabled ? '' : styles.locked}`}
        style={{
          backgroundImage: `linear-gradient(140deg, ${theme.from} 0%, ${theme.to} 100%)`,
        }}
        onClick={() => onSelect(subject)}
        aria-disabled={!enabled}
        aria-label={
          enabled
            ? `${name}：${subtitle}${progress.total > 0 ? `，今日进度 ${progress.done}/${progress.total}` : ''}`
            : `${name}：${subtitle}，尚未开放`
        }
      >
        <span className={styles.glow} aria-hidden="true" />

        <span className={styles.text}>
          <b className={styles.name}>{name}</b>
          <span className={styles.subtitle}>{subtitle}</span>
        </span>

        <img className={styles.art} src={characterUrl} alt="" draggable={false} />

        {progress.total > 0 && (
          <span className={styles.progress}>
            <span aria-hidden="true">
              {progress.done}/{progress.total}
            </span>
          </span>
        )}
      </button>
    </div>
  )
}
