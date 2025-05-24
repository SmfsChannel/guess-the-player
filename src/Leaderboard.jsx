import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([])

  useEffect(() => {
    async function loadLeaders() {
      const { data, error } = await supabase
        .from('users')
        .select('username, score')
        .order('score', { ascending: false })
        .limit(10)

      if (!error && data) setLeaders(data)
    }

    loadLeaders()
  }, [])

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2>🏆 لائحة المتصدرين</h2>
      <ol>
        {leaders.map((user, i) => (
          <li key={i}>
            {user.username} - {user.score} نقطة
          </li>
        ))}
      </ol>
    </div>
  )
}
