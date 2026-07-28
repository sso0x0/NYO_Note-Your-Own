import { useCallback, useState } from 'react'
import PomodoroWidget from '../features/pomodoro/PomodoroWidget'
import ChatWidget from '../features/chat/ChatWidget'
import './WidgetDock.css'

// 로그인 후 모든 페이지 우하단에 뜨는 플로팅 위젯 모음.
// 아이콘 두 개가 한 줄로 나란히 붙어 있고, 각 팝업창은 자기 아이콘 위에 뜬다.
// 두 아이콘 사이 간격보다 패널 폭이 훨씬 넓어서 둘 다 열면 겹치기 때문에,
// 열린 순서를 기억해뒀다가 "나중에 연" 패널을 먼저 연 패널 위로 쌓아 올린다.
export default function WidgetDock() {
  const [openOrder, setOpenOrder] = useState([])

  // 실제로 순서가 바뀔 때만 새 배열을 만든다 — 매번 새 배열을 리턴하면 참조가 바뀐 것으로
  // 인식되어 리렌더 → 아래 인라인 콜백이 새로 생성 → 자식의 useEffect가 다시 실행되어
  // 다시 이 함수를 호출하는 무한 루프에 빠진다.
  const handleOpenChange = useCallback((key, isOpen) => {
    setOpenOrder((prev) => {
      const alreadyIn = prev.includes(key)
      if (isOpen === alreadyIn) return prev
      return isOpen ? [...prev, key] : prev.filter((k) => k !== key)
    })
  }, [])

  // 위 이유와 같은 무한 루프를 막기 위해, 자식에게 넘기는 콜백도 매 렌더마다 새로
  // 만들지 않고 useCallback으로 고정한다.
  const handlePomodoroOpenChange = useCallback((isOpen) => handleOpenChange('pomodoro', isOpen), [handleOpenChange])
  const handleChatOpenChange = useCallback((isOpen) => handleOpenChange('chat', isOpen), [handleOpenChange])

  const isStacked = (key) => openOrder.length > 1 && openOrder.indexOf(key) > 0

  return (
      <div className="widget-dock">
        <PomodoroWidget stacked={isStacked('pomodoro')} onOpenChange={handlePomodoroOpenChange} />
        <ChatWidget stacked={isStacked('chat')} onOpenChange={handleChatOpenChange} />
      </div>
  )
}
