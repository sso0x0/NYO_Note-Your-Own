import { useState } from 'react'
import Timer from './Timer'
import StatsAndHistory from './StatsAndHistory'
import './pomodoro.css'

// /main/pomodoro 라우트. 타이머와 통계/기록을 조립만 하고, 둘을 이어주는
// refreshKey(타이머가 끝날 때마다 +1)로 통계 새로고침 시점만 관리한다.
export default function PomodoroPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
      <div className="pomodoro-page">
        <h1>뽀모도로 타이머</h1>
        <Timer onFinished={() => setRefreshKey((k) => k + 1)} />
        <StatsAndHistory refreshKey={refreshKey} />
      </div>
  )
}
