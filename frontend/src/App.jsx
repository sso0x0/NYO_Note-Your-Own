import { useState } from 'react'
import { isLoggedIn } from './api/auth'
import { TABS } from './tabs'
import LoginForm from './components/LoginForm'
import AppNav from './components/AppNav'
import PomodoroPage from './features/pomodoro/PomodoroPage'
import ChatPage from './features/chat/ChatPage'
import './App.css'

function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())
  const [tab, setTab] = useState(TABS.POMODORO)

  if (!loggedIn) {
    return <LoginForm onLoggedIn={() => setLoggedIn(true)} />
  }

  return (
      <div className="app-shell">
        <AppNav tab={tab} onTabChange={setTab} onLoggedOut={() => setLoggedIn(false)} />
        {tab === TABS.POMODORO ? <PomodoroPage /> : <ChatPage />}
      </div>
  )
}

export default App
