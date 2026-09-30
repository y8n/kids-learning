/// <reference types="vite/client" />

/**
 * 构建期由 vite.config.ts 的 define 注入。
 * 版本号来自 package.json，构建时间来自 CI 的 BUILD_TIME（本地构建则取当时时刻）。
 */
declare const __APP_VERSION__: string
declare const __BUILD_TIME__: string

interface ImportMetaEnv {
  /** 'false' 时关闭本地 mock，走真实后端 */
  readonly VITE_USE_MOCK?: string
  /** 真实后端地址，默认 '/api' */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
