import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { startSession } from '../services/api'
import PageWrapper from '../components/PageWrapper'

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
        setError('No questions available.')
      }
    } catch (err) {
      setError('Connection failed.')
    }
  }

  return (
    <PageWrapper className="items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-3xl p-10 text-center shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl"></div>

        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.2 }}
        >
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-3xl shadow-inner border border-cyan-500/20">🚀</div>
          <h1 className="mb-4 text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent italic tracking-tighter">SELECT YOUR PATH</h1>
          <p className="mb-10 text-slate-400 font-medium tracking-wide max-w-sm mx-auto">Choose your specialization to customize the AI interview difficulty and question set.</p>
        </motion.div>

        <div className="relative mb-8 group">
          <select
            className="w-full appearance-none rounded-2xl border border-white/10 bg-black/40 p-5 text-white font-bold tracking-wide focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all cursor-pointer group-hover:border-white/20"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={roleLocked}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role} className="bg-slate-900">{role.replace(/_/g, ' ').toUpperCase()}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-cyan-500 font-bold">⌄</div>
        </div>

        {roleLocked && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 text-xs font-bold text-rose-400/80 uppercase tracking-widest bg-rose-500/5 py-2 px-4 rounded-full border border-rose-500/20 inline-block"
          >
            ⚠️ Current session role: {selected.replace(/_/g, ' ')}
          </motion.p>
        )}

        <button
          onClick={handleStart}
          className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 p-5 font-black text-white shadow-[0_0_40px_rgba(34,211,238,0.2)] hover:shadow-[0_0_60px_rgba(34,211,238,0.3)] transition-all transform hover:scale-[1.01] active:scale-[0.99] uppercase tracking-widest"
        >
          INITIALIZE INTERVIEW
        </button>
        {error && <p className="mt-6 text-sm font-bold text-rose-500 animate-pulse uppercase tracking-[0.2em]">{error}</p>}
      </motion.div>
    </PageWrapper>
  )
}
