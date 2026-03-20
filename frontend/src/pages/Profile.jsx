import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfileResults } from '../services/api'

export default function Profile() {
  const [results, setResults] = useState([])
  const [user, setUser] = useState(null)
  const [selectedIcon, setSelectedIcon] = useState(localStorage.getItem('profileIcon') || '👤')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    const profile = JSON.parse(localStorage.getItem('user') || 'null')
    setUser(profile)

    async function fetchResults() {
      const res = await getProfileResults()
      setResults(res.results || [])
    }
    fetchResults().catch(() => {})

    setSelectedIcon(localStorage.getItem('profileIcon') || '👤')
  }, [navigate])

  const iconOptions = ['👤','🧑‍💻','🤖','🧠','🚀','🛠']

  const handleIconChange = (icon) => {
    setSelectedIcon(icon)
    localStorage.setItem('profileIcon', icon)
    const stored = JSON.parse(localStorage.getItem('user') || '{}')
    if (stored) {
      stored.icon = icon
      localStorage.setItem('user', JSON.stringify(stored))
      setUser(stored)
    }
  }

  const totalAttempts = results.length
  const bestScore = results.reduce((max, r) => Math.max(max, +r.score), 0)
  const lastActive = results.length > 0 ? results[0].created_at : 'N/A'

  return (
    <div className="flex min-h-screen justify-center bg-slate-950 p-4">
      <div className="w-full max-w-5xl space-y-4">
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-white">
          <h2 className="text-xl font-bold">Profile</h2>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{selectedIcon}</span>
            <div>
              <p>Name: {user?.name}</p>
              <p>Email: {user?.email}</p>
            </div>
          </div>
          <div className="mt-3">
            <p>Total attempts: {totalAttempts}</p>
            <p>Best score: {bestScore}/{results[0]?.total_questions || 0}</p>
            <p>Last active: {lastActive}</p>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Choose profile icon</h3>
            <div className="mt-2 flex gap-2">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  onClick={() => handleIconChange(icon)}
                  className={`rounded-lg p-2 text-2xl ${selectedIcon===icon ? 'ring-2 ring-cyan-400' : 'ring-1 ring-slate-700'} focus:outline-none`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-white">
          <h2 className="mb-3 text-xl font-bold">Past Attempts</h2>
          {results.length === 0 && <p>No attempt history yet.</p>}
          <ul className="space-y-2">
            {results.map((item, idx) => (
              <li key={idx} className="rounded-lg border border-slate-700 p-3">
                <p><strong>{item.role}</strong> - {item.created_at}</p>
                <p>Score: {item.score}/{item.total_questions}</p>
                <p>{item.message}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
