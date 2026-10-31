import { useEffect, useState } from 'react'
import { addTodo, deleteTodo, getTodos, updateTodo } from './api.js'

export default function TodoList({ session, onLogout }) {
  const [todos, setTodos] = useState([])
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')

  const handleError = (err) => {
    if (err.status === 401) onLogout()
    else setError(err.message)
  }

  useEffect(() => {
    getTodos(session.token).then(setTodos).catch(handleError)
  }, [session.token])

  const add = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    try {
      const todo = await addTodo(session.token, title)
      setTodos([...todos, todo])
      setTitle('')
    } catch (err) {
      handleError(err)
    }
  }

  const toggle = async (todo) => {
    try {
      const updated = await updateTodo(session.token, todo.id, { isDone: !todo.isDone })
      setTodos(todos.map((t) => (t.id === todo.id ? updated : t)))
    } catch (err) {
      handleError(err)
    }
  }

  const remove = async (id) => {
    try {
      await deleteTodo(session.token, id)
      setTodos(todos.filter((t) => t.id !== id))
    } catch (err) {
      handleError(err)
    }
  }

  return (
    <div className="card">
      <header className="todo-header">
        <h1>{session.username}'s todos</h1>
        <button className="link" onClick={onLogout}>Log out</button>
      </header>

      <form className="add" onSubmit={add}>
        <input placeholder="What needs to be done?" value={title}
          onChange={(e) => setTitle(e.target.value)} />
        <button type="submit">Add</button>
      </form>

      {error && <p className="error">{error}</p>}

      <ul className="todos">
        {todos.map((todo) => (
          <li key={todo.id} className={todo.isDone ? 'done' : ''}>
            <label>
              <input type="checkbox" checked={todo.isDone} onChange={() => toggle(todo)} />
              <span>{todo.title}</span>
            </label>
            <button className="delete" onClick={() => remove(todo.id)} aria-label="Delete">✕</button>
          </li>
        ))}
        {todos.length === 0 && <li className="empty">Nothing to do yet.</li>}
      </ul>
    </div>
  )
}
