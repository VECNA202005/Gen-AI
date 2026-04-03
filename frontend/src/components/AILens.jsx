import { useRef, useEffect, useState } from 'react'
import Webcam from 'react-webcam'
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import * as blazeface from '@tensorflow-models/blazeface'
import { motion, AnimatePresence } from 'framer-motion'
import { logInfraction } from '../services/api'

export default function AILens({ compact = false }) {
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)
  const [models, setModels] = useState({ coco: null, face: null })
  const [status, setStatus] = useState('Initializing AI...')
  const [alerts, setAlerts] = useState([])
  const [isCollapsed, setIsCollapsed] = useState(true)
  const lastLogTime = useRef({})

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await tf.ready()
        const [coco, face] = await Promise.all([
          cocoSsd.load(),
          blazeface.load()
        ])
        setModels({ coco, face })
        setStatus('AI ACTIVE')
      } catch (err) {
        console.error("Model load error:", err)
        setStatus('AI OFFLINE')
      }
    }
    loadModels()
  }, [])

  const addAlert = (msg, type) => {
    setAlerts(prev => {
      if (prev.find(a => a.msg === msg)) return prev
      return [...prev, { msg, type, id: Date.now() }]
    })
    
    const now = Date.now()
    if (!lastLogTime.current[type] || now - lastLogTime.current[type] > 10000) {
      logInfraction(type).catch(() => {})
      lastLogTime.current[type] = now
    }
  }

  const removeAlert = (msg) => {
    setAlerts(prev => prev.filter(a => a.msg !== msg))
  }

  const runDetection = async () => {
    if (
      models.coco && models.face &&
      webcamRef.current &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video
      const { videoWidth, videoHeight } = video
      if (canvasRef.current) {
        canvasRef.current.width = videoWidth
        canvasRef.current.height = videoHeight
      }

      const [objects, faces] = await Promise.all([
        models.coco.detect(video),
        models.face.estimateFaces(video, false)
      ])
      
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, videoWidth, videoHeight)
        let personInFrame = false
        let phoneDetected = false

        objects.forEach(obj => {
          if (obj.score > 0.6) {
            if (obj.class === 'person') personInFrame = true
            if (obj.class === 'cell phone') phoneDetected = true
            if (obj.class === 'cell phone') {
               ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4; ctx.strokeRect(...obj.bbox)
            }
          }
        })

        const faceDetected = faces.length > 0
        if (!personInFrame) addAlert("Candidate missing", "NO_PERSON")
        else { removeAlert("Candidate missing"); if (!faceDetected) addAlert("Face hidden", "FACE_COVERED"); else removeAlert("Face hidden") }
        if (phoneDetected) addAlert("Electronic device", "MOBILE_USAGE"); else removeAlert("Electronic device")
        
        if (faceDetected) {
          const face = faces[0]; const centerX = (face.topLeft[0] + face.bottomRight[0]) / 2; const relativeX = centerX / videoWidth
          if (relativeX < 0.2 || relativeX > 0.8) addAlert("Eyes away", "LOOKING_AWAY"); else removeAlert("Eyes away")
        }
      }
    }
  }

  useEffect(() => {
    const interval = setInterval(() => runDetection(), 800)
    return () => clearInterval(interval)
  }, [models])

  return (
    <div className={`relative flex flex-col items-center transition-all ${compact ? 'scale-90' : ''}`}>
      <motion.div 
        animate={{ height: isCollapsed ? '44px' : '150px', width: isCollapsed ? '120px' : '180px' }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/60 shadow-xl backdrop-blur-3xl group"
      >
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-2 right-2 z-50 h-5 w-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-cyan-500/20 transition-colors opacity-0 group-hover:opacity-100"
        >
          <span className="text-white text-[10px] font-black">{isCollapsed ? '□' : '—'}</span>
        </button>

        {/* Webcam and Canvas are ALWAYS mounted to keep background detection running */}
        <div className={`w-full relative transition-opacity duration-500 ${isCollapsed ? 'h-0 opacity-0' : 'h-[calc(100%-34px)] opacity-100'}`}>
            <Webcam
                ref={webcamRef}
                muted={true}
                className="h-full w-full object-cover opacity-80 rounded-t-2xl"
                videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
            />
            <canvas ref={canvasRef} className="absolute inset-0 z-10 h-full w-full object-cover" />
        </div>

        <div className={`p-2 flex items-center justify-center gap-2 ${isCollapsed ? 'h-full' : 'h-[34px] border-t border-white/5'}`}>
            <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${status === 'AI ACTIVE' ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`} />
            <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em]">{isCollapsed ? 'AI LENS' : status}</span>
        </div>
      </motion.div>

      {/* Floating Alerts inside the nav area */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-full mt-2 w-48 z-[110]"
          >
             {alerts.slice(0, 1).map((alertItem) => (
                 <div key={alertItem.id} className="rounded-xl border border-rose-500/30 bg-rose-500/20 p-2 text-center text-[8px] font-black uppercase tracking-widest text-rose-300 shadow-2xl backdrop-blur-md">
                    ⚠️ {alertItem.msg}
                 </div>
             ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
