import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../game/store'
import { soundManager } from '../game/SoundManager'

export const GameOverScreen: React.FC = () => {
  const { phase, score, stage, level, killCount, highScore, bestStage, acquiredSkills, resetGame, startGame, selectedWeapon } = useGameStore()

  useEffect(() => {
    if (phase === 'gameover') soundManager.gameOver()
  }, [phase])

  if (phase !== 'gameover') return null

  const isNewRecord = score >= highScore

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)' }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="text-center max-w-md w-full px-6"
        style={{
          background: 'linear-gradient(160deg, #1a0020, #0a0015)',
          border: '2px solid rgba(239,68,68,0.4)',
          borderRadius: 20,
          padding: '36px 40px',
          boxShadow: '0 0 40px rgba(239,68,68,0.2)',
        }}
      >
        {/* Title */}
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="font-game text-2xl text-red-500 mb-2"
          style={{ textShadow: '0 0 20px #ef4444' }}
        >
          GAME OVER
        </motion.div>

        {isNewRecord && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-yellow-400 font-ui text-sm mb-4"
          >
            🏆 สถิติใหม่!
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6 mt-4">
          {[
            { label: 'Stage', value: stage, color: '#ffd700' },
            { label: 'Level', value: level, color: '#a855f7' },
            { label: 'Score', value: score.toLocaleString(), color: '#22c55e' },
            { label: 'Kills', value: killCount, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="text-gray-400 text-xs font-ui">{s.label}</div>
              <div className="font-bold text-base font-ui" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Best records */}
        <div className="flex gap-4 justify-center mb-5 text-xs font-ui">
          <span className="text-gray-500">Best Score: <span className="text-yellow-400">{highScore.toLocaleString()}</span></span>
          <span className="text-gray-500">Best Stage: <span className="text-cyan-400">{bestStage}</span></span>
        </div>

        {/* Acquired skills */}
        {acquiredSkills.length > 0 && (
          <div className="mb-5">
            <div className="text-gray-500 text-xs font-ui mb-2">สกิลที่ได้รับ:</div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {acquiredSkills.map(s => (
                <span key={s.id} className="text-xs font-ui px-2 py-1 rounded" style={{ background: '#ffffff0d', color: '#aaa' }}>
                  {s.icon} {s.nameTH}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => startGame(selectedWeapon)}
            className="px-8 py-3 rounded-xl font-ui font-bold text-sm text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(90deg, #dc2626, #ef4444)', boxShadow: '0 0 20px rgba(239,68,68,0.3)' }}
          >
            🔄 เล่นใหม่
          </button>
          <button
            onClick={resetGame}
            className="px-8 py-3 rounded-xl font-ui font-bold text-sm transition-all hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#888', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            ↩ เมนูหลัก
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
