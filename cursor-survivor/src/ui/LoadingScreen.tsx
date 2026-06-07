import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../game/store'

const TIPS = [
  'เคลื่อนเมาส์เพื่อโจมตีศัตรูในระยะ',
  'ดาบ — ฟันเป็นวงรอบตัว ดีกับศัตรูหลายตัว',
  'หอก — แทงเป็นเส้นตรง ระยะไกล ดาเมจสูง',
  'คทา — ยิงกระสุนธาตุ ดีกับบอส',
  'Elite Slime — สีชมพู หายาก แต่ XP สูง!',
  'บอสมีธาตุของตัวเอง ระวังกระสุน!',
  'หลีกเลี่ยงกระสุนบอสได้ด้วยการเคลื่อนเมาส์',
  'กด ESC เพื่อ Pause ได้ทุกเวลา',
  'XP จะแจกหลังจบ Stage — เก็บให้หมดก่อน!',
]

export const LoadingScreen: React.FC = () => {
  const { phase, setPhase } = useGameStore()
  const [progress, setProgress] = useState(0)
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)])

  useEffect(() => {
    if (phase !== 'loading') return
    setProgress(0)
    const start = Date.now()
    const duration = 2200
    const interval = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / duration) * 100)
      setProgress(p)
      if (p >= 100) {
        clearInterval(interval)
        setTimeout(() => setPhase('playing'), 150)
      }
    }, 30)
    return () => clearInterval(interval)
  }, [phase])

  if (phase !== 'loading') return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 50% 45%, #0d0a2e 0%, #050510 70%)' }}
    >
      {/* Spinning logo */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        className="text-6xl mb-6"
      >
        ⚔️
      </motion.div>

      <div className="font-game text-white text-lg mb-1" style={{ textShadow: '0 0 20px rgba(168,85,247,0.8)' }}>
        CURSOR SURVIVOR
      </div>
      <div className="font-ui text-purple-400 text-xs mb-8 tracking-widest">RPG</div>

      {/* Progress bar */}
      <div className="w-64 h-2 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #7c3aed, #a855f7, #e879f9)',
            boxShadow: '0 0 8px #a855f7',
            transition: 'width 0.03s linear',
          }}
        />
      </div>

      <div className="font-ui text-purple-300 text-xs mb-6">{Math.floor(progress)}%</div>

      {/* Tip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-xs text-center px-6 py-3 rounded-xl font-ui text-sm"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#aaa' }}
      >
        <span className="text-purple-300">💡 Tip: </span>{tip}
      </motion.div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(18)].map((_, i) => (
          <motion.div key={i} className="absolute rounded-full"
            style={{ width: 3, height: 3, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              background: ['#7c3aed','#a855f7','#e879f9','#60a5fa'][i % 4], opacity: 0.5 }}
            animate={{ y: [-20, 20, -20], opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}
      </div>
    </motion.div>
  )
}
