import { useState } from 'react'
import { login } from '../api/auth'
import './login-form.css'

export default function LoginForm({ onLoggedIn }) {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(loginId, password)
      onLoggedIn()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>로그인</h2>
        <input value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="아이디" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" />
        <button type="submit" disabled={loading}>{loading ? '로그인 중...' : '로그인'}</button>
        {error && <p className="form-error">{error}</p>}
      </form>
  )
}
