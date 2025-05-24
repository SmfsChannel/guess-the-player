import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Leaderboard from './Leaderboard'
import GuessHistory from './GuessHistory'

export default function App() {
  const [userId, setUserId] = useState(localStorage.getItem('user_id') || '')
  const [username, setUsername] = useState('')
  const [video, setVideo] = useState(null)
  const [guess, setGuess] = useState('')
  const [hint, setHint] = useState('')
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState(0)
  const [answeredGoals, setAnsweredGoals] = useState([])

  useEffect(() => {
    const savedId = localStorage.getItem('user_id')
    if (savedId) {
      setUserId(savedId)
      loadUserScore(savedId)
      loadAnsweredGoals(savedId)
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
      loadAnsweredGoals(existing.id)
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
    }
  }

  async function loadUserScore(id) {
    const { data, error } = await supabase.from('users').select('score').eq('id', id).single()
    if (data) setScore(data.score || 0)
  }

  async function loadAnsweredGoals(id) {
    const { data, error } = await supabase
      .from('guesses')
      .select('goal_id')
      .eq('user_id', id)

    const ids = data ? data.map(g => g.goal_id) : []
    setAnsweredGoals(ids)
    loadNextVideo(ids)
  }

  async function loadNextVideo(exclude = answeredGoals) {
    setLoading(true)
    const { data, error } = await supabase
      .from('goals')
      .select()

    if (error || !data || data.length === 0) {
      setHint('لا يوجد مقاطع حالياً')
      setLoading(false)
      return
    }

    const available = data.filter(v => !exclude.includes(v.id))
    if (available.length === 0) {
      setHint('🎉 لقد شاهدت جميع الأهداف!')
      setLoading(false)
      return
    }

    const random = available[Math.floor(Math.random() * available.length)]
    setVideo(random)
    setGuess('')
    setHint('')
    setLoading(false)
  }

  async function handleGuess() {
    if (!guess || !video || !userId) return

    const similarity = guess.toLowerCase().includes(video.correct_player.toLowerCase())
    const isCorrect = similarity

    const { data: previousGuesses } = await supabase
      .from('guesses')
      .select('id')
      .eq('user_id', userId)
      .eq('goal_id', video.id)

    const guessCount = previousGuesses ? previousGuesses.length + 1 : 1
    let points = 0
    if (isCorrect) {
      if (guessCount <= 3) points = 10
      else if (guessCount <= 10) points = 5
      else if (guessCount <= 30) points = 1
      else points = 0
    }

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
    hints.push(`🔢 عدد محاولاتك: ${guessCount}`)

    setHint(hints.join('\n'))

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

    setTimeout(() => {
      setAnsweredGoals(prev => [...prev, video.id])
      loadNextVideo([...answeredGoals, video.id])
    }, 2000)
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
      <GuessHistory userId={userId} />
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
