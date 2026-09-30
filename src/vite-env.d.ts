/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'false' 时关闭本地 mock，走真实后端 */
  readonly VITE_USE_MOCK?: string
  /** 真实后端地址，默认 '/api' */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
