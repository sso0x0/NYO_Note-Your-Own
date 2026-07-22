import { useEffect, useState } from 'react'
import { getRecords, getTodayStudyTime, getTotalStudyTime } from '../../api/pomodoro'

export default function StatsAndHistory({ refreshKey }) {
  const [today, setToday] = useState(null)
  const [total, setTotal] = useState(null)
  const [records, setRecords] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
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
