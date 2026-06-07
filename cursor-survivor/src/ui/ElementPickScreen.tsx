import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../game/store'
import { ElementType, ELEMENT_COLORS, ELEMENT_NAMES_TH } from '../data/skills'
import { soundManager } from '../game/SoundManager'

const ALL_ELEMENTS: { id: ElementType; icon: string; desc: string }[] = [
  { id: 'fire',      icon: '🔥', desc: 'เผาไหม้ต่อเนื่อง' },
  { id: 'water',     icon: '❄️', desc: 'ชะลอความเร็วศัตรู' },
  { id: 'lightning', icon: '⚡', desc: 'มึนงงชั่วคราว' },
  { id: 'poison',    icon: '☠️', desc: 'พิษดาเมจต่อเนื่อง' },
  { id: 'wind',      icon: '🌪️', desc: 'ดันศัตรูออก' },
  { id: 'dark',      icon: '🌑', desc: 'สาปลดดาเมจ' },
  { id: 'light',     icon: '🌟', desc: 'รักษา HP เมื่อฆ่า' },
  { id: 'earth',     icon: '🪨', desc: 'ทำลายเกราะ' },
]

function pickRandom3(): typeof ALL_ELEMENTS {
  const shuffled = [...ALL_ELEMENTS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

export const ElementPickScreen: React.FC = () => {
  const { phase, pickElement } = useGameStore()
  const [hovered, setHovered] = useState<ElementType | null>(null)
  // random ครั้งแรกที่ render และไม่เปลี่ยนจนกว่าจะเลือก
  const elements = useMemo(() => pickRandom3(), [])

  if (phase !== 'element_pick') return null

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, #1a0030 0%, #050510 70%)' }}>

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <motion.div key={i} className="absolute rounded-full"
              style={{ width: Math.random() * 3 + 1, height: Math.random() * 3 + 1, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, background: '#a855f7', opacity: 0.4 }}
              animate={{ y: [-15, 15, -15], opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }} />
          ))}
        </div>

        <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, type: 'spring' }} className="text-center mb-3 z-10">
          <div className="text-4xl mb-3">🪄</div>
          <div className="font-game text-xl mb-2"
            style={{ background: 'linear-gradient(135deg, #e879f9, #a855f7, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 16px rgba(168,85,247,0.6))' }}>
            เลือกธาตุคทา
          </div>
          <div className="text-purple-300 font-ui text-sm">3 ธาตุที่ถูก Random มาให้ — เลือก 1</div>
        </motion.div>

        <div className="flex gap-5 px-6 mt-4 z-10">
          {elements.map((el, i) => {
            const col = ELEMENT_COLORS[el.id]
            const isHov = hovered === el.id
            return (
              <motion.button key={el.id}
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 200 }}
                whileHover={{ scale: 1.08, y: -6 }} whileTap={{ scale: 0.94 }}
                onClick={() => { soundManager.skillSelect(); pickElement(el.id) }}
                onHoverStart={() => { setHovered(el.id); soundManager.hover() }}
                onHoverEnd={() => setHovered(null)}
                style={{ width: 140, background: isHov ? `linear-gradient(160deg, ${col}33, ${col}18)` : 'rgba(255,255,255,0.04)', border: `2px solid ${isHov ? col : col + '44'}`, borderRadius: 18, padding: '20px 12px', cursor: 'pointer', boxShadow: isHov ? `0 0 32px ${col}55, 0 0 8px ${col}33` : 'none', transition: 'all 0.18s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 40 }}>{el.icon}</span>
                <div className="font-ui font-bold text-sm" style={{ color: isHov ? col : '#e5e7eb' }}>{ELEMENT_NAMES_TH[el.id]}</div>
                <div className="font-ui text-[10px] text-center leading-relaxed" style={{ color: col + 'cc' }}>{el.desc}</div>
                {isHov && <div className="font-ui text-[9px]" style={{ color: col }}>คลิกเพื่อเลือก</div>}
              </motion.button>
            )
          })}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="mt-6 text-gray-600 font-ui text-xs z-10">
          🎲 Random ใหม่ทุกครั้งที่เริ่มเกม
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
