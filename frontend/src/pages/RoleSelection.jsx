import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { startSession } from '../services/api'

const roleOptions = [
  'software_engineer','backend_developer','frontend_developer','full_stack_developer','web_developer','mobile_app_developer',
  'data_analyst','data_scientist','business_analyst','data_engineer'
]

export default function RoleSelection() {
  const [selected, setSelected] = useState(localStorage.getItem('selectedRole') || roleOptions[0])
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const roleLocked = Boolean(localStorage.getItem('selectedRole'))

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    const storedRole = localStorage.getItem('selectedRole')
    if (storedRole) {
      navigate('/dashboard')
    }
  }, [navigate])

  const handleStart = async () => {
    setError('')
    try {
      localStorage.setItem('selectedRole', selected)
      const data = await startSession(selected)
      if (data.question) {
        navigate('/chat', { state: { role: selected, question: data.question, total_questions: data.total_questions } })
      } else {
        setError('No questions available for this role currently.')
      }
    } catch (err) {
      setError('Unable to start session. Please check backend.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-xl border border-slate-700 bg-slate-900 p-6 text-center shadow-xl">
        <h1 className="mb-4 text-2xl font-bold">AI Interview Preparation Chatbot</h1>
        <p className="mb-4 text-slate-300">Choose a role category to begin your interview session.</p>
        <select
          className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}          disabled={roleLocked}        >
          {roleOptions.map((role) => (
            <option key={role} value={role}>{role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
          ))}
        </select>
        {roleLocked && <p className="mb-2 text-sm text-slate-400">Role is locked to {selected.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}. Logout will keep the same role.</p>}
        <button
          onClick={handleStart}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500"
        >
          Start Interview
        </button>
        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
      </div>
    </div>
  )
}
