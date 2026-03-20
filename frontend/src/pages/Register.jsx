import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../services/api'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      await register({ name, email, password })
      setSuccess('Registered successfully! Please login.')
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <h1 className="mb-4 text-2xl font-bold">Register</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white" />
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white" />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white" />
          <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500">Register</button>
          {error && <p className="text-rose-400">{error}</p>}
          {success && <p className="text-emerald-400">{success}</p>}
        </form>
        <p className="mt-3 text-sm text-slate-300">Already registered? <Link to="/login" className="text-blue-400">Login</Link></p>
      </div>
    </div>
  )
}
