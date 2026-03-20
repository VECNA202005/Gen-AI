import { NavLink, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (!token) return null

  const icon = user?.icon || localStorage.getItem('profileIcon') || '👤'

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-4 py-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="text-lg font-bold text-cyan-300 cursor-pointer" onClick={() => navigate('/dashboard')}>AI Interview Prep</div>
        <div className="flex items-center gap-3 text-sm">
          <NavLink className={({isActive}) => isActive ? 'text-blue-300' : 'text-slate-300'} to="/profile">
            <span className="text-lg">{icon}</span> Profile
          </NavLink>
          <button className="text-rose-300" onClick={logout}>Logout</button>
        </div>
      </div>
    </header>
  )
}
