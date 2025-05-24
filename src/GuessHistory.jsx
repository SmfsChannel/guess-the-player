import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function GuessHistory({ userId }) {
  const [guesses, setGuesses] = useState([])

  useEffect(() => {
    async function fetchGuesses() {
      const { data, error } = await supabase
        .from('guesses')
        .select('guessed_player, is_correct, points_awarded, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!error && data) setGuesses(data)
    }

    if (userId) fetchGuesses()
  }, [userId])

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>📜 آخر التخمينات</h3>
      <ul>
        {guesses.map((g, i) => (
          <li key={i}>
            <strong>{g.guessed_player}</strong> – {g.is_correct ? '✅ صحيح' : '❌ خطأ'} – نقاط: {g.points_awarded}
          </li>
        ))}
      </ul>
    </div>
  )
}
