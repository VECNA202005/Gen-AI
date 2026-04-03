import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getResultById } from '../services/api'
import PageWrapper from '../components/PageWrapper'

export default function Report() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchReport() {
      try {
        const data = await getResultById(id)
        setReport(data)
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to load report details.')
      }
    }
    fetchReport()
  }, [id])

  if (error) {
    return (
      <PageWrapper className="items-center justify-center p-4">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center backdrop-blur-xl">
          <p className="text-rose-400 font-bold mb-4">{error}</p>
          <button onClick={() => navigate('/dashboard')} className="rounded-xl bg-white/10 px-6 py-2 font-bold text-white hover:bg-white/20 transition-all">
            Return to Dashboard
          </button>
        </div>
      </PageWrapper>
    )
  }

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center text-cyan-400 font-black tracking-tighter animate-pulse">
        LOADING ANALYTICS...
      </div>
    )
  }

  return (
    <PageWrapper className="p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-6">
        {/* Header section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6"
        >
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent uppercase tracking-tight">
              Interview Report
            </h2>
            <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
               <span className="text-cyan-400">{report.role.replace(/_/g, ' ')}</span>
               <span className="opacity-30">|</span>
               <span>{new Date(report.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="rounded-xl bg-white/10 border border-white/20 px-6 py-3 font-bold text-white hover:bg-white/20 transition-all shadow-lg"
          >
            ← BACK TO DASHBOARD
          </button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { label: 'Total Score', value: `${report.score}/${report.total_questions}`, color: 'text-emerald-400' },
             { label: 'Attempted', value: report.attempted, color: 'text-cyan-400' },
             { label: 'Accuracy', value: `${Math.round((report.score / report.total_questions) * 100)}%`, color: 'text-purple-400' },
             { label: 'Status', value: 'Completed', color: 'text-blue-400' }
           ].map((stat, i) => (
             <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i }}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"
             >
                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{stat.label}</p>
                <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
             </motion.div>
           ))}
        </div>

        {/* Overview Message */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 italic text-slate-300 shadow-xl"
        >
          <span className="text-emerald-400 text-2xl mr-2">“</span>
          {report.message}
          <span className="text-emerald-400 text-2xl ml-1">”</span>
        </motion.div>

        {/* Proctoring Log */}
        {report.infractions && report.infractions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 shadow-xl"
          >
            <h3 className="text-sm font-black text-rose-400 uppercase tracking-widest mb-4">⚠️ Proctoring Alerts</h3>
            <div className="space-y-2">
              {report.infractions.map((inf, i) => (
                <div key={i} className="flex justify-between items-center text-xs border-b border-rose-500/10 pb-2">
                  <span className="font-bold text-rose-200">{inf.type.replace(/_/g, ' ')}</span>
                  <span className="text-slate-500">{new Date(inf.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Detailed Q&A */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] px-4">Transcript & Analysis</h3>
          {report.details.map((d, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + (idx * 0.05) }}
              className="rounded-2xl border border-white/5 bg-black/20 p-6 hover:border-white/10 transition-colors shadow-lg"
            >
              <div className="flex items-start gap-4 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-[10px] font-black text-slate-500 border border-white/10">
                  {idx + 1}
                </span>
                <p className="text-lg font-bold text-slate-100 leading-tight">{d.question}</p>
              </div>
              
              <div className="ml-12 space-y-4">
                <div className="rounded-xl bg-cyan-500/5 border-l-2 border-cyan-500 p-4">
                  <p className="text-[10px] font-black text-cyan-500 uppercase mb-2">Your Expert Response</p>
                  <p className="text-sm text-slate-300 leading-relaxed italic">"{d.answer || "No answer provided."}"</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-purple-500/5 border-l-2 border-purple-500 p-4">
                    <p className="text-[10px] font-black text-purple-500 uppercase mb-2">AI EVALUATION</p>
                    <p className="text-xs text-slate-300 font-medium">{d.feedback}</p>
                    {d.matched_keywords && d.matched_keywords.length > 0 && (
                       <div className="mt-3 flex flex-wrap gap-2">
                          {d.matched_keywords.map(kw => (
                            <span key={kw} className="text-[9px] font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10 text-slate-500 uppercase">
                              {kw}
                            </span>
                          ))}
                       </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center items-center rounded-xl bg-white/5 border border-white/10 p-4">
                     <p className="text-[10px] font-black text-slate-500 uppercase mb-1">SCORE</p>
                     <p className="text-3xl font-black text-emerald-400">{d.score}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageWrapper>
  )
}
