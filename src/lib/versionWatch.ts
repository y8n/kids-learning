import { BUILD_TIME_ISO } from '../constants/version'

/**
 * 版本自检：部署了新版本后，自动把**已经打开的页面**刷新到新版。
 *
 * ── 为什么需要它 ──
 * 这个应用的主要用法是「添加到主屏幕」的 PWA 全屏模式，那个页面会**一直挂在前台**，
 * 自己不发起任何网络请求，所以永远停在打开时的那个版本 —— 改了东西也看不到。
 *
 * 而「关掉重开」也不一定能拿到新版：
 * GitHub Pages 给 index.html 的是 `cache-control: max-age=600`，
 * 10 分钟内重新打开照样可能命中缓存里的**旧 HTML**；
 * 旧 HTML 又指向旧的 hash 资源（assets/index-<hash>.js），于是整个应用还是旧的。
 *
 * ── 它怎么工作 ──
 * 构建时会额外产出 `version.json`，内容与打进 bundle 的 `__BUILD_TIME__` 是同一个值。
 * 这里定期用 `cache: 'no-store'` 拉它，发现构建时间变了就强制刷新。
 *
 * 刷新用的是「带一个新的查询参数再 replace」而不是 `location.reload()`：
 * 缓存是按完整 URL 索引的，换个 URL 就必然绕过缓存，不依赖 reload 的重验行为。
 * `replace` 不新增历史记录，路由的 path 也不受影响。
 */

/** 轮询间隔。PWA 挂在前台时，最长等这么久就会自动更新。 */
const CHECK_INTERVAL_MS = 30_000

function forceRefresh(): void {
  try {
    const url = new URL(window.location.href)
    url.searchParams.set('__v', String(Date.now()))
    window.location.replace(url.toString())
  } catch {
    window.location.reload()
  }
}

export function startVersionWatch(): void {
  // 开发时热更新已经处理了，别在这里捣乱
  if (import.meta.env.DEV) return

  let refreshing = false

  const check = async (): Promise<void> => {
    if (refreshing) return
    try {
      const res = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' })
      if (!res.ok) return
      const data: unknown = await res.json()
      const buildTime =
        typeof data === 'object' && data !== null && 'buildTime' in data
          ? (data as { buildTime?: unknown }).buildTime
          : undefined

      if (typeof buildTime === 'string' && buildTime && buildTime !== BUILD_TIME_ISO) {
        refreshing = true
        forceRefresh()
      }
    } catch {
      // 离线、切网、Pages 抖动都属正常，静默跳过，等下一轮
    }
  }

  window.setInterval(() => {
    // 页面不可见时不请求，别浪费用户的电和流量
    if (document.visibilityState === 'visible') void check()
  }, CHECK_INTERVAL_MS)

  // 从后台切回前台时立刻查一次，这是最可能已经发生部署的时刻
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void check()
  })
}
