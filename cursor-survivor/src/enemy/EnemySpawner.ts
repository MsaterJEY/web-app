import { createEnemy, EnemyData } from './Enemy'

export interface SpawnConfig {
  stage: number
  canvasWidth: number
  canvasHeight: number
}

function getTierForStage(stage: number): number {
  if (stage <= 2) return 0
  if (stage <= 4) return Math.random() < 0.3 ? 1 : 0
  if (stage <= 6) return Math.random() < 0.4 ? 1 : (Math.random() < 0.15 ? 2 : 0)
  if (stage <= 8) return Math.floor(Math.random() * 3)
  if (stage <= 12) return Math.floor(Math.random() * 4)
  if (stage <= 16) return Math.floor(Math.random() * 5)
  if (stage <= 20) return Math.floor(Math.random() * 6)
  return Math.floor(Math.random() * 8)
}

function getSpawnPosition(w: number, h: number): { x: number; y: number } {
  const edge = Math.floor(Math.random() * 4)
  const margin = 60
  switch (edge) {
    case 0: return { x: Math.random() * w, y: -margin }
    case 1: return { x: Math.random() * w, y: h + margin }
    case 2: return { x: -margin, y: Math.random() * h }
    default: return { x: w + margin, y: Math.random() * h }
  }
}

export function getStageEnemyCount(stage: number): number {
  if (stage === 1) return Math.floor(Math.random() * 5) + 4
  if (stage === 2) return Math.floor(Math.random() * 6) + 6
  return Math.floor(4 + stage * 2.5 + Math.random() * stage)
}

export function shouldSpawnBoss(stage: number): boolean {
  return stage % 5 === 0
}

export function spawnWave(config: SpawnConfig, count: number): EnemyData[] {
  const { stage, canvasWidth, canvasHeight } = config
  const enemies: EnemyData[] = []
  for (let i = 0; i < count; i++) {
    const pos = getSpawnPosition(canvasWidth, canvasHeight)
    const tier = getTierForStage(stage)
    const isElite = stage > 3 && Math.random() < 0.05 + stage * 0.01
    enemies.push(createEnemy(pos.x, pos.y, tier, stage, false))
    if (isElite) enemies[enemies.length - 1].size *= 1.4
  }
  return enemies
}

export function spawnBoss(config: SpawnConfig): EnemyData {
  const { stage, canvasWidth, canvasHeight } = config
  const pos = getSpawnPosition(canvasWidth, canvasHeight)
  const tier = Math.min(7, Math.floor(stage / 5))
  return createEnemy(pos.x, pos.y, tier, stage, true)
}
