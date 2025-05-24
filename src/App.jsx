import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [username, setUsername] = useState('')
  const [userId, setUserId] = useState(localStorage.getItem('user_id') || '')

  // إذا المستخدم مسجّل مسبقًا
  useEffect(() => {
    const savedId = localStorage.getItem('user_id')
    if (savedId) {
      setUserId(savedId)
    }
  }, [])

  // حفظ المستخدم في Supabase
  const handleRegister = async () => {
    if (!username) return alert('اكتب اسم المستخدم')
    const { data, error } = await supabase
      .from('users')
      .insert([{ username }])
      .select()
      .single()

    if (error) {
      console.error(error)
      alert('حدث خطأ أثناء التسجيل')
    } else {
      localStorage.setItem('user_id', data.id)
      setUserId(data.id)
    }
  }

  // إذا المستخدم مسجّل
  if (userId) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>🎮 مرحبًا!</h1>
        <p>أنت مسجل في اللعبة. جاهز نبدأ؟ 👇</p>
        {/* هنا نكمل اللعبة لاحقًا */}
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>⚽ Guess the Player</h1>
      <p>أدخل اسم المستخدم للبدء:</p>
      <input
        type="text"
        value={username}
        onChange={e => setUsername(e.target.value)}
        placeholder="اسم المستخدم"
        style={{ padding: '0.5rem', fontSize: '1rem' }}
      />
      <button
        onClick={handleRegister}
        style={{
          marginLeft: '1rem',
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          cursor: 'pointer',
        }}
      >
        ابدأ اللعبة
      </button>
    </div>
  )
}

export default App
