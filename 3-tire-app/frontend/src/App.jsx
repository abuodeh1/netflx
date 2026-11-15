import { useState } from 'react'
import AuthForm from './AuthForm.jsx'
import TodoList from './TodoList.jsx'

export default function App() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('session')
    return saved ? JSON.parse(saved) : null
  })

  const handleAuth = (data) => {
    localStorage.setItem('session', JSON.stringify(data))
    setSession(data)
  }

  const logout = () => {
    localStorage.removeItem('session')
    setSession(null)
  }

  return (
    <main className="container">
      {session
        ? <TodoList session={session} onLogout={logout} />
        : <AuthForm onAuth={handleAuth} />}
    </main>
  )
}
