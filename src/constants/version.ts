/* ════════════════════════════════════════════════════════════════
   版本与构建信息
   ────────────────────────────────────────────────────────────────
   版本号：唯一来源是 package.json 的 `version`，构建时由 vite.config.ts
           通过 define 注入成 __APP_VERSION__，**代码里不要再手写一份**。
   构建时间：CI 由 .github/workflows/static.yml 注入 BUILD_TIME
           （= GitHub Actions 的工作流触发时刻）；本地构建退回当时时刻。

   发布流程见仓库根目录的 AGENTS.md。
   ════════════════════════════════════════════════════════════════ */

export const APP_VERSION = __APP_VERSION__

/** 构建时刻的 ISO 8601 字符串，如 2026-09-30T10:08:15Z */
export const BUILD_TIME_ISO = __BUILD_TIME__

/** 页面上展示的版本号，形如 v0.1.0 */
export const VERSION_LABEL = `v${APP_VERSION}`

/**
 * 固定按 Asia/Shanghai 格式化。
 * 构建机器在 UTC、用户可能在任何时区，固定时区才能保证同一份构建产物
 * 在任何地方显示的构建时间都一致。
 */
const SHANGHAI_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

/** 把 ISO 时间格式化成 yyyy-MM-dd HH:mm:ss */
export function formatBuildTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    SHANGHAI_FORMATTER.formatToParts(date).find((p) => p.type === type)?.value ?? ''

  return `${part('year')}-${part('month')}-${part('day')} ${part('hour')}:${part('minute')}:${part('second')}`
}

/** 形如 2026-09-30 18:08:15 */
export const BUILD_TIME_LABEL = formatBuildTime(BUILD_TIME_ISO)

/** 点击版本号时弹出的提示文案 */
export const VERSION_TOAST = `${VERSION_LABEL}发布于${BUILD_TIME_LABEL}`
