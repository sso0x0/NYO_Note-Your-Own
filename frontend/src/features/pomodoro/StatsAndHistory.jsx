import { useEffect, useState } from 'react'
import { getRecords, getTodayStudyTime, getTotalStudyTime } from '../../api/pomodoro'

// 오늘/전체 누적 공부 시간과 최근 기록 목록. Timer가 세션을 끝낼 때마다
// refreshKey를 바꿔주면 이 컴포넌트가 다시 조회한다 (부모→자식 리프레시 신호).
export default function StatsAndHistory({ refreshKey }) {
  const [today, setToday] = useState(null)
  const [total, setTotal] = useState(null)
  const [records, setRecords] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    // refreshKey가 바뀌는 사이에 이전 요청이 늦게 끝나 화면을 덮어쓰지 않도록 가드
    let cancelled = false
    async function load() {
      try {
        const [todayRes, totalRes, recordsRes] = await Promise.all([
          getTodayStudyTime(),
          getTotalStudyTime(),
          getRecords(),
        ])
        if (cancelled) return
        setToday(todayRes.totalFocusMinutes)
        setTotal(totalRes.totalFocusMinutes)
        setRecords(recordsRes.content)
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }
    load()
    return () => { cancelled = true }
  }, [refreshKey])

  if (error) return <p className="pomodoro-error">{error}</p>

  return (
      <div className="pomodoro-stats">
        <div className="pomodoro-stats-row">
          <div><span>오늘</span><strong>{today ?? 0}분</strong></div>
          <div><span>전체</span><strong>{total ?? 0}분</strong></div>
        </div>
        <ul className="pomodoro-history">
          {records.map((r) => (
              <li key={r.id}>
                {r.startedAt?.replace('T', ' ')} · 집중 {r.focusMinutes}분
                {r.endedAt ? '' : ' (진행 중)'}
              </li>
          ))}
        </ul>
      </div>
  )
}
