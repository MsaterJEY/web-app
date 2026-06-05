import React from 'react'
import { useGameStore } from './game/store'
import { GameCanvas } from './game/Game'
import { HUD } from './ui/HUD'
import { SkillCards } from './ui/SkillCards'
import { PauseOverlay } from './ui/PauseOverlay'
import { MenuScreen } from './ui/MenuScreen'
import { GameOverScreen } from './ui/GameOverScreen'

export default function App() {
  const { phase } = useGameStore()

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      {/* Game canvas always rendered when not on menu */}
      {phase !== 'menu' && <GameCanvas />}

      {/* Menu */}
      {phase === 'menu' && <MenuScreen />}

      {/* HUD - shown during gameplay and pause */}
      {(phase === 'playing' || phase === 'paused' || phase === 'levelup') && <HUD />}

      {/* Overlays */}
      <SkillCards />
      <PauseOverlay />
      <GameOverScreen />
    </div>
  )
}
