import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [userId, setUserId] = useState(localStorage.getItem('user_id') || '')
  const [username, setUsername] = useState('')
  const [video, setVideo] = useState(null)
  const [guess, setGuess] = useState('')
  const [hint, setHint] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const savedId = localStorage.getItem('user_id')
    if (savedId) {
      setUserId(savedId)
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
      loadNextVideo()
    }
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

    // اختيار هدف عشوائي
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

    // تلميحات إضافية (عرض عام)
    hints.push(`🏷 النادي: ${video.club}`)
    hints.push(`🌍 الجنسية: ${video.nationality}`)
    hints.push(`📌 المركز: ${video.position}`)
    hints.push(`🎂 العمر: ${video.age}`)

    setHint(hints.join('\n'))

    // حساب النقاط
    const points = isCorrect ? 10 : 0

    // حفظ التخمين
    await supabase.from('guesses').insert([
      {
        user_id: userId,
        goal_id: video.id,
        guessed_player: guess,
        is_correct: isCorrect,
        points_awarded: points
      }
    ])

    // تحديث نقاط المستخدم
    if (isCorrect) {
      await supabase
        .from('users')
        .update({ score: supabase.rpc('increment_score', { user_id_input: userId, value: points }) })
        .eq('id', userId)
    }

    // الانتقال للمرحلة التالية بعد ثواني
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
