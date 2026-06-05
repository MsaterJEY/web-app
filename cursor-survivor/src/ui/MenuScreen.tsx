import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../game/store'
import { WEAPONS, WeaponType } from '../data/weapons'

const STARTER_WEAPONS: WeaponType[] = ['sword', 'spear', 'wand']

export const MenuScreen: React.FC = () => {
  const { startGame, highScore, bestStage } = useGameStore()
  const [selected, setSelected] = useState<WeaponType>('sword')
  const [hovered, setHovered] = useState<WeaponType | null>(null)

  const weapon = WEAPONS[selected]

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #0f0c2e 0%, #050510 70%)' }}>

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 1,
            height: Math.random() * 4 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: ['#7c3aed', '#a855f7', '#60a5fa', '#34d399', '#f472b6'][i % 5],
            opacity: 0.6,
          }}
          animate={{ y: [-10, 10, -10], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
        />
      ))}

      {/* Title */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: 'spring' }}
        className="text-center mb-2 z-10"
      >
        <div
          className="font-game text-3xl md:text-4xl mb-2 leading-tight"
          style={{
            background: 'linear-gradient(135deg, #fff 0%, #a855f7 50%, #60a5fa 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            textShadow: 'none',
            filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.5))',
          }}
        >
          CURSOR
        </div>
        <div
          className="font-game text-3xl md:text-4xl leading-tight"
          style={{
            background: 'linear-gradient(135deg, #f472b6 0%, #a855f7 50%, #7c3aed 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 20px rgba(244,114,182,0.5))',
          }}
        >
          SURVIVOR RPG
        </div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-purple-300 font-ui text-sm mt-3"
        >
          ใช้เมาส์เป็นอาวุธ · ฆ่าศัตรู · เลเวลอัพ
        </motion.div>
      </motion.div>

      {/* Records */}
      {(highScore > 0 || bestStage > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-6 mb-6 z-10"
        >
          <div className="text-center">
            <div className="text-yellow-400 font-ui text-xs">HIGH SCORE</div>
            <div className="text-white font-game text-sm">{highScore.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-cyan-400 font-ui text-xs">BEST STAGE</div>
            <div className="text-white font-game text-sm">{bestStage}</div>
          </div>
        </motion.div>
      )}

      {/* Weapon select */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="z-10 mb-6"
      >
        <div className="text-center text-gray-400 font-ui text-xs mb-3 uppercase tracking-widest">เลือกอาวุธ</div>
        <div className="flex gap-3">
          {STARTER_WEAPONS.map(wid => {
            const w = WEAPONS[wid]
            const isSelected = selected === wid
            const isHov = hovered === wid
            return (
              <motion.button
                key={wid}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelected(wid)}
                onHoverStart={() => setHovered(wid)}
                onHoverEnd={() => setHovered(null)}
                style={{
                  width: 90, height: 100,
                  background: isSelected
                    ? `linear-gradient(160deg, ${w.color}22, ${w.color}11)`
                    : 'rgba(255,255,255,0.03)',
                  border: `2px solid ${isSelected ? w.color : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 14,
                  cursor: 'pointer',
                  boxShadow: isSelected ? `0 0 20px ${w.color}55` : 'none',
                  transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <WeaponIcon type={wid} color={w.color} />
                <div className="text-white font-ui text-xs font-bold">{w.nameTH}</div>
                <div className="font-ui text-[9px]" style={{ color: w.color }}>DMG {w.damage}</div>
              </motion.button>
            )
          })}
        </div>

        {/* Selected weapon stats */}
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 rounded-lg text-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex gap-4 justify-center text-xs font-ui">
            <span style={{ color: weapon.color }}>⚔ DMG {weapon.damage}</span>
            <span className="text-yellow-400">⚡ SPD {weapon.attackSpeed}x</span>
            <span className="text-cyan-400">📏 {weapon.range}px</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Start button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => startGame(selected)}
        className="z-10 px-12 py-4 rounded-xl font-game text-base text-white"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          boxShadow: '0 0 30px rgba(168,85,247,0.5), 0 8px 32px rgba(0,0,0,0.5)',
          cursor: 'pointer',
        }}
      >
        START GAME
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-4 text-gray-600 font-ui text-xs z-10"
      >
        กด ESC เพื่อพัก · เคลื่อนเมาส์เพื่อโจมตี
      </motion.div>
    </div>
  )
}

const WeaponIcon: React.FC<{ type: WeaponType; color: string }> = ({ type, color }) => {
  const icons: Record<WeaponType, string> = {
    sword: '🗡️', spear: '🔱', wand: '🪄', bow: '🏹', gun: '🔫', scythe: '⚔️', hammer: '🔨', dagger: '🗡️'
  }
  return <span style={{ fontSize: 28 }}>{icons[type]}</span>
}
