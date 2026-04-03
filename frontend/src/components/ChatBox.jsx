import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChatBox({ chatHistory }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  return (
    <div className="chat-window mb-4 flex h-[60vh] sm:h-[65vh] flex-col gap-4 overflow-y-auto rounded-2xl border border-white/10 bg-black/40 p-4 shadow-inner">
      <AnimatePresence>
        {chatHistory.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            key={i}
            className={`flex w-full ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 shadow-xl ${
                msg.from === 'user'
                  ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-br-sm'
                  : 'bg-white/10 border border-white/20 text-slate-100 backdrop-blur-md rounded-bl-sm'
              }`}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={endRef} />
    </div>
  )
}
