import { useState } from 'react'
import Timer from './Timer'
import StatsAndHistory from './StatsAndHistory'
import './pomodoro.css'

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
