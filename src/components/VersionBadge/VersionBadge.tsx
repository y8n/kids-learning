import { useToast } from '@/components/Toast/useToast'
import { BUILD_TIME_LABEL, VERSION_LABEL, VERSION_TOAST } from '@/constants/version'
import styles from './VersionBadge.module.css'

/**
 * 右下角版本号。
 *
 * 版本号和构建时间都是**构建期注入**的（见 src/constants/version.ts），
 * 不是运行时算的 —— 所以同一份产物在任何设备、任何时区看到的都一样。
 *
 * 点击弹出「v0.1.0发布于2026-09-30 18:08:15」，方便确认线上跑的是哪一版。
 */
export function VersionBadge() {
  const toast = useToast()

  return (
    <button
      type="button"
      className={styles.badge}
      onClick={() => toast(VERSION_TOAST)}
      aria-label={`版本 ${VERSION_LABEL}，构建于 ${BUILD_TIME_LABEL}，点击查看详情`}
    >
      {VERSION_LABEL}
    </button>
  )
}
