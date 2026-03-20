import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import RoleSelection from './pages/RoleSelection'
import Chatbot from './pages/Chatbot'
import Result from './pages/Result'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Report from './pages/Report'

export default function App() {
  const token = localStorage.getItem('token')

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {token && <Navbar />}
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/roles" element={<RoleSelection />} />
        <Route path="/chat" element={<Chatbot />} />
        <Route path="/result" element={<Result />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/report/:id" element={<Report />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  )
}
