import { useEffect, useState } from 'react'
import { getPlayers } from './api'

function App() {
  const [players, setPlayers] = useState([])

  useEffect(() => {
    async function fetchPlayers() {
      const data = await getPlayers()
      setPlayers(data)
    }
    fetchPlayers()
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>⚽ لاعبي الفريق</h1>
      {players.length === 0 && <p>جارٍ تحميل البيانات...</p>}
      {players.map((p, i) => (
        <div key={i} style={{ marginBottom: '1rem' }}>
          <strong>{p.name}</strong> ({p.position}) – {p.club}
          <br />
          <img src={p.photo} alt={p.name} width={60} />
        </div>
      ))}
    </div>
  )
}

export default App
