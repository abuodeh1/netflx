import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <main style={{ fontFamily: 'sans-serif', textAlign: 'center', marginTop: '4rem' }}>
      <h1>Hello from React container</h1>
      <p>Served through the Nginx reverse proxy at <code>/</code></p>
      <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>
      <p><a href="/next">Go to the Next.js app</a></p>
    </main>
  )
}
