import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchProfile,
  fetchSubjects,
  fetchTodayProgress,
  fetchWeeklyRecord,
  type Subject,
} from '@/api'
import { useRequest } from '@/hooks/useRequest'
import { TopBar } from '@/components/TopBar/TopBar'
import { SubjectCard } from '@/components/SubjectCard/SubjectCard'
import { TodayPanel } from '@/components/TodayPanel/TodayPanel'
import { WeeklyPanel } from '@/components/WeeklyPanel/WeeklyPanel'
import styles from './Home.module.css'

export function Home() {
  const profile = useRequest(fetchProfile)
  const subjects = useRequest(fetchSubjects)
  const today = useRequest(fetchTodayProgress)
  const weekly = useRequest(fetchWeeklyRecord)

  /* ── 轻提示 ── */
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | null>(null)

  const showToast = useCallback((text: string) => {
    setToast(text)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 1800)
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
    }
  }, [])

  /* ── 交互 ── */
  const handleSelectSubject = useCallback(
    (subject: Subject) => {
      if (!subject.enabled) {
        showToast(`「${subject.name}」还在准备中，敬请期待`)
        return
      }
      // TODO: 接入路由后跳转到该学科的课程页
      showToast(`进入「${subject.name}」`)
    },
    [showToast],
  )

  const handleContinue = useCallback(() => {
    showToast('进入今日学习')
  }, [showToast])

  const handleDetail = useCallback((what: string) => {
    // TODO: 接入路由后跳转
    showToast(`${what}（待接入）`)
  }, [showToast])

  const failed = subjects.error

  return (
    <div className={styles.app}>
      <TopBar
        profile={profile.data}
        loading={profile.loading}
        onOpenProfile={() => handleDetail('个人中心')}
      />

      <main className={styles.main}>
        {failed ? (
          <div className={styles.error}>
            <b>内容加载失败</b>
            <span>{failed.message}</span>
            <button type="button" className={styles.retry} onClick={subjects.reload}>
              重新加载
            </button>
          </div>
        ) : (
          <section className={styles.subjects}>
            {subjects.loading || !subjects.data
              ? Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className={styles.subjectSkeleton} />
                ))
              : subjects.data.map((s) => (
                  <SubjectCard key={s.id} subject={s} onSelect={handleSelectSubject} />
                ))}
          </section>
        )}

        <aside className={styles.rail}>
          <TodayPanel
            data={today.data}
            loading={today.loading}
            onContinue={handleContinue}
            onDetail={() => handleDetail('今日详情')}
          />
          <WeeklyPanel
            data={weekly.data}
            loading={weekly.loading}
            onDetail={() => handleDetail('全部记录')}
          />
        </aside>
      </main>

      <div className={`${styles.toast} ${toast ? styles.toastOn : ''}`} role="status">
        {toast}
      </div>
    </div>
  )
}
