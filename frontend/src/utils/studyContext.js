// 지금 보고 있는 페이지가 강의 시청/노트 상세면 그 ID를 뽑아낸다.
// 뽀모도로 위젯(지금 공부 중인 대상 자동 감지)과 챗봇 위젯(전용 학습 챗봇이 있는
// 페이지에서 전역 위젯을 숨기는 판단) 양쪽에서 같은 라우트 패턴을 써야 하므로 공유한다.
export function detectStudyContext(pathname) {
  const watchMatch = pathname.match(/^\/main\/lectures\/(\d+)\/watch\/?$/)
  if (watchMatch) return { lectureId: Number(watchMatch[1]), noteId: null }

  const noteMatch = pathname.match(/^\/main\/notes\/(\d+)\/?$/)
  if (noteMatch) return { lectureId: null, noteId: Number(noteMatch[1]) }

  return { lectureId: null, noteId: null }
}
