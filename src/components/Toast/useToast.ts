import { useContext } from 'react'
import { ToastContext, type ShowToast } from './ToastContext'

/**
 * 取到全局的 showToast。
 *
 *   const toast = useToast()
 *   toast('已保存')
 *
 * 必须在 <ToastProvider> 内使用，否则直接抛错而不是静默失效 ——
 * 静默失效会让「点了没反应」这种问题很难查。
 */
export function useToast(): ShowToast {
  const show = useContext(ToastContext)
  if (!show) throw new Error('useToast 必须在 <ToastProvider> 内部使用')
  return show
}
