'use client'

import { useState } from 'react'
import './styles.css'

const rows = [
  {
    title: 'Trending now',
    items: [
      ['The Last Signal', 'Sci-Fi · 2024', 'linear-gradient(145deg, #173b51, #0d111b 55%, #ef6d4d)'],
      ['Nocturne', 'Mystery · 2023', 'linear-gradient(145deg, #36224c, #171327 55%, #e29b66)'],
      ['Northbound', 'Drama · 2024', 'linear-gradient(145deg, #47625a, #172b2b 55%, #dbc47e)'],
      ['After the Rain', 'Romance · 2022', 'linear-gradient(145deg, #bb654a, #39223d 58%, #e1bd96)'],
      ['The Workshop', 'Comedy · 2024', 'linear-gradient(145deg, #de9b33, #512c31 60%, #ed5a44)'],
    ],
  },
  {
    title: 'Because you watched The Last Signal',
    items: [
      ['Orbital', 'Sci-Fi · 2021', 'linear-gradient(145deg, #192e58, #10111e 55%, #5085bd)'],
      ['The Divide', 'Thriller · 2024', 'linear-gradient(145deg, #596c7a, #151923 58%, #cc6548)'],
      ['Green Room', 'Drama · 2020', 'linear-gradient(145deg, #3e6657, #101d24 58%, #a9c783)'],
      ['Signal Lost', 'Sci-Fi · 2023', 'linear-gradient(145deg, #8b5a56, #22182a 60%, #6eb9c4)'],
      ['Deep Current', 'Documentary · 2022', 'linear-gradient(145deg, #2d7183, #111e30 60%, #82c1bb)'],
    ],
  },
]

function PlayIcon() {
  return <span className="play-icon" aria-hidden="true">▶</span>
}

function MovieCard({ item, onPlay }) {
  return (
    <button className="movie-card" onClick={() => onPlay(item[0])}>
      <div className="poster" style={{ background: item[2] }}>
        <span className="poster-mark">N</span>
        <span className="poster-title">{item[0]}</span>
        <span className="poster-glow" />
      </div>
      <strong>{item[0]}</strong>
      <small>{item[1]}</small>
    </button>
  )
}

export default function Home() {
  const [active, setActive] = useState('Home')
  const [message, setMessage] = useState('')

  const play = (title) => {
    setMessage(`Starting ${title}…`)
    window.setTimeout(() => setMessage(''), 2600)
  }

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#" aria-label="NOVA home"><span>N</span> NOVA</a>
        <div className="nav-links">
          {['Home', 'Series', 'Films', 'New & Popular'].map((link) => (
            <button className={active === link ? 'active' : ''} key={link} onClick={() => setActive(link)}>
              {link}
            </button>
          ))}
        </div>
        <div className="nav-actions">
          <button className="search" aria-label="Search">⌕</button>
          <button className="profile" aria-label="Profile">AM</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="live-dot" /> NOVA ORIGINAL</p>
          <h1>Find your<br /><em>next story.</em></h1>
          <p className="hero-description">Stories that stay with you. Discover bold films, unforgettable series, and new worlds to get lost in.</p>
          <div className="hero-actions">
            <button className="button button-light" onClick={() => play('The Last Signal')}><PlayIcon /> Play</button>
            <button className="button button-quiet" onClick={() => setMessage('Added to your list')}><span className="plus">+</span> My List</button>
          </div>
          <p className="meta"><span>98% Match</span> 2024 <b>16+</b> 1 Season</p>
        </div>
        <div className="hero-art" aria-label="Abstract artwork for The Last Signal">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="planet" />
          <span className="vertical-label">THE LAST SIGNAL</span>
        </div>
        <div className="hero-fade" />
      </section>

      <section className="content">
        <div className="continue">
          <div className="section-heading">
            <div><p className="eyebrow">KEEP WATCHING</p><h2>Continue watching</h2></div>
            <button className="see-all">See all <span>→</span></button>
          </div>
          <div className="continue-card">
            <div className="mini-poster"><span>N</span></div>
            <div className="continue-info">
              <span className="kicker">S1:E4 · THE THRESHOLD</span>
              <h3>The Last Signal</h3>
              <p>38 min left</p>
              <div className="progress"><span /></div>
            </div>
            <button className="round-play" onClick={() => play('The Last Signal')}><PlayIcon /></button>
          </div>
        </div>

        {rows.map((row) => (
          <div className="row" key={row.title}>
            <div className="section-heading"><h2>{row.title}</h2><button className="see-all">Explore <span>→</span></button></div>
            <div className="movie-grid">{row.items.map((item) => <MovieCard key={item[0]} item={item} onPlay={play} />)}</div>
          </div>
        ))}
      </section>

      <footer><span className="brand"><span>N</span> NOVA</span><p>Built for stories. Designed for discovery.</p><span>© 2024 NOVA</span></footer>
      {message && <div className="toast">{message}</div>}
    </main>
  )
}
