import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../game/store'

export const PauseOverlay: React.FC = () => {
  const { phase, setPhase, resetGame, score, stage, level, killCount } = useGameStore()

  if (phase !== 'paused') return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
          style={{
            background: 'linear-gradient(160deg, #1a1a2e, #0f3460)',
            border: '2px solid rgba(255,255,255,0.15)',
            borderRadius: 20,
            padding: '40px 48px',
            minWidth: 320,
          }}
        >
          <div className="text-white font-game text-xl mb-6" style={{ textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>
            PAUSED
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8 text-sm font-ui">
            <StatRow label="Stage" value={stage} color="#ffd700" />
            <StatRow label="Level" value={level} color="#a855f7" />
            <StatRow label="Score" value={score.toLocaleString()} color="#22c55e" />
            <StatRow label="Kills" value={killCount} color="#ef4444" />
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setPhase('playing')}
              className="px-8 py-3 rounded-lg font-ui font-bold text-sm transition-all hover:scale-105"
              style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7)', color: 'white', boxShadow: '0 0 20px rgba(168,85,247,0.4)' }}
            >
              ▶ เล่นต่อ
            </button>
            <button
              onClick={resetGame}
              className="px-8 py-3 rounded-lg font-ui font-bold text-sm transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#aaa', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              ↩ เมนูหลัก
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const StatRow: React.FC<{ label: string; value: string | number; color: string }> = ({ label, value, color }) => (
  <div className="text-center p-2 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
    <div className="text-gray-400 text-xs">{label}</div>
    <div className="font-bold" style={{ color }}>{value}</div>
  </div>
)
