import { useState } from 'react'
import { login, signup } from './api.js'

export default function AuthForm({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isSignup = mode === 'signup'

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const data = isSignup
        ? await signup(username, password, confirmPassword)
        : await login(username, password)
      onAuth(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(isSignup ? 'login' : 'signup')
    setError('')
    setConfirmPassword('')
  }

  return (
    <form className="card" onSubmit={submit}>
      <h1>{isSignup ? 'Sign up' : 'Log in'}</h1>

      <input placeholder="Username" value={username}
        onChange={(e) => setUsername(e.target.value)} required />
      <input type="password" placeholder="Password" value={password}
        onChange={(e) => setPassword(e.target.value)} required />
      {isSignup && (
        <input type="password" placeholder="Confirm password" value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)} required />
      )}

      {error && <p className="error">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
      </button>

      <p className="switch">
        {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button type="button" className="link" onClick={switchMode}>
          {isSignup ? 'Log in' : 'Sign up'}
        </button>
      </p>
    </form>
  )
}
