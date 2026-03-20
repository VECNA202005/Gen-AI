import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getResultById } from '../services/api'

export default function Report() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetch() {
      try {
        const res = await getResultById(id)
        setReport(res)
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to load report.')
      }
    }
    fetch()
  }, [id])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-white">
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')} className="mt-4 rounded-lg bg-blue-600 px-4 py-2">Back to Dashboard</button>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <p>Loading report...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen justify-center bg-slate-950 p-4">
      <div className="w-full max-w-5xl space-y-4">
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Report for {report.role}</h2>
            <button onClick={() => navigate('/dashboard')} className="rounded-lg bg-blue-600 px-3 py-1">Back</button>
          </div>
          <p className="text-slate-400">Date: {report.created_at}</p>
          <p className="text-slate-400">Score: {report.score}/{report.total_questions}</p>
          <p className="text-slate-400">Attempted: {report.attempted}</p>
          <p className="text-slate-400">Final note: {report.message}</p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-white">
          <h3 className="text-xl font-semibold mb-3">Detailed Q&A</h3>
          <div className="space-y-3">
            {report.details.map((d, idx) => (
              <div key={idx} className="rounded-lg border border-slate-700 p-3">
                <p className="font-semibold">Q{idx + 1}: {d.question}</p>
                <p className="text-sm text-slate-300">Your answer: {d.answer}</p>
                <p className="text-xs text-slate-400">Matched: {d.matched_keywords.join(', ') || 'none'}</p>
                <p className="text-xs text-slate-400">Score: {d.score}</p>
                <p className="text-xs text-slate-300">Feedback: {d.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
