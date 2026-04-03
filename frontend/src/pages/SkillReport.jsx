import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageWrapper from '../components/PageWrapper'
import { getSkillResult } from '../services/api'
import Editor from '@monaco-editor/react'

export default function SkillReport() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const loadReport = async () => {
      try {
        const data = await getSkillResult(id)
        setReport(data)
      } catch (err) {
        console.error("Report load failed")
      } finally {
        setLoading(false)
      }
    }
    loadReport()
  }, [id])

  if (loading) return <PageWrapper className="items-center justify-center p-8"><div className="text-white font-black animate-pulse uppercase tracking-widest">Retrieving Matrix Report...</div></PageWrapper>
  if (!report) return <PageWrapper className="items-center justify-center p-8"><div className="text-rose-500 font-black uppercase">Report Not Found</div></PageWrapper>

  const isCoding = report.test_type === 'CODING'

  return (
    <PageWrapper className="p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <div className="mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-6">
              <div className={`h-20 w-20 rounded-3xl flex items-center justify-center text-4xl shadow-2xl border-2 ${
                  isCoding ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
              }`}>
                 {isCoding ? '💻' : '🧠'}
              </div>
              <div>
                 <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">{report.test_type} ASSESSMENT</h1>
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Generated: {new Date(report.created_at).toLocaleString()}</p>
              </div>
           </div>
           <button onClick={() => navigate('/dashboard')} className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all">Back to Dashboard</button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
           <div className="lg:col-span-1 rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-3xl shadow-2xl text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500"></div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Final Score</p>
              <p className="text-7xl font-black text-white mb-2">{report.score}%</p>
              <div className={`mx-auto h-2 w-16 rounded-full mb-6 ${report.score >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
           </div>

           <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-3xl shadow-2xl relative">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-cyan-500/5 blur-3xl"></div>
              <h3 className="text-xs font-black text-cyan-400 mb-4 uppercase tracking-widest italic tracking-tighter">AI Analysis & Feedback</h3>
              <p className="text-xl text-slate-200 font-bold leading-relaxed italic">“{report.feedback}”</p>
              {report.infractions.length > 0 && (
                <div className="mt-6 flex items-center gap-3">
                   <span className="px-3 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] font-black text-rose-400 uppercase tracking-widest">Proctoring Flag: {report.infractions.join(', ')}</span>
                </div>
              )}
           </div>
        </div>

        {isCoding ? (
           <div className="space-y-8">
              {['easy', 'medium', 'hard'].map((level) => (
                <div key={level} className="rounded-3xl border border-white/10 bg-black/40 overflow-hidden shadow-2xl">
                   <div className="bg-white/5 p-6 border-b border-white/10 flex justify-between items-center">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest italic">{level} Level Solution</h4>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Persisted Source Code</span>
                   </div>
                   <div className="h-[400px]">
                      <Editor
                        height="100%"
                        defaultLanguage="javascript"
                        value={report.raw_data[level] || '// No solution provided'}
                        theme="vs-dark"
                        options={{ readOnly: true, fontSize: 14, minimap: { enabled: false }, fontFamily: 'JetBrains Mono' }}
                      />
                   </div>
                </div>
              ))}
           </div>
        ) : (
           <div className="rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-3xl shadow-2xl">
              <h3 className="text-xs font-black text-purple-400 mb-8 uppercase tracking-widest">Response Matrix</h3>
              <div className="space-y-6">
                 {report.raw_data.questions.map((q, i) => (
                    <div key={i} className="flex flex-col md:flex-row justify-between gap-4 p-6 rounded-2xl bg-black/40 border border-white/5">
                       <div className="max-w-2xl">
                          <p className="text-xs text-slate-500 font-black mb-2 uppercase">Q{i + 1}</p>
                          <p className="text-white font-bold leading-relaxed">{q.question}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Your Selection</p>
                          <p className={`text-sm font-black uppercase tracking-widest ${report.raw_data.userAnswers[q.id] === q.answer ? 'text-emerald-400' : 'text-rose-400'}`}>
                             {report.raw_data.userAnswers[q.id] || 'SKIP'} 
                             {report.raw_data.userAnswers[q.id] === q.answer ? ' ✓' : ' ✗'}
                          </p>
                          <p className="text-[8px] text-slate-600 font-black mt-1 uppercase">Correct: {q.answer}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </div>
    </PageWrapper>
  )
}
