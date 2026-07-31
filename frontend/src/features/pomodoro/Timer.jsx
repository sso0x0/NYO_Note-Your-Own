import { useEffect, useRef, useState } from 'react'
import { createRecord } from './api/pomodoro'
import { DEFAULT_FOCUS_MINUTES } from './constants'
import { toLocalDateTimeString } from './dateUtil'

// 뽀모도로 카운트다운 타이머. 집중 분을 사용자가 설정할 수 있고, 화면에서 카운트다운을
// 돌리다가 끝나면(자동 만료 또는 "종료" 클릭) 그때 한 번에 완성된 기록을 저장한다(POST).
// 진행 중에는 서버에 아무것도 남기지 않으므로, 새로고침이나 탭 닫기로 세션이 끊기면 그
// 세션은 기록되지 않는다 — "진행 중" 상태로 어정쩡하게 남는 기록을 만들지 않기 위한 선택.
// 휴식 타이머는 일시정지 기능과 역할이 겹쳐서 제거함 — 쉬고 싶으면 일시정지를 쓰면 된다.
// lectureId/noteId: PomodoroWidget이 현재 페이지(강의 시청/노트 상세)에서 뽑아 넘겨준다.
// status: 'idle'(시작 전) | 'running'(진행 중) | 'paused'(일시정지)
//
// 카운트다운은 매 tick마다 "1초씩 감소"가 아니라 anchorRef(기준 시각+그때 남은 초)와
// 지금 시각의 차이로 다시 계산한다. setInterval은 백그라운드 탭에서 브라우저가 실행 주기를
// 늦추는(throttle) 경우가 많아서, 단순 감소 방식이면 남은 시간이 실제 경과 시간보다 느리게
// 줄어드는 오차가 누적된다. 벽시계 차이로 다시 계산하면 tick이 늦게 와도 다음 tick에서
// 바로 정확한 값으로 따라잡는다. anchorRef는 시작/재실행마다 그 시점 기준으로 갱신된다.
export default function Timer({ onFinished, lectureId = null, noteId = null }) {
  const [focusMinutes, setFocusMinutes] = useState(DEFAULT_FOCUS_MINUTES)
  const [focusSeconds, setFocusSeconds] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_FOCUS_MINUTES * 60)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  // 시작 시점의 집중 분을 세션에 고정해둔다. 카운트다운 도중 설정 입력을 다시
  // 보여주지 않기 때문에 값이 바뀔 일은 없지만, state 대신 ref로 들고 있어야
  // setInterval 콜백(클로저)이 항상 이 세션의 값을 참조하게 된다.
  const sessionRef = useRef(null)
  // 카운트다운 재계산 기준점: { time: 그 시점의 Date, remaining: 그 시점에 남아있던 초 }.
  // "시작"과 "재실행"마다 그 순간을 기준으로 새로 세팅된다.
  const anchorRef = useRef(null)

  // 컴포넌트가 사라질 때 돌고 있는 인터벌을 정리 (다른 탭으로 이동해도 타이머가 안 죽는 문제 방지)
  useEffect(() => () => clearInterval(intervalRef.current), [])

  // 매 tick마다 anchorRef 기준으로 남은 시간을 다시 계산한다 (위 상단 주석 참고 — 단순 감소가 아님).
  const runCountdown = () => {
    intervalRef.current = setInterval(() => {
      const anchor = anchorRef.current
      const elapsedSinceAnchor = Math.floor((Date.now() - anchor.time.getTime()) / 1000)
      const next = anchor.remaining - elapsedSinceAnchor
      if (next <= 0) {
        clearInterval(intervalRef.current)
        setRemainingSeconds(0)
        finish(sessionRef.current, 0, { auto: true })
        return
      }
      setRemainingSeconds(next)
    }, 1000)
  }

  // 자동 종료(카운트다운이 0에 도달)했을 때만 브라우저 알림을 띄운다. 수동 "종료"는 사용자가
  // 이미 화면을 보고 있는 상태라 알림이 필요 없다. 소리는 의도적으로 넣지 않는다.
  const notifyFinished = () => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    new Notification('뽀모도로 타이머 종료', { body: '설정한 시간이 끝났어요.' })
  }

  // 타이머 종료 처리: 자동 만료(카운트다운 0)와 수동 "종료" 클릭이 공유한다.
  // 시작~종료를 한 번에 담은 완성된 기록을 이 시점에 딱 한 번 저장한다.
  const finish = async (session, remainingAtFinish, { auto = false } = {}) => {
    clearInterval(intervalRef.current)
    setStatus('idle')
    if (auto) notifyFinished()
    const endedAt = new Date()
    // 실제로 흐른 시간은 "계획한 시간 - 남은 시간"으로 계산한다. 벽시계 차이(종료 - 시작)를
    // 쓰면 일시정지해둔 시간까지 흐른 걸로 잡히기 때문에, 카운트다운이 실제로 줄어든 만큼만 센다.
    const elapsedSeconds = session.durationSeconds - remainingAtFinish
    // 30초를 기준으로 반올림한다 (1분 30초→2분, 1분 29초→1분). 30초 미만은 0분으로 취급.
    const elapsedMinutes = Math.round(elapsedSeconds / 60)
    try {
      await createRecord({
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
    // 자동 만료인지 직접 종료인지 부모가 구분할 수 있도록 종료 원인을 함께 전달한다.
    onFinished({ auto })
  }

  // "시작" 클릭: 서버에는 아직 아무것도 저장하지 않고 화면 카운트다운만 바로 시작한다.
  // 끝나면 finish()가 시작~종료를 한 번에 담아 저장한다.
  const start = () => {
    setError(null)
    const durationSeconds = focusMinutes * 60 + focusSeconds
    if (durationSeconds <= 0) {
      setError('시간을 1초 이상으로 설정해주세요.')
      return
    }
    // 타이머가 끝났을 때 알림을 띄우려면 미리 권한을 받아둬야 한다. 이미 허용/거부된 상태면
    // 브라우저가 다시 묻지 않고 바로 반환하므로 매번 호출해도 안전하다.
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    const startedAt = new Date()
    sessionRef.current = { startedAt, durationSeconds, lectureId, noteId }
    anchorRef.current = { time: startedAt, remaining: durationSeconds }
    setRemainingSeconds(durationSeconds)
    setStatus('running')
    runCountdown()
  }

  // 일시정지: 인터벌만 멈추고 세션/남은 시간은 그대로 들고 있는다.
  const pause = () => {
    clearInterval(intervalRef.current)
    setStatus('paused')
  }

  // 재실행: 멈췄던 남은 시간을 새 기준점으로 삼아 카운트다운을 다시 건다.
  const resume = () => {
    anchorRef.current = { time: new Date(), remaining: remainingSeconds }
    setStatus('running')
    runCountdown()
  }

  const stop = () => finish(sessionRef.current, remainingSeconds)

  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0')
  const seconds = String(remainingSeconds % 60).padStart(2, '0')

  // 링 진행률 계산용 기준 시간: 시작 전에는 지금 설정한 분(focusMinutes), 시작 후에는
  // 세션 시작 시점에 고정된 분(session.focusMinutes)을 쓴다 — 설정 입력이 사라진 뒤에도
  // 진행률이 흔들리지 않게 하기 위함.
  const totalSeconds = status === 'idle'
      ? focusMinutes * 60 + focusSeconds
      : sessionRef.current?.durationSeconds ?? focusMinutes * 60 + focusSeconds
  const ringSize = 140
  const ringStroke = 8
  const ringRadius = (ringSize - ringStroke) / 2
  const ringCircumference = 2 * Math.PI * ringRadius
  const progress = totalSeconds > 0 ? Math.min(1, Math.max(0, remainingSeconds / totalSeconds)) : 0
  const ringDashoffset = ringCircumference * (1 - progress)

  return (
      <div className="pomodoro-timer">
        {status === 'idle' && (
            <div className="pomodoro-settings">
              <label>
                설정 시간
                <div className="pomodoro-settings__time">
                  <input
                      type="number"
                      min="0"
                      value={focusMinutes}
                      onChange={(e) => {
                        const value = Math.max(0, Number(e.target.value) || 0)
                        setFocusMinutes(value)
                        setRemainingSeconds(value * 60 + focusSeconds)
                      }}
                  />
                  <span>분</span>
                  <input
                      type="number"
                      min="0"
                      max="59"
                      value={focusSeconds}
                      onChange={(e) => {
                        const raw = Number(e.target.value)
                        const value = Math.min(59, Math.max(0, Number.isNaN(raw) ? 0 : raw))
                        setFocusSeconds(value)
                        setRemainingSeconds(focusMinutes * 60 + value)
                      }}
                  />
                  <span>초</span>
                </div>
              </label>
            </div>
        )}
        <div className={`pomodoro-ring${status === 'paused' ? ' pomodoro-ring--paused' : ''}${status === 'running' ? ' pomodoro-ring--running' : ''}`}>
          <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
            <circle
                className="pomodoro-ring__track"
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                strokeWidth={ringStroke}
                fill="none"
            />
            <circle
                className="pomodoro-ring__progress"
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                strokeWidth={ringStroke}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringDashoffset}
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
            />
          </svg>
          <div className="pomodoro-ring__label">
            <span className="pomodoro-clock">{minutes}:{seconds}</span>
          </div>
        </div>
        {status === 'idle' ? (
            <button onClick={start}> 시작 </button>
        ) : (
            <div className="pomodoro-controls">
              {status === 'running'
                  ? <button onClick={pause}>일시정지</button>
                  : <button onClick={resume}>재 실행</button>}
              <button onClick={stop}>종료</button>
            </div>
        )}
        {error && <p className="pomodoro-error">{error}</p>}
      </div>
  )
}
