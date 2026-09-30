import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Home } from '@/pages/Home/Home'

/**
 * GitHub Pages 的项目页部署在子路径下：
 *   https://y8n.github.io/kids-learning/
 * 所以路由必须带上 basename，否则刷新子页面会 404。
 * （构建时 vite 的 base 与这里是同一个前缀）
 */
const BASENAME = import.meta.env.BASE_URL

export default function App() {
  return (
    <BrowserRouter basename={BASENAME}>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* 后续页面先占位，做出 404 兜底 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
