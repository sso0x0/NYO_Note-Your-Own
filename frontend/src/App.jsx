import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [healthResult, setHealthResult] = useState(null)

  const checkBackend = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/health')
      const data = await res.json()
      setHealthResult(JSON.stringify(data))
    } catch (err) {
      setHealthResult(`연결 실패: ${err.message}`)
    }
  }

  return (
      <>
        <section id="center">
          <div>
            <h1>Get started</h1>
          </div>

          {/* 백엔드 연결 테스트용 - 확인 후 지워도 됨 */}
          <div style={{ marginTop: '1rem' }}>
            <button type="button" onClick={checkBackend}>
              백엔드 연결 테스트
            </button>
            {healthResult && <p>{healthResult}</p>}
          </div>
        </section>
    </>
  )
}

export default App
