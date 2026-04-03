import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Editor from '@monaco-editor/react'
import PageWrapper from '../components/PageWrapper'
import AILens from '../components/AILens'
import ProctorModal from '../components/ProctorModal'
import ConfirmModal from '../components/ConfirmModal'
import { submitSkillTest } from '../services/api'
import axios from 'axios'

const PISTON_API = 'https://emkc.org/api/v2/piston/execute'

const languageMap = {
  javascript: { id: 'javascript', version: '18.15.0' },
  python: { id: 'python', version: '3.10.0' },
  java: { id: 'java', version: '15.0.2' },
  cpp: { id: 'c++', version: '10.2.0' }
}

const delay = ms => new Promise(r => setTimeout(r, ms))


export default function CodingTest() {
  const [questions, setQuestions] = useState(null)
  const [activeTab, setActiveTab] = useState('easy') 
  const [languages, setLanguages] = useState({ easy: 'javascript', medium: 'javascript', hard: 'javascript' })
  
  const [solutions, setSolutions] = useState({ easy: '', medium: '', hard: '' })
  const [tabResults, setTabResults] = useState({ 
    easy: new Array(3).fill({ status: 'pending', output: '' }), 
    medium: new Array(3).fill({ status: 'pending', output: '' }), 
    hard: new Array(3).fill({ status: 'pending', output: '' }) 
  })
  const [terminalLogs, setTerminalLogs] = useState([])

  const [timeLeft, setTimeLeft] = useState(10800) // 3 hours
  const [violations, setViolations] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [finalResult, setFinalResult] = useState(null)
  
  const [showWarning, setShowWarning] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const navigate = useNavigate()
  const isExiting = useRef(false)
  const terminalRef = useRef(null)

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalLogs])

  // Fetch Questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const resp = await axios.get('http://localhost:5000/skills-questions')
        const qPool = resp.data.coding
        
        // Pick one random question per level
        const selected = {
            easy: qPool.easy[Math.floor(Math.random() * qPool.easy.length)],
            medium: qPool.medium[Math.floor(Math.random() * qPool.medium.length)],
            hard: qPool.hard[Math.floor(Math.random() * qPool.hard.length)]
        }
        
        setQuestions(selected)
        setSolutions({
            easy: selected.easy.starter_code.javascript,
            medium: selected.medium.starter_code.javascript,
            hard: selected.hard.starter_code.javascript
        })
      } catch (err) {
        console.error("Failed to fetch questions")
      }
    }
    fetchQuestions()
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
  }, [])

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) handleInstantExit("Time has run out.")
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const handleMalpracticeExit = async () => {
    isExiting.current = true
    setShowWarning(true) // Force modal to stay/open as MALPRACTICE
    try {
        await submitSkillTest('CODING', { solutions, languages }, ["MALPRACTICE DETECTED: 3 Tab Switches"])
    } catch(e) {}
  }

  const handleInstantExit = (reason) => {
    isExiting.current = true
    alert(reason)
    navigate('/dashboard')
  }

  const runVisibleCases = async () => {
    if (!questions) return
    setLoading(true)
    const currentLang = languages[activeTab]
    setTerminalLogs([{ type: 'info', content: `Preparing execution environment for ${currentLang.toUpperCase()}...` }])
    
    const activeQuestion = questions[activeTab]
    const currentCode = solutions[activeTab]
    const nextResults = [...tabResults[activeTab]]

    for (let i = 0; i < 3; i++) {
        setTerminalLogs(prev => [...prev, { type: 'info', content: `Running Visible Test Case ${i + 1} of 3...` }])
        try {
            if (i > 0) await delay(1000)

            const payload = {
                language: languageMap[currentLang].id,
                version: languageMap[currentLang].version,
                files: [{ content: currentCode + `\nconsole.log(JSON.stringify(solve(...${activeQuestion.cases[i].input})))` }]
            }
            if (currentLang === 'python') {
                payload.files[0].content = currentCode + `\nimport json\nprint(json.dumps(solve(*${activeQuestion.cases[i].input})))`
            }
            if (currentLang === 'java') {
                // Remove class wrapper and reconstruct
                const innerCode = currentCode.replace(/class\s+Solution\s*\{/, '').replace(/\}$/, '')
                // Wrap in main class for proper java execution
                payload.files[0].content = `
import java.util.*;
class Main { 
    ${innerCode} 
    public static void main(String[] args) { 
        // Cannot execute easy reflection logic without types, relying on user correct class structure.
        System.out.println("Java interactive execution not fully supported yet.");
    } 
}`
            }
            if (currentLang === 'cpp') {
                payload.files[0].content = currentCode + `\n// Standard output parsing omitted for C++ mock test.\nint main(){return 0;}`
            }

            const response = await axios.post(PISTON_API, payload)
            const stdout = response.data.run.stdout.trim()
            const stderr = response.data.run.stderr.trim()
            
            const success = (stdout.split('\n').pop().trim() === activeQuestion.cases[i].output)

            if (stdout) setTerminalLogs(prev => [...prev, { type: 'stdout', content: stdout }])
            if (stderr) setTerminalLogs(prev => [...prev, { type: 'stderr', content: stderr }])
            
            nextResults[i] = { status: success ? 'passed' : 'failed', output: stdout.split('\n').pop().trim() }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Limit reached or offline.'
            setTerminalLogs(prev => [...prev, { type: 'stderr', content: `API Error: ${errorMsg}` }])
            nextResults[i] = { status: 'error', output: 'Network Error' }
        }
    }
    setTerminalLogs(prev => [...prev, { type: 'info', content: 'Execution Cycle Finished.' }])
    setTabResults(prev => ({ ...prev, [activeTab]: nextResults }))
    setLoading(false)
  }

  const triggerFinish = () => setShowConfirmModal(true)

  const confirmFinish = async () => {
    setShowConfirmModal(false)
    setLoading(true)
    try {
        const resp = await submitSkillTest('CODING', { solutions, languages }, violations > 0 ? [`Tab Switch x${violations}`] : [])
        setFinalResult(resp)
        setSubmitted(true)
    } catch (err) {
        alert("Submission failed. The Matrix was unable to store your record.")
    } finally {
        setLoading(false)
    }
  }

  const changeLanguage = (lang) => {
    setLanguages(prev => ({ ...prev, [activeTab]: lang }))
    const activeQuestion = questions[activeTab]
    if (!activeQuestion) return
    
    setSolutions(prev => ({
        ...prev,
        [activeTab]: activeQuestion.starter_code[lang] || activeQuestion.starter_code.javascript
    }))
  }

  if (submitted && finalResult) {
    return (
      <PageWrapper className="items-center justify-center p-8">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl rounded-[3rem] border border-white/10 bg-white/5 p-12 text-center backdrop-blur-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><span className="text-9xl font-black italic select-none">FINISH</span></div>
          <div className="mx-auto mb-10 h-24 w-24 rounded-[2rem] bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-5xl shadow-[0_0_50px_rgba(34,211,238,0.2)]">🏅</div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter mb-4 uppercase">CHALLENGE FINALIZED</h2>
          <div className="mb-10 rounded-3xl bg-black/60 p-12 border border-white/5 shadow-inner">
             <p className="text-7xl font-black text-cyan-400 mb-6 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">{finalResult.score}%</p>
             <p className="text-lg text-slate-300 font-bold leading-relaxed italic">“{finalResult.feedback}”</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="w-full rounded-2xl bg-white text-black py-5 font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl hover:scale-105 active:scale-95">Return to Dashboard</button>
        </motion.div>
      </PageWrapper>
    )
  }

  if (!questions) return <PageWrapper className="items-center justify-center"><div className="text-white font-black animate-pulse uppercase tracking-[1em] text-sm">Compiling Matrix Virtual Workspace...</div></PageWrapper>

  const activeQuestion = questions[activeTab]
  const currentLang = languages[activeTab]

  return (
    <PageWrapper className="p-4 sm:p-8 flex flex-col items-center">
      <ProctorModal 
        isOpen={showWarning} 
        strikeCount={violations}
        variant={violations >= 3 ? "MALPRACTICE" : "CAUTION"}
        onConfirm={() => {
            if (violations >= 3) navigate('/dashboard')
            else setShowWarning(false)
        }} 
      />
       <ConfirmModal 
        isOpen={showConfirmModal}
        onConfirm={confirmFinish}
        onCancel={() => setShowConfirmModal(false)}
      />
      <div className="w-full max-w-[1600px]">
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row justify-between items-end lg:items-center gap-6 relative z-50">
          <div className="flex items-center gap-6">
             <div className="h-16 w-16 rounded-[1.25rem] bg-indigo-500/10 border-2 border-indigo-500/30 flex items-center justify-center text-4xl shadow-inner group">💻</div>
             <div>
                <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Programming Studio</h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Deep Logic & Algorithmic Challenge</p>
             </div>
          </div>

          <div className="hidden lg:block relative z-30">
             <AILens compact={true} />
          </div>

          <div className="flex items-center gap-4 bg-black/40 p-2.5 rounded-[1.5rem] border border-white/5 backdrop-blur-3xl shadow-2xl">
             <div className="px-10 py-3 rounded-xl bg-slate-900 border border-white/10 text-white font-black tracking-[0.2em] text-xl shadow-inner min-w-[200px] text-center">
                ⏱️ {Math.floor(timeLeft / 3600)}:{(Math.floor((timeLeft % 3600) / 60)).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
             </div>
             
             <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="bg-white/5 border border-white/10 rounded-xl px-10 py-3.5 text-xs font-black text-white hover:border-cyan-500 transition-all uppercase tracking-widest flex items-center justify-between gap-3 shadow-inner min-w-[200px]"
                >
                  {languageMap[languages[activeTab]].id === 'cpp' ? 'C++ 20' : languages[activeTab].toUpperCase()}
                  <span className={`text-[10px] opacity-50 italic ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-[calc(100%+0.5rem)] left-0 w-full bg-slate-900 border border-white/10 rounded-xl shadow-2xl shadow-cyan-500/10 backdrop-blur-3xl z-[150]"
                    >
                      <div className="py-2 flex flex-col">
                        {Object.keys(languageMap).map(lang => (
                          <button
                            key={lang}
                            onClick={() => { changeLanguage(lang); setIsDropdownOpen(false); }}
                            className="w-full px-6 py-4 text-left text-[11px] font-black text-slate-300 hover:bg-cyan-500 hover:text-black transition-colors uppercase tracking-[0.2em] relative group"
                          >
                            {lang === 'cpp' ? 'C++ 20' : lang.toUpperCase()}
                            {languages[activeTab] === lang && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-500 group-hover:text-black">●</span>}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             <button 
               onClick={triggerFinish} 
               disabled={loading}
               className="px-14 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
             >
               {loading ? 'Processing...' : 'Submit Session'}
             </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 h-[780px]">
           {/* Left Sidebar: Problem & Cases */}
           <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
              <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-10 backdrop-blur-3xl shadow-xl">
                 <div className="flex gap-4 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-full mb-8">
                    {['easy', 'medium', 'hard'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setActiveTab(level)}
                        className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                          activeTab === level 
                          ? 'bg-white text-black shadow-lg scale-105' 
                          : 'text-slate-500 hover:text-white'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                 </div>
                 
                 <h3 className="text-[10px] font-black text-cyan-400 mb-6 border-b border-white/5 pb-4 uppercase tracking-[0.3em] flex justify-between">
                    <span>Task Specification</span>
                    <span className="text-white/20 italic">{activeTab.toUpperCase()}</span>
                 </h3>
                 <p className="text-xl text-white font-bold leading-relaxed mb-8">{activeQuestion.problem}</p>
                 <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-inner">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">⚡ Complexity Limit</p>
                    <p className="text-xs text-slate-400 font-bold italic leading-relaxed">{activeQuestion.constraints}</p>
                 </div>
              </div>

              <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-10 backdrop-blur-3xl shadow-xl flex-grow flex flex-col">
                 <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Validation Matrix</h3>
                    <button onClick={runVisibleCases} disabled={loading} className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest text-[10px] shadow-lg transition-transform hover:scale-105 active:scale-95">
                        {loading ? 'Running...' : 'Run Diagnostics'}
                    </button>
                 </div>
                 
                 <div className="space-y-4 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                    {tabResults[activeTab].map((res, i) => (
                      <div key={i} className={`rounded-2xl border transition-all p-5 ${
                         res.status === 'passed' ? 'border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.05)]' :
                         res.status === 'failed' ? 'border-rose-500/20 bg-rose-500/5' :
                         'border-white/5 bg-black/40'
                      }`}>
                         <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Case 0x0{i + 1}</span>
                            <span className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest tracking-tighter ${
                                res.status === 'passed' ? 'bg-emerald-500/20 text-emerald-400' :
                                res.status === 'failed' ? 'bg-rose-500/20 text-rose-400' :
                                'bg-white/5 text-slate-700'
                            }`}>{res.status}</span>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mb-1">Expected</p>
                               <div className="text-xs text-white font-mono bg-black/40 p-2.5 rounded border border-white/5 overflow-hidden text-ellipsis">{activeQuestion.cases[i].output}</div>
                            </div>
                            <div>
                               <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mb-1">Actual</p>
                               <div className={`text-xs font-mono p-2.5 rounded border border-white/5 overflow-hidden text-ellipsis ${res.status === 'failed' ? 'text-rose-400' : 'text-slate-400'}`}>
                                  {res.output || 'NULL'}
                               </div>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Right: Editor & Terminal */}
           <div className="lg:col-span-8 flex flex-col h-full gap-4">
              {/* Editor */}
              <div className="flex-grow rounded-[2.5rem] border border-white/10 bg-black/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
                <div className="absolute top-0 right-0 z-20 flex bg-white/5 backdrop-blur-md border-b border-l border-white/10 rounded-bl-3xl">
                    <div className="px-8 py-3 border-r border-white/10 text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">{currentLang.toUpperCase()} COMPILER</div>
                    <div className="px-8 py-3 text-[10px] font-black text-cyan-400 tracking-[0.2em] uppercase animate-pulse italic">Autosaving Matrix...</div>
                </div>
                <Editor
                    height="100%"
                    language={currentLang}
                    value={solutions[activeTab]}
                    theme="vs-dark"
                    onChange={(val) => setSolutions(prev => ({ ...prev, [activeTab]: val }))}
                    options={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 60, left: 30 },
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        cursorBlinking: 'expand',
                        cursorWidth: 5,
                        lineNumbersMinChars: 4,
                        roundedSelection: true,
                        bracketPairColorization: { enabled: true }
                    }}
                />
              </div>

              {/* Terminal */}
              <div className="h-[250px] rounded-[2rem] border border-white/10 bg-black backdrop-blur-3xl shadow-2xl overflow-hidden flex flex-col">
                 <div className="bg-white/5 px-6 py-2.5 flex justify-between items-center border-b border-white/10">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                       <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                       Output Console
                    </h4>
                    <button onClick={() => setTerminalLogs([])} className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">Clear Console</button>
                 </div>
                 <div 
                    ref={terminalRef}
                    className="flex-grow overflow-y-auto p-6 font-mono text-sm leading-relaxed custom-scrollbar selection:bg-cyan-500/30"
                 >
                    {terminalLogs.length === 0 ? (
                      <p className="text-slate-800 italic uppercase tracking-widest text-[10px] font-black text-center mt-12">Waiting for code execution request...</p>
                    ) : (
                      terminalLogs.map((log, i) => (
                        <div key={i} className="mb-1">
                           <span className={`mr-2 font-black text-[10px] uppercase opacity-40 ${
                               log.type === 'stdout' ? 'text-white' : 
                               log.type === 'stderr' ? 'text-rose-500' : 'text-cyan-500'
                           }`}>
                              {log.type === 'info' ? '>>' : log.type === 'stderr' ? '[ERR]' : '[LOG]'}
                           </span>
                           <span className={`whitespace-pre-wrap font-bold ${
                               log.type === 'stdout' ? 'text-slate-200' : 
                               log.type === 'stderr' ? 'text-rose-400' : 'text-cyan-400 italic'
                           }`}>
                              {log.content}
                           </span>
                        </div>
                      ))
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </PageWrapper>
  )
}
