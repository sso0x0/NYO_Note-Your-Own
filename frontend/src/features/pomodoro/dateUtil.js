// 백엔드 PomodoroRecordRequest.startedAt/endedAt은 java.time.LocalDateTime(타임존 없음)이라
// Date.toISOString()의 "Z"(UTC) 표기를 그대로 보내면 안 된다. 로컬 시각 그대로
// "yyyy-MM-ddTHH:mm:ss" 형태로 만들어 보낸다.
export function toLocalDateTimeString(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
      `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
