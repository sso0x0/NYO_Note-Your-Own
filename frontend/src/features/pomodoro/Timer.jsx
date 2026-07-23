import { useEffect, useRef, useState } from 'react'
import { createRecord, updateRecord } from './api/pomodoro'
import { DEFAULT_BREAK_MINUTES, DEFAULT_FOCUS_MINUTES } from './constants'
import { toLocalDateTimeString } from './dateUtil'

// 뽀모도로 카운트다운 타이머. 집중/휴식 분을 사용자가 설정할 수 있고,
// "시작"을 누른 시점에 백엔드에 진행 중 기록을 만들고(POST), 끝나면(자동 만료 또는
// "종료" 클릭) endedAt을 채워 같은 기록을 업데이트(PATCH)한다.
export default function Timer({ onFinished }) {
  const [focusMinutes, setFocusMinutes] = useState(DEFAULT_FOCUS_MINUTES)
  const [breakMinutes, setBreakMinutes] = useState(DEFAULT_BREAK_MINUTES)
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_FOCUS_MINUTES * 60)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)
  // 시작 시점의 집중/휴식 분을 세션에 고정해둔다. 카운트다운 도중 설정 입력을 다시
  // 보여주지 않기 때문에 값이 바뀔 일은 없지만, state 대신 ref로 들고 있어야
  // setInterval 콜백(클로저)이 항상 이 세션의 값을 참조하게 된다.
  const sessionRef = useRef(null)

  // 컴포넌트가 사라질 때 돌고 있는 인터벌을 정리 (다른 탭으로 이동해도 타이머가 안 죽는 문제 방지)
  useEffect(() => () => clearInterval(intervalRef.current), [])

  // 타이머 종료 처리: 자동 만료(카운트다운 0)와 수동 "종료" 클릭이 공유한다.
  // endedAt을 채워 PATCH하면 서버가 이 기록을 완료된 세션으로 집계한다.
  const finish = async (session) => {
    clearInterval(intervalRef.current)
    setRunning(false)
    try {
      await updateRecord(session.id, {
        focusMinutes: session.focusMinutes,
        breakMinutes: session.breakMinutes,
        startedAt: toLocalDateTimeString(session.startedAt),
        endedAt: toLocalDateTimeString(new Date()),
      })
    } catch (err) {
      setError(err.message)
    }
    sessionRef.current = null
    onFinished() // 부모(PomodoroPage)에 알려서 오늘/전체 통계와 기록 목록을 다시 불러오게 한다
  }

  // "시작" 클릭: endedAt 없이 기록을 먼저 생성해두고(진행 중 상태), 화면에서는
  // 1초 간격 setInterval로 카운트다운만 표시한다. 0에 도달하면 finish()로 자동 종료.
  const start = async () => {
    setError(null)
    const startedAt = new Date()
    try {
      const record = await createRecord({
        focusMinutes,
        breakMinutes,
        startedAt: toLocalDateTimeString(startedAt),
      })
      sessionRef.current = { id: record.id, startedAt, focusMinutes, breakMinutes }
      setRemainingSeconds(focusMinutes * 60)
      setRunning(true)

      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            finish(sessionRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      setError(err.message)
    }
  }

  const stop = () => finish(sessionRef.current)

  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0')
  const seconds = String(remainingSeconds % 60).padStart(2, '0')

  return (
      <div className="pomodoro-timer">
        {!running && (
            <div className="pomodoro-settings">
              <label>
                집중(분)
                <input
                    type="number"
                    min="1"
                    value={focusMinutes}
                    onChange={(e) => {
                      const value = Number(e.target.value) || 1
                      setFocusMinutes(value)
                      setRemainingSeconds(value * 60)
                    }}
                />
              </label>
              <label>
                휴식(분)
                <input
                    type="number"
                    min="1"
                    value={breakMinutes}
                    onChange={(e) => setBreakMinutes(Number(e.target.value) || 1)}
                />
              </label>
            </div>
        )}
        <div className="pomodoro-clock">{minutes}:{seconds}</div>
        {!running
            ? <button onClick={start}>시작 ({focusMinutes}분 집중)</button>
            : <button onClick={stop}>종료</button>}
        {error && <p className="pomodoro-error">{error}</p>}
      </div>
  )
}
