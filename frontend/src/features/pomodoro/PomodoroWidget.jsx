import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Timer from './Timer'
import StatsAndHistory from './StatsAndHistory'
import { detectStudyContext } from '../../utils/studyContext'
import '../../components/widget.css'
import './pomodoro.css'

// 아날로그 시계 모양의 선(line) 아이콘. 이모지(⏱️) 대신 다른 위젯(챗봇)과
// 톤을 맞춘 단색 아웃라인 아이콘을 쓰기 위해 인라인 SVG로 직접 그린다.
function ClockIcon() {
  return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </svg>
  )
}

// 뽀모도로 아이콘 + 팝업창. "시작"을 누른 시점의 페이지를 곧 "지금 공부 중인 대상"으로 본다.
// ChatWidget과 같은 방식(WidgetDock)으로 모든 페이지에서 접근할 수 있고, 타이머/통계 로직은
// 페이지였을 때 쓰던 Timer·StatsAndHistory를 그대로 재사용한다.
export default function PomodoroWidget({ stacked = false, onOpenChange } = {}) {
  const [open, setOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const location = useLocation()
  const studyContext = useMemo(() => detectStudyContext(location.pathname), [location.pathname])

  // 챗봇 위젯이 이미 열려 있을 때 이 위젯을 열면(또는 그 반대) WidgetDock이 열린 순서를
  // 알 수 있게 open 상태가 바뀔 때마다 알린다.
  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])

  return (
      <div className="widget pomodoro-widget">
        {open && (
            <div className={`widget__panel pomodoro-panel${stacked ? ' widget__panel--stacked' : ''}`}>
              <div className="widget__header pomodoro-header">
                <span>뽀모도로 타이머</span>
                <button type="button" onClick={() => setOpen(false)} aria-label="뽀모도로 닫기">✕</button>
              </div>
              <div className="pomodoro-panel__body">
                <Timer
                    lectureId={studyContext.lectureId}
                    noteId={studyContext.noteId}
                    onFinished={() => setRefreshKey((k) => k + 1)}
                />
                <StatsAndHistory refreshKey={refreshKey} />
              </div>
            </div>
        )}
        <button
            type="button"
            className="widget__toggle pomodoro-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? '뽀모도로 닫기' : '뽀모도로 열기'}
        >
          {open ? '✕' : <ClockIcon />}
        </button>
      </div>
  )
}
