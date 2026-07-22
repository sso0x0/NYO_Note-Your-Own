import { logout } from '../api/auth'
import { TABS } from '../tabs'

export default function AppNav({ tab, onTabChange, onLoggedOut }) {
  return (
      <nav className="app-nav">
        <button
            className={tab === TABS.POMODORO ? 'active' : ''}
            onClick={() => onTabChange(TABS.POMODORO)}
        >
          뽀모도로
        </button>
        <button
            className={tab === TABS.CHAT ? 'active' : ''}
            onClick={() => onTabChange(TABS.CHAT)}
        >
          챗봇
        </button>
        <button className="app-logout" onClick={() => { logout(); onLoggedOut() }}>로그아웃</button>
      </nav>
  )
}
