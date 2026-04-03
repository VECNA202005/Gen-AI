import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getResult } from '../services/api'
import PageWrapper from '../components/PageWrapper'

export default function Result() {
  const [result, setResult] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await getResult()
        setResult(data)
      } catch (err) {
        navigate('/dashboard')
      }
    }
    fetchResult()
  }, [navigate])

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center text-cyan-400 font-bold tracking-widest animate-pulse">
        CALCULATING FINAL SCORE...
      </div>
    )
  }

  const percentage = Math.round((result.score / result.total_questions) * 100)

  return (
    <PageWrapper className="items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center shadow-2xl relative overflow-hidden"
      >
        {/* Background Glow */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl"></div>

        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.2 }}
        >
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-cyan-500/30 bg-cyan-500/10 text-4xl shadow-[0_0_30px_rgba(34,211,238,0.2)]">
            🏆
          </div>
          <h1 className="mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-4xl font-extrabold text-transparent">Interview Complete</h1>
          <p className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-8">Performance Summary</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Role</p>
            <p className="text-sm font-bold text-white truncate px-2">{result.role.replace(/_/g, ' ')}</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Final Score</p>
            <p className="text-2xl font-black text-emerald-400">{result.score}<span className="text-xs text-slate-500">/{result.total_questions}</span></p>
          </div>
        </div>

        <div className="mb-8 rounded-xl bg-black/20 p-6 border border-white/5">
          <p className="text-lg font-medium text-slate-200 italic">"{result.message}"</p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.5)]"
            />
          </div>
          <p className="mt-2 text-right text-[10px] font-bold text-cyan-500 uppercase">Proficiency: {percentage}%</p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-4 font-bold text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          VIEW DETAILED REPORT
        </button>
      </motion.div>
    </PageWrapper>
  )
}
