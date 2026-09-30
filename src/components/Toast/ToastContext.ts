import { createContext } from 'react'

/** 弹一条轻提示 */
export type ShowToast = (text: string) => void

/**
 * 单独放一个文件，是为了让 Provider 组件和 useToast hook 分开导出 ——
 * 同一个文件里既导出组件又导出 hook 会让 React Fast Refresh 失效。
 */
export const ToastContext = createContext<ShowToast | null>(null)
