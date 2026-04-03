import { motion, AnimatePresence } from 'framer-motion'

export default function ProctorModal({ 
  isOpen, 
  onConfirm, 
  strikeCount = 1, 
  variant = "CAUTION" 
}) {
  const isMalpractice = variant === "MALPRACTICE" || strikeCount >= 3

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`w-full max-w-md rounded-[2.5rem] border p-10 text-center shadow-2xl backdrop-blur-3xl relative overflow-hidden transition-colors ${
              isMalpractice ? 'border-rose-500 bg-rose-500/10 shadow-rose-500/20' : 'border-amber-500/30 bg-slate-900/60 shadow-amber-500/10'
            }`}
          >
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${isMalpractice ? 'via-rose-500' : 'via-amber-500'} to-transparent`} />
            
            <div className={`mx-auto mb-8 h-24 w-24 rounded-3xl border flex items-center justify-center text-5xl shadow-inner transition-colors ${
              isMalpractice ? 'bg-rose-500/20 border-rose-500/40 text-rose-500 animate-bounce' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
            }`}>
               {isMalpractice ? '🚫' : '⚠️'}
            </div>

            <h2 className="text-3xl font-black text-white italic tracking-tighter mb-4 uppercase">
              {isMalpractice ? 'MALPRACTICE DETECTED' : `PROCTORING CAUTION (${strikeCount}/2)`}
            </h2>
            
            <p className="text-sm text-slate-300 font-bold leading-relaxed mb-10 px-4">
              {isMalpractice 
                ? "Multiple tab switches detected. Integrity protocol breached. This session will be terminated and submitted as 0% score."
                : "Stability Warning: Do not leave the active window. This event has been logged. Two more strikes will result in immediate disqualification."
              }
            </p>

            <button
              onClick={onConfirm}
              className={`w-full rounded-2xl py-4 font-black uppercase tracking-widest text-xs transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] ${
                isMalpractice 
                ? 'bg-rose-500 text-white hover:bg-rose-600' 
                : 'bg-white text-black hover:bg-amber-500 hover:text-white'
              }`}
            >
              {isMalpractice ? 'EXECUTE TERMINATION' : 'I ACKNOWLEDGE & CONTINUE'}
            </button>

            <div className="mt-8 text-[8px] font-black uppercase tracking-[0.3em] opacity-40">
               {isMalpractice ? 'Integrity System Failure' : 'Active Satellite Monitoring'}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
