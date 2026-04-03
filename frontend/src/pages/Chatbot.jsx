import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ChatBox from '../components/ChatBox'
import { sendAnswer, finishSession } from '../services/api'
import PageWrapper from '../components/PageWrapper'

const SESSION_KEY = 'testSession'

export default function Chatbot() {
  const location = useLocation()
  const navigate = useNavigate()
  const [chatHistory, setChatHistory] = useState([])
  const [answer, setAnswer] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [score, setScore] = useState(0)
  const [typing, setTyping] = useState(false)
  const [user, setUser] = useState(null)
  const [questionTimeLeft, setQuestionTimeLeft] = useState(120)
  const [isRecording, setIsRecording] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)

  const persistSession = (session) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY)
  }

  const setBotMessage = (message) => {
    setChatHistory(prev => [...prev, { from: 'bot', text: message }])
  }

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || 'null')
    setUser(userData)
  }, [])

  const initSession = async () => {
    if (location.state?.resume) {
      const stored = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
      if (!stored) {
        navigate('/dashboard')
        return
      }
      setCurrentQuestion(stored.currentQuestion)
      setQuestionIndex(stored.questionIndex)
      setTotalQuestions(stored.totalQuestions)
      setScore(stored.score)
      setChatHistory(stored.chatHistory || [{ from: 'bot', text: `Question ${stored.questionIndex}: ${stored.currentQuestion}` }])
      return
    }

    const storedRole = location.state?.role
    const storedQuestion = location.state?.question
    if (!storedRole || !storedQuestion) {
      navigate('/dashboard')
      return
    }

    setCurrentQuestion(storedQuestion)
    setQuestionIndex(1)
    setTotalQuestions(location.state?.total_questions || 5)
    setScore(0)
    setQuestionTimeLeft(120)
    const initialHistory = [{ from: 'bot', text: `Question 1: ${storedQuestion}` }]
    setChatHistory(initialHistory)

    persistSession({
      role: storedRole,
      currentQuestion: storedQuestion,
      questionIndex: 1,
      totalQuestions: location.state?.total_questions || 5,
      score: 0,
      chatHistory: initialHistory,
      timeLeft: 120
    })
  }

  useEffect(() => {
    initSession()
  }, [location, navigate])

  useEffect(() => {
    const timer = setInterval(() => {
      setQuestionTimeLeft(prev => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!user?.role || !currentQuestion) return
    persistSession({
      role: user.role,
      currentQuestion,
      questionIndex,
      totalQuestions,
      score,
      chatHistory,
      timeLeft: questionTimeLeft
    })
  }, [user, currentQuestion, questionIndex, totalQuestions, score, chatHistory, questionTimeLeft])

  const addBotMessage = (message) => {
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setBotMessage(message)
    }, 600)
  }

  const handleFinish = async () => {
    setIsFinishing(true)
    try {
      await finishSession()
      clearSession()
      navigate('/result')
    } catch (err) {
      if (err.response?.status === 400) {
        navigate('/result')
      } else {
        addBotMessage('Could not end session. Please check your connection.')
      }
    } finally {
      setIsFinishing(false)
    }
  }

  const handleSend = async () => {
    if (!answer.trim() && questionTimeLeft > 0) return
    
    const finalAnswer = answer.trim() || "Time exceeded before an answer was given."
    setChatHistory(prev => [...prev, { from: 'user', text: finalAnswer }])
    setAnswer('')
    
    try {
      const result = await sendAnswer(user?.role, currentQuestion, finalAnswer)
      setScore(result.score)
      
      addBotMessage(result.feedback)
      if (result.suggested_answer) {
        setTimeout(() => addBotMessage(`💡 Suggested: ${result.suggested_answer}`), 800)
      }

      if (result.completed) {
        setTimeout(handleFinish, 2500)
        return
      }

      setCurrentQuestion(result.next_question)
      setQuestionIndex(prev => prev + 1)
      setTotalQuestions(result.total_questions)
      setQuestionTimeLeft(120)

      setTimeout(() => {
        addBotMessage(`Question ${questionIndex + 1}: ${result.next_question}`)
      }, 1800)

    } catch (err) {
      addBotMessage('Error connecting to AI. Please try sending again.')
    }
  }

  useEffect(() => {
    if (questionTimeLeft === 0 && !typing) {
      handleSend()
    }
  }, [questionTimeLeft, typing])

  const toggleRecording = () => {
    if (isRecording) return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return
    
    const recognition = new SpeechRecognition()
    recognition.onstart = () => setIsRecording(true)
    recognition.onresult = (event) => setAnswer(prev => prev + (prev ? ' ' : '') + event.results[0][0].transcript)
    recognition.onend = () => setIsRecording(false)
    recognition.start()
  }

  return (
    <PageWrapper className="p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl relative">
        {/* Header Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center gap-4 relative z-10">
             <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-2xl shadow-inner">🤖</div>
             <div>
                <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">AI Interviewer</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{(user?.role || '').replace(/_/g, ' ')}</p>
             </div>
          </div>

          <div className="flex items-center gap-6 relative z-10 bg-black/40 px-6 py-2 rounded-2xl border border-white/5">
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Progress</p>
              <p className="text-sm font-black text-white">{questionIndex}/{totalQuestions}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Score</p>
              <p className="text-sm font-black text-emerald-400">{score}</p>
            </div>
            <div className={`text-center rounded-xl px-4 py-2 border ${questionTimeLeft < 30 ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' : 'bg-white/5 border-white/10 text-cyan-400'}`}>
              <p className="text-[10px] uppercase font-black tracking-widest">Timer</p>
              <p className="text-sm font-mono font-bold leading-none">
                {Math.floor(questionTimeLeft / 60)}:{String(questionTimeLeft % 60).padStart(2, '0')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Chat window */}
        <ChatBox chatHistory={chatHistory} />

        {/* Action Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl"
        >
          {typing && (
            <div className="mb-2 flex items-center gap-2 px-2 text-xs text-cyan-400/70 italic">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-500"></span>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-500 delay-75"></span>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-500 delay-150"></span>
              </span>
              AI is analyzing...
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={toggleRecording}
              className={`flex h-14 w-14 items-center justify-center rounded-xl transition-all ${
                isRecording 
                  ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse' 
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {isRecording ? '⏹' : '🎤'}
            </button>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isRecording ? "Listening..." : "Provide your expert answer..."}
              className="flex-1 rounded-xl border border-white/10 bg-black/40 px-5 text-slate-100 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium"
            />
            <button
              onClick={handleSend}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 font-bold text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              disabled={typing}
            >
              SEND
            </button>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleFinish}
              disabled={isFinishing}
              className="text-xs font-bold text-slate-500 hover:text-rose-400 transition-colors uppercase tracking-widest"
            >
              {isFinishing ? 'Finishing...' : 'Abort & Finish Interview'}
            </button>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  )
}
