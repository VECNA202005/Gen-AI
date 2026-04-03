import { motion, AnimatePresence } from 'framer-motion'

export default function ConfirmModal({ 
  isOpen, 
  title = "CONFIRM SUBMISSION", 
  message = "Submit your current work for final AI scoring? Hidden test cases will be validated row by row.", 
  onConfirm, 
  onCancel,
  confirmText = "SUBMIT",
  cancelText = "CANCEL"
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md rounded-[2.5rem] border border-cyan-500/30 bg-slate-900/60 p-10 text-center shadow-2xl shadow-cyan-500/10 backdrop-blur-3xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
            
            <div className="mx-auto mb-8 h-24 w-24 rounded-3xl border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center text-5xl shadow-inner text-cyan-500">
               ❓
            </div>

            <h2 className="text-3xl font-black text-white italic tracking-tighter mb-4 uppercase">
              {title}
            </h2>
            
            <p className="text-sm text-slate-300 font-bold leading-relaxed mb-10 px-4">
              {message}
            </p>

            <div className="flex gap-4">
                {onCancel && (
                  <button
                  onClick={onCancel}
                  className="w-full rounded-2xl py-4 font-black uppercase tracking-widest text-xs transition-all shadow-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]"
                  >
                  {cancelText}
                  </button>
                )}
                <button
                onClick={onConfirm}
                className="w-full rounded-2xl py-4 font-black uppercase tracking-widest text-xs transition-all shadow-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:from-emerald-400 hover:to-cyan-400 hover:scale-[1.02] active:scale-[0.98]"
                >
                {confirmText}
                </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
