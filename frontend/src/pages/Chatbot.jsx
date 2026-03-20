import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ChatBox from '../components/ChatBox'
import { sendAnswer, getResult, startSession, finishSession } from '../services/api'

// Fixed test duration: 30 minutes (1800 seconds)
const TOTAL_TEST_SECONDS = 1800
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
  const [role, setRole] = useState('')
  const [timeLeft, setTimeLeft] = useState(TOTAL_TEST_SECONDS)

  const persistSession = (session) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY)
  }

  const setBotMessage = (message) => {
    setChatHistory(prev => [...prev, { from: 'bot', text: message }])
  }

  const initSession = async () => {
    if (location.state?.resume) {
      const stored = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
      if (!stored || typeof stored.timeLeft !== 'number' || stored.timeLeft <= 0) {
        navigate('/dashboard')
        return
      }
      setRole(stored.role)
      setCurrentQuestion(stored.currentQuestion)
      setQuestionIndex(stored.questionIndex)
      setTotalQuestions(stored.totalQuestions)
      setScore(stored.score)
      setTimeLeft(stored.timeLeft)
      setChatHistory(stored.chatHistory || [{ from: 'bot', text: `Question ${stored.questionIndex}: ${stored.currentQuestion}` }])
      return
    }

    const storedRole = location.state?.role
    const storedQuestion = location.state?.question
    if (!storedRole || !storedQuestion) {
      navigate('/dashboard')
      return
    }

    setRole(storedRole)
    setCurrentQuestion(storedQuestion)
    setQuestionIndex(1)
    setTotalQuestions(location.state?.total_questions || 0)
    setScore(0)
    setTimeLeft(TOTAL_TEST_SECONDS)
    setChatHistory([{ from: 'bot', text: `Question 1: ${storedQuestion}` }])

    persistSession({
      role: storedRole,
      currentQuestion: storedQuestion,
      questionIndex: 1,
      totalQuestions: location.state?.total_questions || 0,
      score: 0,
      chatHistory: [{ from: 'bot', text: `Question 1: ${storedQuestion}` }],
      timeLeft: TOTAL_TEST_SECONDS
    })
  }

  useEffect(() => {
    initSession()
  }, [location, navigate])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (timeLeft <= 0) {
      (async () => {
        try {
          await finishSession()
          clearSession()
          navigate('/result')
        } catch (err) {
          if (err.response?.status === 400 && err.response?.data?.error === 'No active session') {
            try {
              await getResult()
              clearSession()
              navigate('/result')
              return
            } catch {
              // continue to fallback message
            }
          }
          setBotMessage('Time is up, but we could not end session automatically. Please refresh.')
        }
      })()
    }
  }, [timeLeft, navigate])

  useEffect(() => {
    if (!role || !currentQuestion) return
    persistSession({
      role,
      currentQuestion,
      questionIndex,
      totalQuestions,
      score,
      chatHistory,
      timeLeft
    })
  }, [role, currentQuestion, questionIndex, totalQuestions, score, chatHistory, timeLeft])

  const addBotMessage = (message) => {
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setBotMessage(message)
    }, 400)
  }

  const handleSubmitTest = async () => {
    try {
      await finishSession()
      clearSession()
      navigate('/result')
    } catch (err) {
      // Handle cases where session has already been concluded server-side
      if (err.response?.status === 400 && err.response?.data?.error === 'No active session') {
        try {
          await getResult()
          clearSession()
          navigate('/result')
          return
        } catch {
          // fallback to existing message
        }
      }
      addBotMessage('Could not submit test at this moment. Please try again.')
    }
  }

  const handleSend = async () => {
    if (!answer.trim()) return

    setChatHistory(prev => [...prev, { from: 'user', text: answer }])

    try {
      const result = await sendAnswer(role, currentQuestion, answer)
      setScore(result.score)

      addBotMessage(result.feedback)
      if (result.suggested_answer) {
        addBotMessage(result.suggested_answer)
      }

      if (result.completed) {
        clearSession()
        setTimeout(() => navigate('/result'), 900)
        return
      }

      setCurrentQuestion(result.next_question)
      setQuestionIndex(prev => prev + 1)
      setTotalQuestions(result.total_questions)

      setTimeout(() => {
        addBotMessage(`Question ${questionIndex + 1}: ${result.next_question}`)
      }, 800)

      setAnswer('')
    } catch (err) {
      addBotMessage('Error while sending answer. Please refresh and try again.')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-950 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-800 p-3">
          <h2 className="text-lg font-semibold">AI Interview Chatbot</h2>
          <span className="text-sm text-slate-300">Progress: {questionIndex}/{totalQuestions}</span>
          <span className="text-sm text-sky-300">Score: {score}</span>
          <span className="text-sm text-emerald-300">Time left: {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</span>
        </div>

        <ChatBox chatHistory={chatHistory} />

        {typing && <div className="mt-2 text-sm text-slate-400">Bot is typing...</div>}

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
              disabled={timeLeft === 0}
            />
            <button
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
              onClick={handleSend}
              disabled={timeLeft === 0}
            >Send</button>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm hover:bg-emerald-500"
              onClick={handleSubmitTest}
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
