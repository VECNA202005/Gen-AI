import { useEffect, useState } from 'react'
import { motion, useSpring } from 'framer-motion'

export default function MouseBackground() {
  const [mousePosition, setMousePosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 })

  // Use spring physics for a smooth lagging effect
  const springConfig = { damping: 25, stiffness: 120 }
  const x = useSpring(mousePosition.x, springConfig)
  const y = useSpring(mousePosition.y, springConfig)

  useEffect(() => {
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    // Set initial position
    x.set(window.innerWidth / 2)
    y.set(window.innerHeight / 2)

    window.addEventListener('mousemove', updateMousePosition)
    return () => {
      window.removeEventListener('mousemove', updateMousePosition)
    }
  }, [x, y])

  useEffect(() => {
    x.set(mousePosition.x)
    y.set(mousePosition.y)
  }, [mousePosition, x, y])

  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,#1e1b4b,transparent_80%)]" />
      <motion.div
        className="absolute -inset-[50vh] opacity-40 blur-[100px]"
        style={{
          x,
          y,
          background: 'radial-gradient(circle at center, rgba(56, 189, 248, 0.4) 0%, rgba(139, 92, 246, 0.3) 25%, transparent 50%)',
          width: '100vw',
          height: '100vh',
          transform: 'translate(-50%, -50%)'
        }}
      />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
    </div>
  )
}
