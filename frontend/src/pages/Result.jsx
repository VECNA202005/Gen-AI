import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getResult } from '../services/api'

export default function Result(){
  const [result, setResult] = useState(null)
  const navigate = useNavigate()

  useEffect(()=>{
    const fetch = async () => {
      try {
        const res = await getResult()
        setResult(res)
      } catch (err) {
        navigate('/roles')
      }
    }
    fetch()
  }, [navigate])

  if (!result){
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 text-center shadow-xl">
        <h1 className="mb-4 text-2xl font-bold">Interview Result</h1>
        <p className="mb-2">Role: {result.role}</p>
        <p className="mb-2">Total Questions: {result.total_questions}</p>
        <p className="mb-2">Attempted Questions: {result.attempted}</p>
        <p className="mb-2">Final Score: {result.score}</p>
        <p className="mb-4 text-slate-300">{result.message}</p>
        <button
          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500"
          onClick={()=>navigate('/dashboard')}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
