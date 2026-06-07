import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../game/store'
import { drawSkillCards } from '../player/SkillSystem'
import { SkillCard } from '../data/skills'
import { getRarityColor, getRarityGlow } from '../player/SkillSystem'
import { soundManager } from '../game/SoundManager'

export const SkillCards: React.FC = () => {
  const { phase, level, acquiredSkills, applySkill } = useGameStore()
  const [cards, setCards] = useState<SkillCard[]>([])
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    if (phase === 'levelup') {
      const excluded = acquiredSkills.map(s => s.id)
      setCards(drawSkillCards(3, excluded))
      soundManager.levelUp()
    }
  }, [phase])

  if (phase !== 'levelup') return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      >
        {/* Header */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="text-yellow-400 font-game text-lg mb-1" style={{ textShadow: '0 0 20px #ffd700' }}>
            LEVEL UP!
          </div>
          <div className="text-purple-300 font-ui text-sm">Level {level} — เลือกสกิล 1 ใบ</div>
        </motion.div>

        {/* Cards */}
        <div className="flex gap-4 flex-wrap justify-center px-4">
          {cards.map((card, i) => {
            const rc = getRarityColor(card.rarity)
            const rg = getRarityGlow(card.rarity)
            const isHov = hovered === card.id

            return (
              <motion.div
                key={card.id}
                initial={{ y: 60, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 200 }}
                whileHover={{ scale: 1.05, y: -8 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { soundManager.skillSelect(); applySkill(card) }}
                onHoverStart={() => setHovered(card.id)}
                onHoverEnd={() => setHovered(null)}
                className="cursor-pointer relative"
                style={{
                  width: 200,
                  background: 'linear-gradient(160deg, #1a1a2e, #16213e)',
                  border: `2px solid ${rc}`,
                  borderRadius: 16,
                  padding: '20px 16px',
                  boxShadow: isHov ? `0 0 30px ${rg}, 0 0 60px ${rg}` : `0 0 12px ${rg}`,
                  transition: 'box-shadow 0.2s',
                }}
              >
                {/* Rarity badge */}
                <div
                  className="absolute top-2 right-2 text-[9px] font-ui px-2 py-0.5 rounded-full uppercase font-bold"
                  style={{ background: `${rc}22`, color: rc, border: `1px solid ${rc}44` }}
                >
                  {card.rarity}
                </div>

                {/* Icon */}
                <div className="text-4xl mb-3 text-center">{card.icon}</div>

                {/* Name */}
                <div className="text-white font-ui font-bold text-sm text-center mb-1">{card.nameTH}</div>
                <div className="text-gray-400 font-ui text-[10px] text-center mb-3">{card.name}</div>

                {/* Category badge */}
                <div className="text-center mb-3">
                  <span
                    className="text-[9px] font-ui px-2 py-0.5 rounded"
                    style={{
                      background: card.category === 'element' ? '#ff450022' : card.category === 'attack' ? '#2196f322' : '#4caf5022',
                      color: card.category === 'element' ? '#ff6b35' : card.category === 'attack' ? '#42a5f5' : '#66bb6a',
                    }}
                  >
                    {card.category === 'element' ? '⚡ ธาตุ' : card.category === 'attack' ? '⚔️ โจมตี' : '🛡️ ป้องกัน'}
                  </span>
                </div>

                {/* Description */}
                <div className="text-gray-300 text-[11px] font-ui text-center leading-relaxed">
                  {card.descriptionTH}
                </div>

                {/* Click hint */}
                <motion.div
                  animate={{ opacity: isHov ? 1 : 0 }}
                  className="absolute bottom-3 left-0 right-0 text-center text-[10px] font-ui"
                  style={{ color: rc }}
                >
                  คลิกเพื่อเลือก
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        {/* Acquired skills */}
        {acquiredSkills.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex gap-2 flex-wrap justify-center max-w-xl px-4"
          >
            <span className="text-gray-500 text-xs font-ui w-full text-center mb-1">สกิลที่มีอยู่:</span>
            {acquiredSkills.map(s => (
              <span key={s.id} className="text-xs font-ui px-2 py-1 rounded" style={{ background: '#ffffff11', color: '#aaa' }}>
                {s.icon} {s.nameTH}
              </span>
            ))}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
