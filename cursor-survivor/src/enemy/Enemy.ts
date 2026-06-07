import { ENEMY_TIERS, BASE_ENEMY_HP, BASE_ENEMY_DAMAGE, BASE_ENEMY_SPEED, BASE_ENEMY_XP } from '../data/enemies'

export type EnemyStatus = 'burning' | 'frozen' | 'poisoned' | 'stunned' | 'weakened'
export type BossElement = 'fire' | 'water' | 'lightning' | 'poison' | 'dark'

export interface EnemyData {
  id: string
  x: number; y: number
  hp: number; maxHp: number
  damage: number; speed: number; xpDrop: number
  tier: number
  isBoss: boolean
  isElite: boolean
  size: number; color: string; glowColor: string; nameTH: string
  statuses: Map<EnemyStatus, number>
  burnTimer: number; poisonTimer: number; stunTimer: number
  knockbackX: number; knockbackY: number
  auraAngle?: number
  bossElement?: BossElement
  projectileTimer?: number
}

const BOSS_ELEMENTS: BossElement[] = ['fire', 'water', 'lightning', 'poison', 'dark']
export const BOSS_ELEMENT_COLORS: Record<BossElement, string> = {
  fire: '#ff4500', water: '#1e90ff', lightning: '#ffd700', poison: '#32cd32', dark: '#9b30ff'
}

let enemyIdCounter = 0

export function createEnemy(x: number, y: number, tier: number, stage: number, isBoss = false, isElite = false): EnemyData {
  const tierData = ENEMY_TIERS[Math.min(tier, 7)]
  const stageScale = 1 + (stage - 1) * 0.18
  const bossHpScale = isBoss ? 6.0 : 1   // boss เลือดเยอะขึ้นมาก
  const eliteScale = isElite ? 2.2 : 1

  const hp   = Math.floor(BASE_ENEMY_HP     * tierData.hpMultiplier     * stageScale * bossHpScale * eliteScale)
  const dmg  = Math.floor(BASE_ENEMY_DAMAGE * tierData.damageMultiplier * stageScale * (isBoss ? 2.0 : isElite ? 1.5 : 1))
  const spd  = BASE_ENEMY_SPEED * tierData.speedMultiplier * (isBoss ? 0.38 : isElite ? 1.15 : 1) // boss ช้าลง
  const xp   = Math.floor(BASE_ENEMY_XP    * tierData.xpMultiplier     * stageScale * (isBoss ? 8 : isElite ? 3 : 1) * 1.15)

  const bossElement = isBoss ? BOSS_ELEMENTS[Math.floor(Math.random() * BOSS_ELEMENTS.length)] : undefined

  return {
    id: `enemy_${++enemyIdCounter}`,
    x, y, hp, maxHp: hp, damage: dmg, speed: spd, xpDrop: xp,
    tier, isBoss, isElite,
    size: isBoss ? tierData.size * 2.8 : isElite ? tierData.size * 1.55 : tierData.size,
    color: isElite ? '#ff69b4' : tierData.color,
    glowColor: isElite ? '#ff1493' : tierData.glowColor,
    nameTH: tierData.nameTH + (isBoss ? ' บอส' : isElite ? ' Elite' : ''),
    statuses: new Map(),
    burnTimer: 0, poisonTimer: 0, stunTimer: 0,
    knockbackX: 0, knockbackY: 0,
    auraAngle: isBoss ? 0 : undefined,
    bossElement,
    projectileTimer: isBoss ? 3.5 : undefined,
  }
}

export function updateEnemy(enemy: EnemyData, targetX: number, targetY: number, delta: number, speedReduction: number): EnemyData {
  const e = { ...enemy }
  const statuses = new Map(e.statuses)

  if (e.burnTimer > 0)   { e.burnTimer   -= delta; if (e.burnTimer   <= 0) statuses.delete('burning')  }
  if (e.poisonTimer > 0) { e.poisonTimer -= delta; if (e.poisonTimer <= 0) statuses.delete('poisoned') }
  if (e.stunTimer > 0)   { e.stunTimer   -= delta; if (e.stunTimer   <= 0) statuses.delete('stunned')  }
  e.statuses = statuses

  if (statuses.has('stunned')) return e

  const effectiveSpeed = e.speed * (1 - speedReduction) * (statuses.has('frozen') ? 0.4 : 1)
  e.knockbackX *= 0.85
  e.knockbackY *= 0.85

  const dx = targetX - e.x, dy = targetY - e.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist > 1) {
    e.x += (dx / dist) * effectiveSpeed * delta + e.knockbackX
    e.y += (dy / dist) * effectiveSpeed * delta + e.knockbackY
  }

  if (e.auraAngle !== undefined) e.auraAngle = (e.auraAngle + delta * 90) % 360
  if (e.projectileTimer !== undefined) e.projectileTimer -= delta

  return e
}
