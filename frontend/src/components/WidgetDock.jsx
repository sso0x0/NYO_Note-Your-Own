import PomodoroWidget from '../features/pomodoro/PomodoroWidget'
import ChatWidget from '../features/chat/ChatWidget'
import './WidgetDock.css'

// 로그인 후 모든 페이지 우하단에 뜨는 플로팅 위젯 모음.
// 아이콘 두 개가 한 줄로 나란히 붙어 있고, 각 팝업창은 자기 아이콘 위에 뜨기 때문에
// 뽀모도로/챗봇을 동시에 열면 2열로 나란히 보인다.
export default function WidgetDock() {
  return (
      <div className="widget-dock">
        <PomodoroWidget />
        <ChatWidget />
      </div>
  )
}
