import './WidgetDock.css'

// 로그인 후 모든 페이지 우하단에 뜨던 플로팅 위젯(뽀모도로+챗봇) 모음이었는데, 실험적으로
// 우선 여기서 빼고 각 페이지(강의 시청/노트 상세)에 직접 임베드하는 방향으로 옮기는 중이다.
// 되돌리려면 PomodoroWidget/ChatWidget을 다시 여기서 렌더링하면 된다.
export default function WidgetDock() {
  return <div className="widget-dock" />
}
