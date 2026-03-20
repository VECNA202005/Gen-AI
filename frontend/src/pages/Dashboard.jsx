import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScoreChart from '../components/ScoreChart'
import { getProfileResults, getChartData, startSession } from '../services/api'

const roleOptions = [
  'software_engineer','backend_developer','frontend_developer','full_stack_developer','web_developer','mobile_app_developer',
  'data_analyst','data_scientist','business_analyst','data_engineer'
]

export default function Dashboard() {
  const [results, setResults] = useState([])
  const [chartData, setChartData] = useState({ labels: [], scores: [] })
  const [user, setUser] = useState(null)
  const storedRole = localStorage.getItem('selectedRole')
  const [selectedRole, setSelectedRole] = useState(storedRole || 'software_engineer')
  const [error, setError] = useState('')
  const [resumeAvailable, setResumeAvailable] = useState(false)
  const [reportError, setReportError] = useState('')
  const navigate = useNavigate()
  const roleLocked = Boolean(storedRole)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    setUser(JSON.parse(localStorage.getItem('user') || 'null'))

    const storedSession = JSON.parse(localStorage.getItem('testSession') || 'null')
    if (storedSession && storedSession.timeLeft > 0) {
      setResumeAvailable(true)
    }

    async function loadData() {
      const prof = await getProfileResults()
      setResults(prof.results || [])
      const ch = await getChartData()
      setChartData({ labels: ch.labels || [], scores: ch.scores || [] })
    }
    loadData().catch(() => {})
  }, [navigate])

  return (
    <div className="flex min-h-screen justify-center bg-slate-950 p-4">
      <div className="w-full max-w-6xl space-y-4">
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-white">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p>Welcome, {user?.name}</p>
          <p>Email: {user?.email}</p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-white">
          <h3 className="mb-3 text-xl font-bold">Start New Interview</h3>
          {resumeAvailable && (
            <button
              className="mb-3 rounded-lg bg-yellow-500 px-3 py-1 text-sm text-slate-900 hover:bg-yellow-400"
              onClick={() => navigate('/chat', { state: { resume: true } })}
            >
              Resume Test
            </button>
          )}
          <select
            className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={roleLocked}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>{role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            ))}
          </select>
          {roleLocked && <p className="mb-2 text-sm text-slate-400">Role locked: {selectedRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>}
          <button
            onClick={async () => {
              setError('')
              try {
                localStorage.setItem('selectedRole', selectedRole)
                const data = await startSession(selectedRole)
                if (data.question) {
                  navigate('/chat', { state: { role: selectedRole, question: data.question, total_questions: data.total_questions } })
                } else {
                  setError('No questions available for this role currently.')
                }
              } catch (err) {
                setError('Unable to start session. Please check backend.')
              }
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500"
          >
            Start Interview
          </button>
          {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-white">
          <h3 className="mb-3 text-xl font-bold">Score Chart</h3>
          <ScoreChart labels={chartData.labels} scores={chartData.scores} />
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-white">
          <h3 className="mb-3 text-xl font-bold">Recent Results</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {results.length === 0 && <p>No unmatched results yet.</p>}
            {results.map((r, i) => (
              <div key={i} className="rounded-lg border border-slate-700 p-3">
                <p><strong>{r.role}</strong></p>
                <p>Score: {r.score}/{r.total_questions}</p>
                <p>Attempted: {r.attempted}</p>
                <p>{r.message}</p>
                <p className="text-xs text-slate-400">{r.created_at}</p>
                <button
                  onClick={() => navigate(`/report/${r.id}`)}
                  className="mt-2 rounded-lg bg-indigo-600 px-3 py-1 text-sm hover:bg-indigo-500"
                >
                  View Report
                </button>
              </div>
            ))}
          </div>
          {reportError && <p className="mt-2 text-sm text-rose-400">{reportError}</p>}
        </div>
      </div>
    </div>
  )
}
