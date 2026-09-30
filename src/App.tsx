import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary'
import { ToastProvider } from '@/components/Toast/ToastProvider'
import { VersionBadge } from '@/components/VersionBadge/VersionBadge'
import { Home } from '@/pages/Home/Home'

/**
 * GitHub Pages 的项目页部署在子路径下（https://y8n.github.io/kids-learning/），
 * 路由必须带上 basename，否则刷新子页面会 404。
 * 这里直接复用 Vite 注入的 BASE_URL，与构建时的 base 永远一致。
 */
const BASENAME = import.meta.env.BASE_URL

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter basename={BASENAME}>
          <Routes>
            <Route path="/" element={<Home />} />
            {/* 未匹配的路径回首页，避免出现空白页 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        {/* 版本号挂在路由外面：以后加了课程页，它依然常驻右下角 */}
        <VersionBadge />
      </ToastProvider>
    </ErrorBoundary>
  )
}
