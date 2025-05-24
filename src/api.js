const API_KEY = "9d10b78fb71a683bd71eb6017cead065"
const BASE_URL = "https://v3.football.api-sports.io"

export async function getPlayers(teamId = 591, season = 2023, page = 1) {
  const res = await fetch(`${BASE_URL}/players?team=${teamId}&season=${season}&page=${page}`, {
    headers: {
      "x-apisports-key": API_KEY
    }
  })

  if (!res.ok) {
    console.error("❌ خطأ في جلب اللاعبين")
    return []
  }

  const data = await res.json()

  return data.response.map(item => ({
    name: item.player.name,
    nationality: item.player.nationality,
    club: item.statistics[0].team.name,
    position: item.statistics[0].games.position,
    age: item.player.age,
    photo: item.player.photo,
  }))
}
