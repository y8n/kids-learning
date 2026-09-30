import { useCallback } from 'react'
import {
  fetchProfile,
  fetchSubjects,
  fetchTodayProgress,
  fetchWeeklyRecord,
  type Subject,
} from '@/api'
import { useRequest } from '@/hooks/useRequest'
import { useToast } from '@/components/Toast/useToast'
import { COMING_SOON_TEXT, SUBJECT_SKELETON_COUNT } from '@/constants/ui'
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

  // 轻提示由全局 ToastProvider 提供（版本号的点击提示也走它）
  const showToast = useToast()

  /* ── 交互 ── */
  const handleSelectSubject = useCallback(
    (subject: Subject) => {
      if (!subject.enabled) {
        showToast(COMING_SOON_TEXT(subject.name))
        return
      }
      // TODO: 路由接入后跳转到该学科的课程页
      showToast(`进入「${subject.name}」`)
    },
    [showToast],
  )

  const handleContinue = useCallback(() => {
    showToast('进入今日学习')
  }, [showToast])

  const handleDetail = useCallback(
    (what: string) => {
      // TODO: 路由接入后跳转
      showToast(`${what}（待接入）`)
    },
    [showToast],
  )

  return (
    <div className={styles.app}>
      <TopBar
        profile={profile.data}
        loading={profile.loading}
        error={profile.error}
        onRetryProfile={profile.reload}
        onOpenProfile={() => handleDetail('个人中心')}
      />

      <main className={styles.main}>
        {subjects.error ? (
          <div className={styles.error} role="alert">
            <span className={styles.errorIcon} aria-hidden="true">
              📚
            </span>
            <b className={styles.errorTitle}>学科加载失败</b>
            <span className={styles.errorMsg}>{subjects.error.message}</span>
            <button type="button" className={styles.retry} onClick={subjects.reload}>
              重新加载
            </button>
          </div>
        ) : (
          <section className={styles.subjects} aria-label="学科入口">
            {subjects.loading || !subjects.data
              ? Array.from({ length: SUBJECT_SKELETON_COUNT }, (_, i) => (
                  <div key={i} className={styles.subjectSkeleton} aria-hidden="true" />
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
            error={today.error}
            onRetry={today.reload}
            onContinue={handleContinue}
            onDetail={() => handleDetail('今日详情')}
          />
          <WeeklyPanel
            data={weekly.data}
            loading={weekly.loading}
            error={weekly.error}
            onRetry={weekly.reload}
            onDetail={() => handleDetail('全部记录')}
          />
        </aside>
      </main>
    </div>
  )
}
