async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error(data?.message || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}

export const signup = (username, password, confirmPassword) =>
  request('/api/auth/signup', { method: 'POST', body: { username, password, confirmPassword } })

export const login = (username, password) =>
  request('/api/auth/login', { method: 'POST', body: { username, password } })

export const getTodos = (token) => request('/api/todos', { token })

export const addTodo = (token, title) =>
  request('/api/todos', { method: 'POST', token, body: { title } })

export const updateTodo = (token, id, changes) =>
  request(`/api/todos/${id}`, { method: 'PUT', token, body: changes })

export const deleteTodo = (token, id) =>
  request(`/api/todos/${id}`, { method: 'DELETE', token })
