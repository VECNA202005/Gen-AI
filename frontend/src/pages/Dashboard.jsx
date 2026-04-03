import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ScoreChart from '../components/ScoreChart'
import { getProfileResults, getChartData, startSession, getSkillResults } from '../services/api'
import PageWrapper from '../components/PageWrapper'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
}

export default function Dashboard() {
  const [results, setResults] = useState([])
  const [chartData, setChartData] = useState({ labels: [], scores: [] })
  const [user, setUser] = useState(null)
  const [skillResults, setSkillResults] = useState([])
  const [error, setError] = useState('')
  const [resumeAvailable, setResumeAvailable] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    const userData = JSON.parse(localStorage.getItem('user') || 'null')
    setUser(userData)

    const storedSession = JSON.parse(localStorage.getItem('testSession') || 'null')
    if (storedSession && storedSession.timeLeft > 0) {
      setResumeAvailable(true)
    }

    async function loadData() {
      try {
        const prof = await getProfileResults()
        setResults(prof.results || [])
        const ch = await getChartData()
        setChartData({ labels: ch.labels || [], scores: ch.scores || [] })
        const sk = await getSkillResults()
        setSkillResults(sk.results || [])
      } catch (err) {
        console.error("Dashboard load failed", err)
      }
    }
    loadData()
  }, [navigate])

  const handleStartInterview = async () => {
    setError('')
    const role = user?.role || 'software_engineer'
    try {
      const data = await startSession(role)
      if (data.question) {
        navigate('/chat', { state: { role, question: data.question, total_questions: data.total_questions } })
      } else {
        setError('No questions available.')
      }
    } catch (err) {
      setError('Unable to start session.')
    }
  }

  const formatRole = (r) => (r || '').replace(/_/g, ' ').toUpperCase()

  return (
    <PageWrapper className="items-center p-4 sm:p-8">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-6xl space-y-6"
      >
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center rounded-2xl border border-cyan-500/20 bg-white/5 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <div className="text-8xl font-black italic select-none">{formatRole(user?.role)}</div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent italic">DASHBOARD</h2>
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-black text-cyan-400 tracking-widest uppercase">
                {formatRole(user?.role)}
              </span>
            </div>
            <p className="text-slate-300 font-medium">Welcome back, <span className="text-white font-bold">{user?.name}</span></p>
          </div>
          <div className="mt-4 md:mt-0 relative z-10">
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Account</p>
                <div className="inline-flex items-center rounded-lg bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 ring-1 ring-inset ring-white/10 backdrop-blur-md">
                   {user?.email}
                </div>
             </div>
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Action Card */}
          <motion.div variants={itemVariants} className="col-span-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-xl flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl transition-all group-hover:bg-cyan-500/10"></div>
            
            <div className="relative z-10 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-3xl shadow-inner border border-cyan-500/20">🎯</div>
              <h3 className="mb-2 text-xl font-black text-white italic uppercase tracking-tighter">Ready for your test?</h3>
              <p className="mb-8 text-sm text-slate-400 font-medium">Your interview path is locked to <span className="text-cyan-400 font-bold">{formatRole(user?.role)}</span></p>
              
              {resumeAvailable && (
                <button
                  className="mb-4 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-4 font-black text-white shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
                  onClick={() => navigate('/chat', { state: { resume: true } })}
                >
                  ▶ Resume Session
                </button>
              )}
              
              <button
                onClick={handleStartInterview}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 px-4 py-4 font-black text-white shadow-[0_0_30px_rgba(34,211,238,0.2)] hover:shadow-[0_0_50px_rgba(34,211,238,0.3)] transition-all transform hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-xs"
              >
                Launch Interview
              </button>
              {error && <p className="mt-4 text-xs font-bold text-rose-400 uppercase tracking-widest">{error}</p>}
            </div>
          </motion.div>

          {/* Chart Card */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-xl">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Progress Analytics</h3>
               <div className="flex gap-2">
                  <div className="h-2 w-2 rounded-full bg-cyan-500"></div>
                  <div className="h-2 w-2 rounded-full bg-purple-500"></div>
               </div>
            </div>
            <div className="h-[280px] w-full">
              <ScoreChart labels={chartData.labels} scores={chartData.scores} />
            </div>
          </motion.div>
        </div>

        {/* --- New Section: General Assessments --- */}
        <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-xl relative overflow-hidden group cursor-pointer hover:border-purple-500/30 transition-all" onClick={() => navigate('/aptitude')}>
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
              <div className="flex items-center gap-6">
                 <div className="h-14 w-14 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🧠</div>
                 <div>
                    <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">Aptitude Test</h4>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Logical & Quantitative Reasoning</p>
                 </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-xl relative overflow-hidden group cursor-pointer hover:border-orange-500/30 transition-all" onClick={() => navigate('/coding')}>
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl group-hover:bg-orange-500/20 transition-all"></div>
              <div className="flex items-center gap-6">
                 <div className="h-14 w-14 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">⚡</div>
                 <div>
                    <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">Coding Challenge</h4>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Algorithms & Data Structures</p>
                 </div>
              </div>
            </div>
        </motion.div>

        {/* Skill Test & Interview History */}
        {(skillResults.length > 0 || results.length > 0) && (
          <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-xl">
             <h3 className="mb-8 text-xl font-black text-white italic uppercase tracking-tighter">Assessment History</h3>
             <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {skillResults.map((s, i) => (
                  <div key={`skill-${i}`} className="rounded-xl border border-white/5 bg-black/40 p-5 shadow-lg flex flex-col items-center text-center">
                     <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg text-lg ${s.test_type === 'CODING' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-purple-500/10 text-purple-400'}`}>
                        {s.test_type === 'CODING' ? '💻' : '🧠'}
                     </span>
                     <p className="font-black text-white text-[10px] tracking-widest uppercase mb-1">{s.test_type}</p>
                     <p className="text-2xl font-black text-white mb-2">{s.score}%</p>
                     <p className="text-[10px] text-slate-500 font-bold mb-4">{new Date(s.created_at).toLocaleDateString()}</p>
                     <button 
                        onClick={() => navigate(`/skill-report/${s.id}`)}
                        className="mt-auto px-4 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[8px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
                     >
                        View Website Report
                     </button>
                  </div>
                ))}
                {results.map((r, i) => (
                  <div key={`int-${i}`} className="rounded-xl border border-white/5 bg-black/40 p-5 shadow-lg flex flex-col items-center text-center">
                     <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg text-lg bg-emerald-500/10 text-emerald-400">
                        🎙️
                     </span>
                     <p className="font-black text-white text-[10px] tracking-widest uppercase mb-1">INTERVIEW</p>
                     <p className="text-2xl font-black text-white mb-2">{r.score}/{r.total_questions}</p>
                     <p className="text-[10px] text-slate-500 font-bold mb-4">{new Date(r.created_at).toLocaleDateString()}</p>
                     <button 
                        onClick={() => navigate(`/report/${r.id}`)}
                        className="mt-auto px-4 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[8px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
                     >
                        View AI Report
                     </button>
                  </div>
                ))}
             </div>
          </motion.div>
        )}
      </motion.div>
    </PageWrapper>
  )
}
