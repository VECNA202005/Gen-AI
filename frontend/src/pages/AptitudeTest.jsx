import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageWrapper from '../components/PageWrapper'
import AILens from '../components/AILens'
import ProctorModal from '../components/ProctorModal'
import { submitSkillTest } from '../services/api'
import axios from 'axios'

export default function AptitudeTest() {
  const [questions, setQuestions] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(1800) // 30 minutes for 20 questions
  const [violations, setViolations] = useState(0)
  const [showWarning, setShowWarning] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  const isExiting = useRef(false)

  // Fetch 20 randomized questions
  useEffect(() => {
    const fetchAptitude = async () => {
      try {
        const resp = await axios.get('http://localhost:5000/skills-questions')
        // Shuffle and pick 20
        const all = resp.data.aptitude
        const shuffled = [...all].sort(() => 0.5 - Math.random()).slice(0, 20)
        setQuestions(shuffled)
      } catch (err) {
        console.error("Failed to load aptitude questions")
      }
    }
    fetchAptitude()
  }, [])

  // Anti-Cheat: Tab Switch Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isExiting.current && !submitted) {
        setViolations(prev => {
          const next = prev + 1
          if (next >= 3) {
            handleMalpracticeExit()
          } else {
            setShowWarning(true)
          }
          return next
        })
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [submitted])

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 && !submitted) handleSubmit()
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft, submitted])

  const handleMalpracticeExit = async () => {
    isExiting.current = true
    setShowWarning(true)
    try {
        await submitSkillTest('APTITUDE', { questions, userAnswers: answers }, ["MALPRACTICE DETECTED: 3 Tab Switches"])
    } catch(e) {}
  }

  const handleInstantExit = (reason) => {
    isExiting.current = true
    alert(reason)
    navigate('/dashboard')
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const resp = await submitSkillTest('APTITUDE', { questions, userAnswers: answers }, [])
      setResult(resp)
      setSubmitted(true)
    } catch (err) {
      alert("Submission failed")
    } finally {
      setLoading(false)
    }
  }

  if (submitted && result) {
    return (
      <PageWrapper className="items-center justify-center p-8">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-3xl shadow-2xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-4xl shadow-inner border border-emerald-500/40">✅</div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter mb-4">ASSESSMENT COMPLETED</h2>
          <div className="mb-8 rounded-2xl bg-black/40 p-10 border border-white/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5"><span className="text-8xl font-black">AI</span></div>
             <p className="text-6xl font-black text-emerald-400 mb-4">{result.score}%</p>
             <p className="text-lg text-slate-300 font-bold leading-relaxed italic">“{result.feedback}”</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-5 font-black text-white px-8 uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">Continue to Dashboard</button>
        </motion.div>
      </PageWrapper>
    )
  }

  if (questions.length === 0) return <PageWrapper className="items-center justify-center"><div className="text-white font-black animate-pulse tracking-[0.5em] uppercase">Loading Aptitude Matrix...</div></PageWrapper>

  const q = questions[currentIdx]

  return (
    <PageWrapper className="p-4 sm:p-8">
      <ProctorModal 
        isOpen={showWarning} 
        strikeCount={violations}
        variant={violations >= 3 ? "MALPRACTICE" : "CAUTION"}
        onConfirm={() => {
            if (violations >= 3) navigate('/dashboard')
            else setShowWarning(false)
        }} 
      />
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-10 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
             <div className="h-14 w-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl shadow-inner">🧠</div>
             <div>
                <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">Analytical Assessment</h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Item {currentIdx + 1} of {questions.length}</p>
             </div>
          </div>

          <div className="hidden lg:block relative z-20">
             <AILens compact={true} />
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
             <div className="px-8 py-3 rounded-xl bg-slate-900 border border-white/10 text-white font-black tracking-widest text-xl shadow-inner min-w-[140px] text-center">
                ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
             </div>
             <button onClick={handleSubmit} className="px-10 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase tracking-widest shadow-lg transition-transform hover:scale-105 active:scale-95">Finish Test</button>
          </div>
        </div>

        {/* Progress */}
        <div className="relative mb-12 h-3 w-full rounded-full bg-white/5 overflow-hidden border border-white/5 shadow-inner">
           <motion.div initial={{ width: 0 }} animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
                <motion.div key={currentIdx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="min-h-[450px] rounded-[2.5rem] border border-white/10 bg-white/5 p-12 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5"><span className="text-9xl font-black italic select-none">{currentIdx + 1}</span></div>
                    <h2 className="text-3xl font-black text-white mb-16 leading-tight relative z-10 max-w-2xl">{q.question}</h2>
                    
                    <div className="grid gap-4 md:grid-cols-2 relative z-10">
                        {q.options.map((opt, i) => (
                          <button
                            key={i}
                            disabled={loading}
                            onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                            className={`group relative flex items-center justify-between rounded-3xl border-2 p-8 text-left transition-all duration-300 ${
                              answers[q.id] === opt 
                              ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_30px_rgba(34,211,238,0.2)]' 
                              : 'border-white/5 bg-black/40 hover:border-white/20 hover:bg-black/60'
                            }`}
                          >
                            <div className="flex items-center gap-6">
                               <span className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 font-black text-sm transition-all ${answers[q.id] === opt ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-white/5 border-white/10 text-slate-500 group-hover:border-white/30'}`}>
                                  {String.fromCharCode(65 + i)}
                               </span>
                               <span className={`text-lg font-bold transition-colors ${answers[q.id] === opt ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{opt}</span>
                            </div>
                            {answers[q.id] === opt && <motion.div layoutId="check-apt" className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_15px_#22d3ee]" />}
                          </button>
                        ))}
                    </div>
                </motion.div>

                <div className="flex justify-between items-center mt-10">
                   <button 
                     disabled={currentIdx === 0} 
                     onClick={() => setCurrentIdx(prev => prev - 1)}
                     className="px-12 py-5 rounded-2xl border border-white/10 text-slate-500 font-black uppercase tracking-widest hover:bg-white/5 disabled:opacity-10 transition-all text-xs"
                   >
                     Previous Point
                   </button>
                   <button 
                     onClick={() => currentIdx < questions.length - 1 ? setCurrentIdx(prev => prev + 1) : handleSubmit()}
                     className="px-14 py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-2xl hover:scale-105 active:scale-95 text-xs"
                   >
                     {currentIdx === questions.length - 1 ? 'Execute Submission' : 'Next Matrix Question'}
                   </button>
                </div>
            </div>

            {/* Sidebar info */}
            <div className="lg:col-span-4 space-y-6">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-xl">
                   <h3 className="text-xs font-black text-cyan-400 mb-4 uppercase tracking-[0.2em] border-b border-white/5 pb-4">Exam Navigation</h3>
                   <div className="grid grid-cols-5 gap-2">
                       {questions.map((_, i) => (
                           <button 
                               key={i} 
                               onClick={() => setCurrentIdx(i)}
                               className={`h-10 w-full rounded-lg border font-bold text-[10px] transition-all flex items-center justify-center ${
                                   currentIdx === i ? 'bg-cyan-500 border-cyan-400 text-black' :
                                   answers[questions[i].id] ? 'bg-white/10 border-white/20 text-white' :
                                   'border-white/5 bg-black/20 text-slate-700'
                               }`}
                           >
                               {i + 1}
                           </button>
                       ))}
                   </div>
                </div>

                <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-8 backdrop-blur-xl">
                    <h3 className="text-xs font-black text-rose-400 mb-3 uppercase tracking-widest flex items-center gap-2">⚠️ Proctoring Active</h3>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed italic">The AI is monitoring your input focus and tab visibility. Switching away will trigger a violation count. Two violations will terminate your assessment.</p>
                </div>
            </div>
        </div>
      </div>
    </PageWrapper>
  )
}
