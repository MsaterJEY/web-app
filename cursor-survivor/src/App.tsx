import React from 'react'
import { useGameStore } from './game/store'
import { GameCanvas } from './game/Game'
import { HUD } from './ui/HUD'
import { SkillCards } from './ui/SkillCards'
import { PauseOverlay } from './ui/PauseOverlay'
import { MenuScreen } from './ui/MenuScreen'
import { GameOverScreen } from './ui/GameOverScreen'
import { ElementPickScreen } from './ui/ElementPickScreen'
import { LoadingScreen } from './ui/LoadingScreen'

export default function App() {
  const { phase } = useGameStore()
  const showCanvas = phase !== 'menu' && phase !== 'element_pick' && phase !== 'loading'

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
    </div>
  )
}
