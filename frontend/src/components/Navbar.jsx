import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Navbar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('testSession')
    localStorage.removeItem('selectedRole')
    navigate('/login')
  }

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-md shadow-lg"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <span className="text-2xl">⚡</span>
          <h1 className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-xl font-bold tracking-tight text-transparent transition-transform group-hover:scale-[1.02]">
            AI Interview Prep
          </h1>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/profile" className="flex items-center gap-3 group">
            <div className="h-8 w-8 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
              {JSON.parse(localStorage.getItem('user') || '{}')?.profile_photo ? (
                <img 
                  src={`http://localhost:5000${JSON.parse(localStorage.getItem('user') || '{}').profile_photo}`} 
                  alt="Profile" 
                  className="h-full w-full object-cover transition-transform group-hover:scale-110" 
                />
              ) : (
                <span className="text-xs">👤</span>
              )}
            </div>
            <span className="font-semibold text-slate-300 group-hover:text-cyan-400 transition-colors">Profile</span>
          </Link>
          <button 
            onClick={handleLogout} 
            className="rounded-lg bg-rose-500/20 px-4 py-2 text-sm font-bold text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all shadow-lg hover:shadow-rose-500/20"
          >
            Logout
          </button>
        </div>
      </div>
    </motion.nav>
  )
}
