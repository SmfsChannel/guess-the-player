import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [username, setUsername] = useState('')
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('')
  const [userId, setUserId] = useState(localStorage.getItem('user_id') || '')

  // إذا المستخدم مسجل مسبقًا
  useEffect(() => {
    const savedId = localStorage.getItem('user_id')
    if (savedId) setUserId(savedId)
  }, [])

  // دالة توليد رمز عشوائي
  function generateRecoveryCode() {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += charset.charAt(Math.floor(Math.random() * charset.length))
      if (i === 3) code += '-' // شكل الرمز مثل: XQ1A-ZP7B
    }
    return code
  }

  // تسجيل مستخدم جديد
  const handleRegister = async () => {
    if (!username) return alert('اكتب اسم المستخدم')

    const { data: existingUser } = await supabase
      .from('users')
      .select()
      .eq('username', username)
      .single()

    if (existingUser) {
      alert('اسم المستخدم مستخدم من قبل.\nإذا كنت صاحب الحساب، استخدم رمز الاسترجاع.')
      return
    }

    const recovery_code = generateRecoveryCode()
    const { data, error } = await supabase
      .from('users')
      .insert([{ username, recovery_code }])
      .select()
      .single()

    if (error) {
      console.error(error)
      alert('حدث خطأ أثناء التسجيل')
    } else {
      localStorage.setItem('user_id', data.id)
      localStorage.setItem('recovery_code', data.recovery_code)
      setUserId(data.id)
      alert(`🎉 تم إنشاء حسابك!\nرمز استرجاع الحساب:\n${data.recovery_code}\nاحفظه جيدًا`)
    }
  }

  // استرجاع الحساب باستخدام الرمز
  const handleRecovery = async () => {
    if (!recoveryCodeInput) return alert('أدخل رمز الاسترجاع')

    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('recovery_code', recoveryCodeInput.toUpperCase())
      .single()

    if (error || !data) {
      alert('لم يتم العثور على الحساب. تحقق من الرمز.')
    } else {
      localStorage.setItem('user_id', data.id)
      localStorage.setItem('recovery_code', data.recovery_code)
      setUserId(data.id)
      alert('✅ تم استرجاع الحساب بنجاح')
    }
  }

  if (userId) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>🎮 مرحبًا بك!</h1>
        <p>أنت مسجّل في اللعبة.</p>
        {/* هنا نضيف الواجهة القادمة لاحقًا */}
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>⚽ Guess the Player</h1>
      <p>سجّل اسم المستخدم للبدء:</p>
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

      <hr style={{ margin: '2rem 0' }} />

      <p>🔐 هل فقدت حسابك؟ استرجعه بالرمز:</p>
      <input
        type="text"
        value={recoveryCodeInput}
        onChange={e => setRecoveryCodeInput(e.target.value)}
        placeholder="رمز الاسترجاع"
        style={{ padding: '0.5rem', fontSize: '1rem' }}
      />
      <button
        onClick={handleRecovery}
        style={{
          marginLeft: '1rem',
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          cursor: 'pointer',
        }}
      >
        استرجاع الحساب
      </button>
    </div>
  )
}

export default App
