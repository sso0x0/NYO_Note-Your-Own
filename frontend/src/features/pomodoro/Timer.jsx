import { useEffect, useRef, useState } from 'react'
import { createRecord, getActiveRecord, updateRecord } from './api/pomodoro'
import { DEFAULT_FOCUS_MINUTES } from './constants'
import { toLocalDateTimeString } from './dateUtil'

// 뽀모도로 카운트다운 타이머. 집중 분을 사용자가 설정할 수 있고,
// "시작"을 누른 시점에 백엔드에 진행 중 기록을 만들고(POST), 끝나면(자동 만료 또는
// "종료" 클릭) endedAt을 채워 같은 기록을 업데이트(PATCH)한다.
// 휴식 타이머는 일시정지 기능과 역할이 겹쳐서 제거함 — 쉬고 싶으면 일시정지를 쓰면 된다.
// lectureId/noteId: PomodoroWidget이 현재 페이지(강의 시청/노트 상세)에서 뽑아 넘겨준다.
// status: 'idle'(시작 전) | 'running'(진행 중) | 'paused'(일시정지)
//
// 카운트다운은 매 tick마다 "1초씩 감소"가 아니라 anchorRef(기준 시각+그때 남은 초)와
// 지금 시각의 차이로 다시 계산한다. setInterval은 백그라운드 탭에서 브라우저가 실행 주기를
// 늦추는(throttle) 경우가 많아서, 단순 감소 방식이면 남은 시간이 실제 경과 시간보다 느리게
// 줄어드는 오차가 누적된다. 벽시계 차이로 다시 계산하면 tick이 늦게 와도 다음 tick에서
// 바로 정확한 값으로 따라잡는다. anchorRef는 시작/재실행마다 그 시점 기준으로 갱신된다.
//
// 마운트될 때마다(위젯을 다시 열 때) 본인의 진행 중 기록(endedAt이 비어있는 것)이 있는지 확인해서,
// 새로고침/탭 닫기로 남겨진 세션을 이어서 한다. 자리를 비운 사이 계획한 시간이 이미 다 지났으면
// 알림 없이 계획한 시간만큼 채운 걸로 조용히 마무리한다.
export default function Timer({ onFinished, lectureId = null, noteId = null }) {
  const [focusMinutes, setFocusMinutes] = useState(DEFAULT_FOCUS_MINUTES)
  const [focusSeconds, setFocusSeconds] = useState(0)
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
    new Notification('뽀모도로 타이머 종료', { body: '설정한 집중 시간이 끝났어요.' })
  }

  // 타이머 종료 처리: 자동 만료(카운트다운 0)와 수동 "종료" 클릭이 공유한다.
  // endedAt을 채워 PATCH하면 서버가 이 기록을 완료된 세션으로 집계한다.
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

  // 위젯을 다시 열 때마다 본인의 진행 중 기록이 있는지 확인해 이어서 한다.
  useEffect(() => {
    let cancelled = false

    const resumeIfActive = async () => {
      try {
        const record = await getActiveRecord()
        if (!record || cancelled) return

        // focusMinutes는 진행 중일 때는 아직 "계획한 시간"을 뜻한다(끝나야 실제 흐른 시간으로 바뀜).
        // startedAt의 초 단위는 분 단위로 저장하며 이미 반올림됐으므로 이어서 할 때도 그 정밀도를 따른다.
        const startedAt = new Date(record.startedAt)
        const durationSeconds = record.focusMinutes * 60
        const elapsedSinceStart = Math.floor((Date.now() - startedAt.getTime()) / 1000)
        const session = {
          id: record.id,
          startedAt,
          durationSeconds,
          lectureId: record.lectureId,
          noteId: record.noteId,
        }

        if (elapsedSinceStart >= durationSeconds) {
          // 자리를 비운 사이 계획한 시간이 이미 다 지났다 — 알림 없이 조용히 마무리한다.
          finish(session, 0)
          return
        }

        sessionRef.current = session
        anchorRef.current = { time: new Date(), remaining: durationSeconds - elapsedSinceStart }
        setRemainingSeconds(durationSeconds - elapsedSinceStart)
        setStatus('running')
        runCountdown()
      } catch {
        // 이어서 할 기록 조회 실패는 조용히 무시한다 — 사용자는 그냥 새로 시작하면 된다.
      }
    }

    resumeIfActive()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // "시작" 클릭: endedAt 없이 기록을 먼저 생성해두고(진행 중 상태), 화면에서는
  // 1초 간격 카운트다운만 표시한다. 0에 도달하면 finish()로 자동 종료.
  const start = async () => {
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
    const linkedLectureId = linkEnabled ? lectureId : null
    const linkedNoteId = linkEnabled ? noteId : null
    try {
      const record = await createRecord({
        lectureId: linkedLectureId,
        noteId: linkedNoteId,
        focusMinutes: Math.round(durationSeconds / 60),
        startedAt: toLocalDateTimeString(startedAt),
      })
      sessionRef.current = { id: record.id, startedAt, durationSeconds, lectureId: linkedLectureId, noteId: linkedNoteId }
      anchorRef.current = { time: startedAt, remaining: durationSeconds }
      setRemainingSeconds(durationSeconds)
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
  const ringSize = 200
  const ringStroke = 10
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
