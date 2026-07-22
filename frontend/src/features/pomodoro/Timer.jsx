import { useEffect, useRef, useState } from 'react'
import { createRecord, updateRecord } from '../../api/pomodoro'
import { DEFAULT_BREAK_MINUTES, DEFAULT_FOCUS_MINUTES } from './constants'
import { toLocalDateTimeString } from './dateUtil'

export default function Timer({ onFinished }) {
  const [focusMinutes, setFocusMinutes] = useState(DEFAULT_FOCUS_MINUTES)
  const [breakMinutes, setBreakMinutes] = useState(DEFAULT_BREAK_MINUTES)
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_FOCUS_MINUTES * 60)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)
  const sessionRef = useRef(null)

  useEffect(() => () => clearInterval(intervalRef.current), [])

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
    onFinished()
  }

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
