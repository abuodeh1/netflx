export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <main style={{ fontFamily: 'sans-serif', textAlign: 'center', marginTop: '4rem' }}>
      <h1>Hello from Next.js container</h1>
      <p>Served through the Nginx reverse proxy at <code>/next</code></p>
      <p>Rendered on the server at: {new Date().toISOString()}</p>
      <p><a href="/">Back to the React app</a></p>
    </main>
  )
}
