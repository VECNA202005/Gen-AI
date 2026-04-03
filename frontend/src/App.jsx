import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import MouseBackground from './components/MouseBackground'
import Login from './pages/Login'
import Register from './pages/Register'
import RoleSelection from './pages/RoleSelection'
import Chatbot from './pages/Chatbot'
import Result from './pages/Result'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Report from './pages/Report'
import AptitudeTest from './pages/AptitudeTest'
import CodingTest from './pages/CodingTest'
import SkillReport from './pages/SkillReport'

export default function App() {
  const token = localStorage.getItem('token')
  const location = useLocation()

  return (
    <div className="min-h-screen text-slate-100 font-sans selection:bg-cyan-500/30">
      <MouseBackground />
      {token && <div className="relative z-50"><Navbar /></div>}
      
      <main className="relative z-10 flex min-h-screen flex-col pt-[72px]">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/roles" element={<RoleSelection />} />
            <Route path="/chat" element={<Chatbot />} />
            <Route path="/result" element={<Result />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/report/:id" element={<Report />} />
            <Route path="/aptitude" element={<AptitudeTest />} />
            <Route path="/coding" element={<CodingTest />} />
            <Route path="/skill-report/:id" element={<SkillReport />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  )
}
