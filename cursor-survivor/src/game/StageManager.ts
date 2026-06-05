export interface StageInfo {
  stage: number
  enemyCount: number
  spawnInterval: number  // seconds
  eliteChance: number
  bossChance: number
  hasBoss: boolean
}

export function getStageInfo(stage: number): StageInfo {
  const base = {
    stage,
    enemyCount: Math.floor(4 + stage * 2.5),
    spawnInterval: Math.max(0.4, 2.0 - stage * 0.08),
    eliteChance: Math.min(0.35, 0.02 + stage * 0.015),
    bossChance: Math.min(0.15, stage * 0.01),
    hasBoss: stage % 5 === 0,
  }
  if (stage === 1) base.enemyCount = 4 + Math.floor(Math.random() * 5)
  if (stage === 2) base.enemyCount = 6 + Math.floor(Math.random() * 5)
  return base
}

export function getLevelForStage(stage: number): number {
  if (stage <= 1) return 1
  if (stage <= 2) return 2
  if (stage <= 4) return 3
  return 3 + Math.floor((stage - 3) / 2)
}

export function isStageComplete(killed: number, total: number, hasBoss: boolean, bossKilled: boolean): boolean {
  if (hasBoss) return killed >= total && bossKilled
  return killed >= total
}
