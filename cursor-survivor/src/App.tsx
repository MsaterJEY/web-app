import React from 'react'
import { useGameStore } from './game/store'
import { GameCanvas } from './game/Game'
import { HUD } from './ui/HUD'
import { SkillCards } from './ui/SkillCards'
import { PauseOverlay } from './ui/PauseOverlay'
import { MenuScreen } from './ui/MenuScreen'
import { GameOverScreen } from './ui/GameOverScreen'
import { VictoryScreen } from './ui/VictoryScreen'
import { ElementPickScreen } from './ui/ElementPickScreen'
import { LoadingScreen } from './ui/LoadingScreen'

export default function App() {
  const { phase } = useGameStore()
  const showCanvas = phase !== 'menu' && phase !== 'element_pick' && phase !== 'loading'

  const [devBanner, setDevBanner] = React.useState(true)

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      {showCanvas && <GameCanvas />}
      {phase === 'menu' && <MenuScreen />}
      {phase === 'element_pick' && <ElementPickScreen />}
      {phase === 'loading' && <LoadingScreen />}
      {(phase === 'playing' || phase === 'paused' || phase === 'levelup') && <HUD />}
      <SkillCards />
      <PauseOverlay />
      <GameOverScreen />
      <VictoryScreen />

      {/* Dev banner popup */}
      {devBanner && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="text-center max-w-sm mx-4 rounded-2xl px-8 py-8"
            style={{ background: 'linear-gradient(160deg,#0f0520,#05050f)', border: '2px solid rgba(168,85,247,0.5)', boxShadow: '0 0 50px rgba(168,85,247,0.2)' }}>
            <div className="text-4xl mb-4">🚧</div>
            <div className="font-game text-xl text-purple-300 mb-2" style={{ textShadow: '0 0 16px #a855f7' }}>กำลังพัฒนา</div>
            <div className="font-ui text-sm text-gray-400 leading-relaxed mb-6">
              เกมนี้ยังอยู่ในช่วงพัฒนา (Early Access)<br />
              อาจมีบั๊กหรือฟีเจอร์ที่ยังไม่สมบูรณ์<br />
              ขอบคุณที่ร่วมทดสอบ! 🙏
            </div>
            <button
              onClick={() => setDevBanner(false)}
              className="px-8 py-2.5 rounded-xl font-ui font-bold text-sm text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(90deg,#7c3aed,#a855f7)', boxShadow: '0 0 20px rgba(168,85,247,0.3)' }}
            >
              รับทราบ — เข้าสู่เกม
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
