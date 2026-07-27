import { useEffect, useRef, useState } from 'react'
import { createRecord, updateRecord } from './api/pomodoro'
import { DEFAULT_FOCUS_MINUTES } from './constants'
import { toLocalDateTimeString } from './dateUtil'

// 뽀모도로 카운트다운 타이머. 집중 분을 사용자가 설정할 수 있고,
// "시작"을 누른 시점에 백엔드에 진행 중 기록을 만들고(POST), 끝나면(자동 만료 또는
// "종료" 클릭) endedAt을 채워 같은 기록을 업데이트(PATCH)한다.
// 휴식 타이머는 일시정지 기능과 역할이 겹쳐서 제거함 — 쉬고 싶으면 일시정지를 쓰면 된다.
// lectureId/noteId: PomodoroWidget이 현재 페이지(강의 시청/노트 상세)에서 뽑아 넘겨준다.
// status: 'idle'(시작 전) | 'running'(진행 중) | 'paused'(일시정지)
export default function Timer({ onFinished, lectureId = null, noteId = null }) {
  const [focusMinutes, setFocusMinutes] = useState(DEFAULT_FOCUS_MINUTES)
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_FOCUS_MINUTES * 60)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  // 자동 감지된 강의/노트를 실제로 연결할지는 사용자가 체크박스로 직접 고른다 (기본은 연결).
  const [linkEnabled, setLinkEnabled] = useState(true)
  const intervalRef = useRef(null)

  // 감지된 대상이 바뀌면(다른 강의/노트 페이지로 이동) 다시 기본값(연결)으로 초기화한다.
  useEffect(() => {
    setLinkEnabled(true)
  }, [lectureId, noteId])
  // 시작 시점의 집중 분을 세션에 고정해둔다. 카운트다운 도중 설정 입력을 다시
  // 보여주지 않기 때문에 값이 바뀔 일은 없지만, state 대신 ref로 들고 있어야
  // setInterval 콜백(클로저)이 항상 이 세션의 값을 참조하게 된다.
  const sessionRef = useRef(null)

  // 컴포넌트가 사라질 때 돌고 있는 인터벌을 정리 (다른 탭으로 이동해도 타이머가 안 죽는 문제 방지)
  useEffect(() => () => clearInterval(intervalRef.current), [])

  // 1초 간격 카운트다운. "시작"과 "재실행" 둘 다 여기서 인터벌을 새로 건다.
  const runCountdown = () => {
    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          finish(sessionRef.current, 0)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // 타이머 종료 처리: 자동 만료(카운트다운 0)와 수동 "종료" 클릭이 공유한다.
  // endedAt을 채워 PATCH하면 서버가 이 기록을 완료된 세션으로 집계한다.
  const finish = async (session, remainingAtFinish) => {
    clearInterval(intervalRef.current)
    setStatus('idle')
    const endedAt = new Date()
    // 실제로 흐른 시간은 "계획한 시간 - 남은 시간"으로 계산한다. 벽시계 차이(종료 - 시작)를
    // 쓰면 일시정지해둔 시간까지 흐른 걸로 잡히기 때문에, 카운트다운이 실제로 줄어든 만큼만 센다.
    const elapsedSeconds = session.focusMinutes * 60 - remainingAtFinish
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60))
    try {
      // update()는 lectureId/noteId를 무조건 덮어쓰므로, 시작할 때 연결된 값을 여기서도 그대로 보내야
      // 종료 시점에 연결이 풀리지 않는다.
      await updateRecord(session.id, {
        lectureId: session.lectureId,
        noteId: session.noteId,
        focusMinutes: elapsedMinutes,
        startedAt: toLocalDateTimeString(session.startedAt),
        endedAt: toLocalDateTimeString(endedAt),
      })
    } catch (err) {
      setError(err.message)
    }
    sessionRef.current = null
    onFinished() // 부모(PomodoroPage)에 알려서 오늘/전체 통계와 기록 목록을 다시 불러오게 한다
  }

  // "시작" 클릭: endedAt 없이 기록을 먼저 생성해두고(진행 중 상태), 화면에서는
  // 1초 간격 카운트다운만 표시한다. 0에 도달하면 finish()로 자동 종료.
  const start = async () => {
    setError(null)
    const startedAt = new Date()
    const linkedLectureId = linkEnabled ? lectureId : null
    const linkedNoteId = linkEnabled ? noteId : null
    try {
      const record = await createRecord({
        lectureId: linkedLectureId,
        noteId: linkedNoteId,
        focusMinutes,
        startedAt: toLocalDateTimeString(startedAt),
      })
      sessionRef.current = { id: record.id, startedAt, focusMinutes, lectureId: linkedLectureId, noteId: linkedNoteId }
      setRemainingSeconds(focusMinutes * 60)
      setStatus('running')
      runCountdown()
    } catch (err) {
      setError(err.message)
    }
  }

  // 일시정지: 인터벌만 멈추고 세션/남은 시간은 그대로 들고 있는다.
  const pause = () => {
    clearInterval(intervalRef.current)
    setStatus('paused')
  }

  // 재실행: 멈췄던 남은 시간부터 카운트다운을 다시 건다.
  const resume = () => {
    setStatus('running')
    runCountdown()
  }

  const stop = () => finish(sessionRef.current, remainingSeconds)

  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0')
  const seconds = String(remainingSeconds % 60).padStart(2, '0')

  return (
      <div className="pomodoro-timer">
        {status === 'idle' && (
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
            </div>
        )}
        {status === 'idle' && (lectureId || noteId) && (
            <label className="pomodoro-context">
              <input
                  type="checkbox"
                  checked={linkEnabled}
                  onChange={(e) => setLinkEnabled(e.target.checked)}
              />
              {lectureId ? `강의 #${lectureId}` : `노트 #${noteId}`}와(과) 연결하기
            </label>
        )}
        {/* 실행/일시정지 중에는 시작할 때 확정된 연결 값(sessionRef)을 그대로 보여준다 — 체크박스는
            시작 전에만 바꿀 수 있고, 일시정지해도 이 값은 바뀌지 않는다. */}
        {status !== 'idle' && (sessionRef.current?.lectureId || sessionRef.current?.noteId) && (
            <p className="pomodoro-context pomodoro-context--readonly">
              {sessionRef.current.lectureId ? `강의 #${sessionRef.current.lectureId}` : `노트 #${sessionRef.current.noteId}`}와(과) 연결됨
            </p>
        )}
        <div className="pomodoro-clock">{minutes}:{seconds}</div>
        {status === 'idle' ? (
            <button onClick={start}>시작 ({focusMinutes}분 집중)</button>
        ) : (
            <div className="pomodoro-controls">
              {status === 'running'
                  ? <button onClick={pause}>일시정지</button>
                  : <button onClick={resume}>재실행</button>}
              <button onClick={stop}>종료</button>
            </div>
        )}
        {error && <p className="pomodoro-error">{error}</p>}
      </div>
  )
}
