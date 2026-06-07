import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../game/store'
import { WEAPONS, WeaponType } from '../data/weapons'
import { soundManager } from '../game/SoundManager'

const STARTER_WEAPONS: WeaponType[] = ['sword', 'spear', 'wand']

export const MenuScreen: React.FC = () => {
  const { startGame, highScore, bestStage, setDevMode, devMode } = useGameStore()
  const [selected, setSelected] = useState<WeaponType>('sword')
  const [muted, setMuted] = useState(false)
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [consoleInput, setConsoleInput] = useState('')
  const [consoleMsg, setConsoleMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const weapon = WEAPONS[selected]

  const toggleMute = () => { const next = !muted; setMuted(next); soundManager.setEnabled(!next); if (!next) soundManager.click() }

  const handleConsoleSubmit = () => {
    const cmd = consoleInput.trim()
    if (cmd === '/devModeOn') {
      setDevMode(true)
      setConsoleMsg('✅ Dev Mode ON!')
      soundManager.levelUp()
    } else if (cmd === '/devModeOff') {
      setDevMode(false)
      setConsoleMsg('❌ Dev Mode OFF')
    } else {
      setConsoleMsg('❌ คำสั่งไม่ถูกต้อง')
    }
    setConsoleInput('')
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #0f0c2e 0%, #050510 70%)' }}>

      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />
      {[...Array(20)].map((_, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ width: Math.random() * 4 + 1, height: Math.random() * 4 + 1,
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            background: ['#7c3aed','#a855f7','#60a5fa','#34d399','#f472b6'][i % 5], opacity: 0.6 }}
          animate={{ y: [-10, 10, -10], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }} />
      ))}

      {/* Top right controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        {devMode && <div className="px-2 py-1 rounded font-ui text-xs font-bold" style={{ background: 'rgba(124,58,237,0.4)', color: '#a78bfa', border: '1px solid #7c3aed' }}>🛠️ DEV</div>}
        <button onClick={toggleMute}
          className="w-9 h-9 rounded-full flex items-center justify-center text-base transition-all hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}>
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Title */}
      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, type: 'spring' }} className="text-center mb-2 z-10">
        <div className="font-game text-3xl md:text-4xl mb-1 leading-tight"
          style={{ background: 'linear-gradient(135deg, #fff 0%, #a855f7 50%, #60a5fa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.5))' }}>
          CURSOR
        </div>
        <div className="font-game text-3xl md:text-4xl leading-tight"
          style={{ background: 'linear-gradient(135deg, #f472b6 0%, #a855f7 50%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 20px rgba(244,114,182,0.5))' }}>
          SURVIVOR RPG
        </div>
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="text-purple-300 font-ui text-sm mt-2">
          ใช้เมาส์เป็นอาวุธ · ฆ่าศัตรู · เลเวลอัพ
        </motion.div>
      </motion.div>

      {/* Records */}
      {(highScore > 0 || bestStage > 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex gap-6 mb-4 z-10">
          <div className="text-center"><div className="text-yellow-400 font-ui text-xs">HIGH SCORE</div><div className="text-white font-game text-sm">{highScore.toLocaleString()}</div></div>
          <div className="text-center"><div className="text-cyan-400 font-ui text-xs">BEST STAGE</div><div className="text-white font-game text-sm">{bestStage}</div></div>
        </motion.div>
      )}

      {/* Weapon select */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="z-10 mb-5">
        <div className="text-center text-gray-400 font-ui text-xs mb-3 uppercase tracking-widest">เลือกอาวุธ</div>
        <div className="flex gap-3">
          {STARTER_WEAPONS.map(wid => {
            const w = WEAPONS[wid]; const isSel = selected === wid
            return (
              <motion.button key={wid} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => { setSelected(wid); soundManager.click() }}
                onHoverStart={() => soundManager.hover()}
                style={{ width: 90, height: 110, background: isSel ? `linear-gradient(160deg, ${w.color}22, ${w.color}11)` : 'rgba(255,255,255,0.03)', border: `2px solid ${isSel ? w.color : 'rgba(255,255,255,0.1)'}`, borderRadius: 14, cursor: 'pointer', boxShadow: isSel ? `0 0 20px ${w.color}55` : 'none', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <span style={{ fontSize: 28 }}>{wid === 'sword' ? '🗡️' : wid === 'spear' ? '🔱' : '🪄'}</span>
                <div className="text-white font-ui text-xs font-bold">{w.nameTH}</div>
                <div className="font-ui text-[9px]" style={{ color: w.color }}>DMG {w.damage}</div>
                {wid === 'wand' && <div className="font-ui text-[8px] text-purple-300">Random ธาตุ</div>}
              </motion.button>
            )
          })}
        </div>
        <motion.div key={selected} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex gap-4 justify-center text-xs font-ui">
            <span style={{ color: weapon.color }}>⚔ DMG {weapon.damage}</span>
            <span className="text-yellow-400">⚡ SPD {weapon.attackSpeed}x</span>
            <span className="text-cyan-400">📏 {weapon.range}px</span>
          </div>
          {selected === 'wand' && <div className="text-purple-300 font-ui text-[10px] mt-1">🎲 Random 3 ธาตุให้เลือก 1</div>}
        </motion.div>
      </motion.div>

      {/* Start button */}
      <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => { soundManager.startGame(); startGame(selected) }}
        className="z-10 px-12 py-4 rounded-xl font-game text-base text-white mb-4"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 0 30px rgba(168,85,247,0.5)', cursor: 'pointer' }}>
        START GAME
      </motion.button>

      {/* Dev console toggle */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="z-10">
        <button onClick={() => { setConsoleOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 50) }}
          className="font-ui text-xs text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1">
          <span>{consoleOpen ? '▼' : '▶'}</span> Developer Console
        </button>

        <AnimatePresence>
          {consoleOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-2">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(124,58,237,0.4)', width: 280 }}>
                <div className="font-ui text-purple-400 text-xs mb-2">🖥️ พิมพ์คำสั่ง Dev Mode</div>
                <div className="flex gap-2">
                  <input ref={inputRef} type="text" value={consoleInput} onChange={e => setConsoleInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleConsoleSubmit()}
                    placeholder="/devModeOn หรือ /devModeOff"
                    className="flex-1 rounded px-2 py-1 text-xs font-ui outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(124,58,237,0.4)', color: '#e9d5ff' }} />
                  <button onClick={handleConsoleSubmit}
                    className="px-3 rounded font-ui text-xs" style={{ background: '#7c3aed', color: 'white' }}>
                    OK
                  </button>
                </div>
                {consoleMsg && <div className="font-ui text-xs mt-1.5" style={{ color: consoleMsg.startsWith('✅') ? '#4ade80' : '#f87171' }}>{consoleMsg}</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="absolute bottom-4 text-gray-600 font-ui text-xs z-10">กด ESC เพื่อพัก · เคลื่อนเมาส์เพื่อโจมตี</div>
    </div>
  )
}
