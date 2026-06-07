import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../game/store'
import { ElementType, ELEMENT_COLORS, ELEMENT_NAMES_TH } from '../data/skills'
import { soundManager } from '../game/SoundManager'

const ELEMENTS: { id: ElementType; icon: string; desc: string }[] = [
  { id: 'fire',      icon: '🔥', desc: 'เผาไหม้ต่อเนื่อง' },
  { id: 'water',     icon: '❄️', desc: 'ชะลอความเร็วศัตรู' },
  { id: 'lightning', icon: '⚡', desc: 'มึนงงชั่วคราว' },
  { id: 'poison',    icon: '☠️', desc: 'พิษดาเมจต่อเนื่อง' },
  { id: 'wind',      icon: '🌪️', desc: 'ดันศัตรูออก' },
  { id: 'dark',      icon: '🌑', desc: 'สาปลดดาเมจ' },
  { id: 'light',     icon: '🌟', desc: 'รักษา HP เมื่อฆ่า' },
  { id: 'earth',     icon: '🪨', desc: 'ทำลายเกราะ' },
]

export const ElementPickScreen: React.FC = () => {
  const { phase, pickElement } = useGameStore()
  const [hovered, setHovered] = useState<ElementType | null>(null)

  if (phase !== 'element_pick') return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, #1a0030 0%, #050510 70%)' }}
      >
        {/* Animated bg */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: '#a855f7',
                opacity: 0.4,
              }}
              animate={{ y: [-15, 15, -15], opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
            />
          ))}
        </div>

        {/* Header */}
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="text-center mb-2 z-10"
        >
          <div className="text-4xl mb-3">🪄</div>
          <div
            className="font-game text-xl mb-2"
            style={{
              background: 'linear-gradient(135deg, #e879f9, #a855f7, #60a5fa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 16px rgba(168,85,247,0.6))',
            }}
          >
            เลือกธาตุคทา
          </div>
          <div className="text-purple-300 font-ui text-sm">คทาจะถูกผสานกับธาตุที่เลือกตลอดเกม</div>
        </motion.div>

        {/* Element grid */}
        <div className="grid grid-cols-4 gap-3 px-6 mt-6 z-10 max-w-xl w-full">
          {ELEMENTS.map((el, i) => {
            const col = ELEMENT_COLORS[el.id]
            const isHov = hovered === el.id
            return (
              <motion.button
                key={el.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.06, type: 'spring', stiffness: 200 }}
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  soundManager.skillSelect()
                  pickElement(el.id)
                }}
                onHoverStart={() => { setHovered(el.id); soundManager.hover() }}
                onHoverEnd={() => setHovered(null)}
                style={{
                  background: isHov
                    ? `linear-gradient(160deg, ${col}33, ${col}18)`
                    : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${isHov ? col : col + '44'}`,
                  borderRadius: 14,
                  padding: '14px 8px',
                  cursor: 'pointer',
                  boxShadow: isHov ? `0 0 24px ${col}55, 0 0 8px ${col}33` : 'none',
                  transition: 'all 0.18s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}
              >
                <span style={{ fontSize: 28 }}>{el.icon}</span>
                <div className="font-ui font-bold text-xs" style={{ color: isHov ? col : '#e5e7eb' }}>
                  {ELEMENT_NAMES_TH[el.id]}
                </div>
                <div className="font-ui text-[9px] text-center leading-tight" style={{ color: col + 'cc' }}>
                  {el.desc}
                </div>
              </motion.button>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 text-gray-600 font-ui text-xs z-10"
        >
          ธาตุ Lv.1 จะถูกใส่ให้ทันที · อัพเกรดได้ผ่าน Skill Cards
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
