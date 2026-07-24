import { useEffect, useState } from 'react'
import {
  deleteAllRecords,
  deleteRecord,
  deleteRecords,
  getRecords,
  getTodayStudyTime,
  getTotalStudyTime,
} from './api/pomodoro'

// 오늘/전체 누적 공부 시간과 최근 기록 목록 + 기록 삭제(단건/선택/전체).
// Timer가 세션을 끝낼 때마다 refreshKey를 바꿔주면 이 컴포넌트가 다시 조회한다
// (부모→자식 리프레시 신호). 삭제 후에도 같은 load()를 재사용해 목록/통계를 갱신한다.
export default function StatsAndHistory({ refreshKey }) {
  const [today, setToday] = useState(null)
  const [total, setTotal] = useState(null)
  const [records, setRecords] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [localRefreshKey, setLocalRefreshKey] = useState(0)

  useEffect(() => {
    // refreshKey가 바뀌는 사이에 이전 요청이 늦게 끝나 화면을 덮어쓰지 않도록 가드
    let cancelled = false
    async function load() {
      setLoading(true)
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
        setSelectedIds([])
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [refreshKey, localRefreshKey])

  const refresh = () => setLocalRefreshKey((k) => k + 1)

  const toggleOne = (id) => {
    setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    setSelectedIds((prev) => (prev.length === records.length ? [] : records.map((r) => r.id)))
  }

  const handleDeleteOne = async (id) => {
    if (!window.confirm('이 기록을 삭제할까요?')) return
    setDeleting(true)
    setError(null)
    try {
      await deleteRecord(id)
      refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`선택한 ${selectedIds.length}개 기록을 삭제할까요?`)) return
    setDeleting(true)
    setError(null)
    try {
      await deleteRecords(selectedIds)
      refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteAll = async () => {
    if (records.length === 0) return
    if (!window.confirm('전체 기록을 삭제할까요? 되돌릴 수 없어요.')) return
    setDeleting(true)
    setError(null)
    try {
      await deleteAllRecords()
      refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
      <div className="pomodoro-stats">
        <div className="pomodoro-stats-row">
          <div><span>오늘</span><strong>{today ?? 0}분</strong></div>
          <div><span>전체</span><strong>{total ?? 0}분</strong></div>
        </div>

        <div className="pomodoro-history-header">
          <label className="pomodoro-select-all">
            <input
                type="checkbox"
                checked={records.length > 0 && selectedIds.length === records.length}
                disabled={records.length === 0 || deleting}
                onChange={toggleAll}
            />
            전체 선택
          </label>
          <div className="pomodoro-history-actions">
            <button
                type="button"
                className="pomodoro-btn pomodoro-btn--ghost"
                disabled={selectedIds.length === 0 || deleting}
                onClick={handleDeleteSelected}
            >
              선택 삭제{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
            </button>
            <button
                type="button"
                className="pomodoro-btn pomodoro-btn--danger"
                disabled={records.length === 0 || deleting}
                onClick={handleDeleteAll}
            >
              전체 삭제
            </button>
          </div>
        </div>

        {error && <p className="pomodoro-error">{error}</p>}

        {loading ? (
            <p className="pomodoro-empty">불러오는 중...</p>
        ) : records.length === 0 ? (
            <p className="pomodoro-empty">아직 기록이 없어요. 타이머를 시작해보세요!</p>
        ) : (
            <ul className="pomodoro-history">
              {records.map((r) => (
                  <li key={r.id} className="pomodoro-history__item">
                    <input
                        type="checkbox"
                        checked={selectedIds.includes(r.id)}
                        disabled={deleting}
                        onChange={() => toggleOne(r.id)}
                    />
                    <span className="pomodoro-history__text">
                  {r.startedAt?.replace('T', ' ')} · 집중 {r.focusMinutes}분
                      {r.endedAt ? '' : ' (진행 중)'}
                </span>
                    <button
                        type="button"
                        className="pomodoro-history__delete"
                        aria-label="기록 삭제"
                        disabled={deleting}
                        onClick={() => handleDeleteOne(r.id)}
                    >
                      ✕
                    </button>
                  </li>
              ))}
            </ul>
        )}
      </div>
  )
}
