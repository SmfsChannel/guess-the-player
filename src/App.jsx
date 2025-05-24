import { useEffect, useState } from "react"
import { getPlayers } from "./api"

// ⬇️ اللاعب الصحيح (اللي سجّل الهدف الحالي)
const correctPlayer = {
  name: "Rúben Neves",
  nationality: "Portugal",
  club: "Al-Hilal",
  position: "Midfielder",
  age: 26,
}

function App() {
  const [players, setPlayers] = useState([])
  const [guess, setGuess] = useState("")
  const [hint, setHint] = useState(null)

  useEffect(() => {
    async function fetchPlayers() {
      const data = await getPlayers()
      setPlayers(data)
    }
    fetchPlayers()
  }, [])

  const handleGuess = () => {
    // نبحث عن اللاعب اللي اسمه يشبه التخمين
    const found = players.find(p =>
      p.name.toLowerCase().includes(guess.toLowerCase())
    )

    if (!found) {
      setHint("❌ لم يتم العثور على هذا اللاعب")
      return
    }

    // مقارنة التلميحات
    const hints = []
    if (found.club === correctPlayer.club) hints.push("✅ النادي صحيح")
    else hints.push("❌ النادي مختلف")

    if (found.nationality === correctPlayer.nationality) hints.push("✅ الجنسية صحيحة")
    else hints.push("❌ الجنسية مختلفة")

    if (found.position === correctPlayer.position) hints.push("✅ المركز صحيح")
    else hints.push("❌ المركز مختلف")

    if (found.age === correctPlayer.age) hints.push("✅ العمر مطابق")
    else hints.push(`🔁 العمر تقريبي (الفرق ${Math.abs(found.age - correctPlayer.age)} سنوات)`)

    setHint(hints.join("\n"))
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>⚽ Guess the Player</h1>

      <input
        type="text"
        placeholder="اكتب اسم اللاعب بالإنجليزي"
        value={guess}
        onChange={e => setGuess(e.target.value)}
        style={{ padding: "0.5rem", fontSize: "1rem" }}
      />
      <button onClick={handleGuess} style={{ marginLeft: "1rem", padding: "0.5rem 1rem" }}>
        خمن
      </button>

      <pre style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>
        {hint}
      </pre>
    </div>
  )
}

export default App
