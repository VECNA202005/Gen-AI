import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { getProfileResults, uploadProfilePhoto } from '../services/api'
import PageWrapper from '../components/PageWrapper'

const API_BASE = 'http://localhost:5000'

export default function Profile() {
  const [results, setResults] = useState([])
  const [user, setUser] = useState(null)
  
  // Photo states
  const [imgSrc, setImgSrc] = useState('')
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState()
  const [showCropper, setShowCropper] = useState(false)
  const isUploading = useRef(false)
  const imgRef = useRef(null)
  const fileInputRef = useRef(null)

  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    const profile = JSON.parse(localStorage.getItem('user') || 'null')
    setUser(profile)

    async function fetchResults() {
      const res = await getProfileResults()
      setResults(res.results || [])
    }
    fetchResults().catch(() => {})
  }, [navigate])

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '')
        setShowCropper(true)
      })
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget
    const crop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1 / 1, width, height),
      width,
      height
    )
    setCrop(crop)
  }

  const getCroppedImg = async (image, crop) => {
    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    canvas.width = crop.width
    canvas.height = crop.height
    const ctx = canvas.getContext('2d')

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return
        resolve(blob)
      }, 'image/jpeg', 1)
    })
  }

  const handleUpload = async () => {
    if (!imgRef.current || !completedCrop || isUploading.current) return
    isUploading.current = true
    
    try {
      const blob = await getCroppedImg(imgRef.current, completedCrop)
      const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('photo', file)

      const res = await uploadProfilePhoto(formData)
      if (res.photo_url) {
        const updatedUser = { ...user, profile_photo: res.photo_url }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        setShowCropper(false)
        setImgSrc('')
      }
    } catch (err) {
      console.error("Upload error", err)
    } finally {
      isUploading.current = false
    }
  }

  const bestScore = results.reduce((max, r) => Math.max(max, +r.score), 0)
  const lastActive = results.length > 0 ? new Date(results[0].created_at).toLocaleDateString() : 'N/A'

  return (
    <PageWrapper className="p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-6">
        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl pointer-events-none select-none">
             👤
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="group relative h-40 w-40">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-white/10 text-6xl shadow-inner overflow-hidden">
                {user?.profile_photo ? (
                  <img src={`${API_BASE}${user.profile_photo}`} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  '👤'
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-all text-xs font-black uppercase tracking-widest text-white backdrop-blur-sm"
              >
                Change Photo
              </button>
            </div>
            
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onSelectFile} />
            
            <div className="text-center md:text-left flex-1">
              <h2 className="text-3xl font-black text-white">{user?.name}</h2>
              <p className="text-cyan-400 font-medium tracking-wide">{user?.email}</p>
              
              <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4">
                <div className="rounded-xl bg-black/20 border border-white/5 px-4 py-2 text-center min-w-[80px]">
                  <p className="text-[10px] text-slate-500 uppercase font-black">Interviews</p>
                  <p className="text-xl font-bold text-white">{results.filter(r => r.type === 'INTERVIEW').length}</p>
                </div>
                <div className="rounded-xl bg-black/20 border border-white/5 px-4 py-2 text-center min-w-[80px]">
                  <p className="text-[10px] text-slate-500 uppercase font-black">PB Score</p>
                  <p className="text-xl font-bold text-emerald-400">{bestScore}</p>
                </div>
                <div className="rounded-xl bg-black/20 border border-white/5 px-4 py-2 text-center min-w-[80px]">
                  <p className="text-[10px] text-slate-500 uppercase font-black">Last Active</p>
                  <p className="text-xl font-bold text-purple-400">{lastActive}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* History Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl"
        >
          <h2 className="mb-6 text-xl font-bold flex items-center gap-2">
            <span className="text-purple-400">📜</span> Recent Assessment Activity
          </h2>
          {results.length === 0 ? (
            <div className="py-20 text-center">
               <p className="text-slate-500 italic">No historical data available yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-slate-500">
                    <th className="pb-4 font-bold">Type</th>
                    <th className="pb-4 font-bold">Details</th>
                    <th className="pb-4 font-bold">Date</th>
                    <th className="pb-4 font-bold">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {results.slice(0, 10).map((item, idx) => (
                    <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-4">
                         <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest ${item.type === 'INTERVIEW' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-purple-500/10 text-purple-400'}`}>
                            {item.type}
                         </span>
                      </td>
                      <td className="py-4 font-bold text-slate-100 text-sm">{(item.role || '').replace(/_/g, ' ')}</td>
                      <td className="py-4 text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="py-4 font-mono font-bold text-emerald-400 text-sm">{item.score}/{item.total_questions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Crop Modal */}
        <AnimatePresence>
          {showCropper && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-3xl text-center"
               >
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-6">Crop Your Photo</h3>
                  
                  <div className="max-h-[50vh] overflow-hidden flex justify-center bg-black/40 rounded-2xl mb-8 p-4">
                     <ReactCrop
                       crop={crop}
                       onChange={(c) => setCrop(c)}
                       onComplete={(c) => setCompletedCrop(c)}
                       aspect={1}
                       circularCrop
                     >
                       <img 
                        src={imgSrc} 
                        alt="Crop me" 
                        ref={imgRef} 
                        onLoad={onImageLoad} 
                        className="max-w-full"
                       />
                     </ReactCrop>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowCropper(false)}
                      className="flex-1 px-8 py-4 rounded-2xl border border-white/10 font-bold text-slate-400 hover:bg-white/5 transition-all text-sm uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleUpload}
                      className="flex-1 px-8 py-4 rounded-2xl bg-cyan-600 font-bold text-white shadow-lg shadow-cyan-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm uppercase tracking-widest"
                    >
                      Save Photo
                    </button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  )
}
