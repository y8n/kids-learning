import type { Subject } from '@/api'
import styles from './SubjectCard.module.css'

interface SubjectCardProps {
  subject: Subject
  onSelect: (subject: Subject) => void
}

/**
 * 学科卡片
 * 版式：左上主标题 → 副标题 → 右下角角色立绘
 * 交互：没有按钮，整卡可点，按下时轻微缩放 + 阴影变化
 */
export function SubjectCard({ subject, onSelect }: SubjectCardProps) {
  const { name, subtitle, characterUrl, theme, enabled, progress } = subject

  return (
    <button
      type="button"
      className={`${styles.card} ${enabled ? '' : styles.locked}`}
      data-subject={subject.id}
      style={{
        backgroundImage: `linear-gradient(140deg, ${theme.from} 0%, ${theme.to} 100%)`,
      }}
      onClick={() => onSelect(subject)}
      aria-label={`${name}：${subtitle}`}
    >
      <span className={styles.glow} aria-hidden="true" />

      <span className={styles.text}>
        <b className={styles.name}>{name}</b>
        <span className={styles.subtitle}>{subtitle}</span>
      </span>

      <img className={styles.art} src={characterUrl} alt="" draggable={false} />

      {progress.total > 0 && (
        <span className={styles.progress}>
          {progress.done}/{progress.total}
        </span>
      )}
    </button>
  )
}
