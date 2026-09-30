import { Component, type ErrorInfo, type ReactNode } from 'react'
import styles from './ErrorBoundary.module.css'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * 应用级错误边界
 *
 * 没有它的话，任意组件在渲染期抛错都会让**整棵 React 树卸载**，
 * 用户看到的是纯白屏、没有任何信息。这里兜住并给一个可操作的恢复入口。
 *
 * 注意：错误边界只捕获**渲染期**错误。事件回调里的异步错误不会走到这里，
 * 那部分由 src/api/client.ts 的 ApiError + 各面板的 error 态负责。
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 目前没有接监控平台，先留在控制台方便排查；接入 Sentry 后从这里上报
    console.error('[ErrorBoundary] 渲染期异常：', error, info.componentStack)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleReset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className={styles.wrap} role="alert">
        <div className={styles.card}>
          <span className={styles.icon} aria-hidden="true">
            🛠️
          </span>
          <h1 className={styles.title}>页面出了点小问题</h1>
          <p className={styles.desc}>别担心，刷新一下通常就好了。</p>

          {/* 开发环境把错误信息露出来方便定位，生产环境不暴露细节 */}
          {import.meta.env.DEV && <pre className={styles.detail}>{error.message}</pre>}

          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={this.handleReload}>
              刷新页面
            </button>
            <button type="button" className={styles.ghost} onClick={this.handleReset}>
              返回
            </button>
          </div>
        </div>
      </div>
    )
  }
}
