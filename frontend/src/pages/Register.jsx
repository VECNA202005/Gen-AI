import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { register } from '../services/api'
import PageWrapper from '../components/PageWrapper'

const roleOptions = [
  { value: 'software_engineer', label: 'Software Engineer' },
  { value: 'backend_developer', label: 'Backend Developer' },
  { value: 'frontend_developer', label: 'Frontend Developer' },
  { value: 'full_stack_developer', label: 'Full Stack Developer' },
  { value: 'web_developer', label: 'Web Developer' },
  { value: 'mobile_app_developer', label: 'Mobile App Developer' },
  { value: 'data_analyst', label: 'Data Analyst' },
  { value: 'data_scientist', label: 'Data Scientist' },
  { value: 'business_analyst', label: 'Business Analyst' },
  { value: 'data_engineer', label: 'Data Engineer' }
]

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(roleOptions[0].value)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      await register({ name, email, password, role })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <PageWrapper className="items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-[0_0_40px_rgba(168,85,247,0.1)] backdrop-blur-xl"
      >
        <div className="mb-6 text-center">
          <h2 className="bg-gradient-to-r from-purple-400 to-cyan-500 bg-clip-text text-3xl font-bold text-transparent">Create Account</h2>
          <p className="mt-2 text-sm text-slate-300">Join to start cracking your interviews</p>
        </div>
        {error && <div className="mb-4 rounded-lg bg-rose-500/20 border border-rose-500/50 p-3 shadow-inner text-sm text-rose-200 text-center">{error}</div>}
        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <input
            type="text"
            required
            placeholder="Full Name"
            className="rounded-xl border border-white/10 bg-black/20 p-4 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            type="email"
            required
            placeholder="Email Address"
            className="rounded-xl border border-white/10 bg-black/20 p-4 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            placeholder="Password"
            className="rounded-xl border border-white/10 bg-black/20 p-4 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Your Specialization</label>
            <select
              className="w-full appearance-none rounded-xl border border-white/10 bg-black/20 p-4 text-white font-medium focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all cursor-pointer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="mt-2 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-600 px-4 py-4 font-bold text-white shadow-lg shadow-purple-500/25 hover:from-purple-400 hover:to-cyan-500 transition-all hover:scale-[1.02] active:scale-[0.98]">
            Sign Up
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account? <Link to="/login" className="font-semibold text-purple-400 hover:text-purple-300">Sign in</Link>
        </p>
      </motion.div>
    </PageWrapper>
  )
}
