import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { login } from '../services/api'
import PageWrapper from '../components/PageWrapper'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const data = await login({ email, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    }
  }

  return (
    <PageWrapper className="items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-[0_0_40px_rgba(34,211,238,0.1)] backdrop-blur-xl"
      >
        <div className="mb-6 text-center">
          <h2 className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-3xl font-bold text-transparent">Welcome Back</h2>
          <p className="mt-2 text-sm text-slate-300">Sign in to continue your interview journey</p>
        </div>
        {error && <div className="mb-4 rounded-lg bg-rose-500/20 border border-rose-500/50 p-3 shadow-inner text-sm text-rose-200 text-center">{error}</div>}
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <input
            type="email"
            required
            placeholder="Email Address"
            className="rounded-xl border border-white/10 bg-black/20 p-4 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            placeholder="Password"
            className="rounded-xl border border-white/10 bg-black/20 p-4 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button type="submit" className="mt-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-4 font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all hover:scale-[1.02] active:scale-[0.98]">
            Sign In
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Don't have an account? <Link to="/register" className="font-semibold text-cyan-400 hover:text-cyan-300">Register here</Link>
        </p>
      </motion.div>
    </PageWrapper>
  )
}
