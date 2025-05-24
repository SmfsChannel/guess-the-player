import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Leaderboard from './Leaderboard'

export default function App() {
  const [userId, setUserId] = useState(localStorage.getItem('user_id') || '')
  const [username, setUsername] = useState('')
  const [video, setVideo] = useState(null)
  const [guess, setGuess] = useState('')
  const [hint, setHint] = useState('')
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    const savedId = localStorage.getItem('user_id')
    if (savedId) {
      setUserId(savedId)
      loadUserScore(savedId)
      loadNextVideo()
    }
  }, [])

  async function registerUser() {
    if (!username) return alert('اكتب اسم المستخدم')

    const { data: existing } = await supabase
      .from('users')
      .select()
      .eq('username', username)
      .single()

    if (existing) {
      localStorage.setItem('user_id', existing.id)
      setUserId(existing.id)
      setScore(existing.score || 0)
      loadNextVideo()
    } else {
      const { data, error } = await supabase
        .from('users')
        .insert([{ username }])
        .select()
        .single()

      if (error) return alert('خطأ في التسجيل')
      localStorage.setItem('user_id', data.id)
      setUserId(data.id)
      setScore(0)
      loadNextVideo()
    }
  }

  async function loadUserScore(id) {
    const { data, error } = await supabase.from('users').select('score').eq('id', id).single()
    if (data) setScore(data.score || 0)
  }

  async function loadNextVideo() {
    setLoading(true)
    const { data, error } = await supabase
      .from('goals')
      .select()
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) {
      setHint('لا يوجد مقاطع حاليا')
      setLoading(false)
      return
    }

    const random = data[Math.floor(Math.random() * data.length)]
    setVideo(random)
    setGuess('')
    setHint('')
    setLoading(false)
  }

  async function handleGuess() {
    if (!guess || !video || !userId) return

    const similarity = guess.toLowerCase().includes(video.correct_player.toLowerCase())
    const isCorrect = similarity

    const hints = []
    if (guess.toLowerCase() === video.correct_player.toLowerCase()) {
      hints.push('✅ الاسم مطابق تمامًا')
    } else if (similarity) {
      hints.push('✅ الاسم قريب جدًا')
    } else {
      hints.push('❌ الاسم غير مطابق')
    }

    hints.push(`🏷 النادي: ${video.club}`)
    hints.push(`🌍 الجنسية: ${video.nationality}`)
    hints.push(`📌 المركز: ${video.position}`)
    hints.push(`🎂 العمر: ${video.age}`)

    setHint(hints.join('\n'))

    const points = isCorrect ? 10 : 0

    await supabase.from('guesses').insert([
      {
        user_id: userId,
        goal_id: video.id,
        guessed_player: guess,
        is_correct: isCorrect,
        points_awarded: points
      }
    ])

    if (isCorrect && points > 0) {
      await supabase.from('users').update({ score: score + points }).eq('id', userId)
      setScore(score + points)
    }

    setTimeout(() => loadNextVideo(), 2000)
  }

  if (!userId) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>🎮 أدخل اسم المستخدم للبدء:</h2>
        <input value={username} onChange={e => setUsername(e.target.value)} />
        <button onClick={registerUser}>ابدأ</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>⚽ المرحلة الجديدة</h1>
      <p>النقاط: {score}</p>
      <Leaderboard />
      {loading ? (
        <p>جاري تحميل الفيديو...</p>
      ) : (
        video && (
          <>
            <video src={video.video_url} width="400" controls autoPlay muted></video>
            <br />
            <input
              type="text"
              placeholder="اكتب اسم اللاعب"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              style={{ padding: '0.5rem', fontSize: '1rem' }}
            />
            <button onClick={handleGuess} style={{ marginLeft: '1rem' }}>تأكيد التخمين</button>
            <pre style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>{hint}</pre>
          </>
        )
      )}
    </div>
  )
}
