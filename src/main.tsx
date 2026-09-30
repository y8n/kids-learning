import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { startVersionWatch } from './lib/versionWatch'
import './styles/global.css'

const container = document.getElementById('root')
if (!container) throw new Error('#root not found')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA 会一直挂在前台、不发起任何请求，靠它把新部署的版本刷进来
startVersionWatch()
