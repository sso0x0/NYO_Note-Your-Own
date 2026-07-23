import { useState } from 'react'
import Timer from './Timer'
import StatsAndHistory from './StatsAndHistory'
import '../../components/widget.css'
import './pomodoro.css'

// 뽀모도로 아이콘 + 팝업창. ChatWidget과 같은 방식(WidgetDock)으로 모든 페이지에서
// 접근할 수 있고, 타이머/통계 로직은 페이지였을 때 쓰던 Timer·StatsAndHistory를 그대로 재사용한다.
export default function PomodoroWidget() {
  const [open, setOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
      <div className="widget">
        {open && (
            <div className="widget__panel">
              <div className="widget__header">
                <span>뽀모도로 타이머</span>
                <button type="button" onClick={() => setOpen(false)} aria-label="뽀모도로 닫기">✕</button>
              </div>
              <div className="pomodoro-panel__body">
                <Timer onFinished={() => setRefreshKey((k) => k + 1)} />
                <StatsAndHistory refreshKey={refreshKey} />
              </div>
            </div>
        )}
        <button
            type="button"
            className="widget__toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? '뽀모도로 닫기' : '뽀모도로 열기'}
        >
          {open ? '✕' : '⏱️'}
        </button>
      </div>
  )
}
