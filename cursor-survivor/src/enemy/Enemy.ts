import { ENEMY_TIERS, BASE_ENEMY_HP, BASE_ENEMY_DAMAGE, BASE_ENEMY_SPEED, BASE_ENEMY_XP } from '../data/enemies'

export type EnemyStatus = 'burning' | 'frozen' | 'poisoned' | 'stunned' | 'weakened'

export interface EnemyData {
  id: string
  x: number
  y: number
  hp: number
  maxHp: number
  damage: number
  speed: number
  xpDrop: number
  tier: number
  isBoss: boolean
  size: number
  color: string
  glowColor: string
  nameTH: string
  statuses: Map<EnemyStatus, number>
  burnTimer: number
  poisonTimer: number
  stunTimer: number
  knockbackX: number
  knockbackY: number
  auraAngle?: number
}

let enemyIdCounter = 0

export function createEnemy(
  x: number, y: number,
  tier: number, stage: number,
  isBoss: boolean = false
): EnemyData {
  const tierData = ENEMY_TIERS[Math.min(tier, 7)]
  const stageScale = 1 + (stage - 1) * 0.18
  const bossScale = isBoss ? 3.5 : 1

  const hp = Math.floor(BASE_ENEMY_HP * tierData.hpMultiplier * stageScale * bossScale)
  const dmg = Math.floor(BASE_ENEMY_DAMAGE * tierData.damageMultiplier * stageScale * (isBoss ? 1.8 : 1))
  const spd = BASE_ENEMY_SPEED * tierData.speedMultiplier * (isBoss ? 0.6 : 1)
  const xp = Math.floor(BASE_ENEMY_XP * tierData.xpMultiplier * stageScale * (isBoss ? 5 : 1))

  return {
    id: `enemy_${++enemyIdCounter}`,
    x, y,
    hp, maxHp: hp,
    damage: dmg,
    speed: spd,
    xpDrop: xp,
    tier,
    isBoss,
    size: isBoss ? tierData.size * 2.2 : tierData.size,
    color: tierData.color,
    glowColor: tierData.glowColor,
    nameTH: tierData.nameTH + (isBoss ? ' บอส' : ''),
    statuses: new Map(),
    burnTimer: 0,
    poisonTimer: 0,
    stunTimer: 0,
    knockbackX: 0,
    knockbackY: 0,
    auraAngle: isBoss ? 0 : undefined,
  }
}

export function updateEnemy(
  enemy: EnemyData,
  targetX: number, targetY: number,
  delta: number,
  enemySpeedReduction: number
): EnemyData {
  const e = { ...enemy }
  const statuses = new Map(e.statuses)

  // Update status timers
  if (e.burnTimer > 0) {
    e.burnTimer -= delta
    if (e.burnTimer <= 0) statuses.delete('burning')
  }
  if (e.poisonTimer > 0) {
    e.poisonTimer -= delta
    if (e.poisonTimer <= 0) statuses.delete('poisoned')
  }
  if (e.stunTimer > 0) {
    e.stunTimer -= delta
    if (e.stunTimer <= 0) statuses.delete('stunned')
  }

  e.statuses = statuses

  if (statuses.has('stunned')) return e

  const effectiveSpeed = e.speed * (1 - enemySpeedReduction) * (statuses.has('frozen') ? 0.4 : 1)

  // Knockback decay
  e.knockbackX *= 0.85
  e.knockbackY *= 0.85

  const dx = targetX - e.x
  const dy = targetY - e.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist > 1) {
    const nx = dx / dist
    const ny = dy / dist
    e.x += (nx * effectiveSpeed * delta) + e.knockbackX
    e.y += (ny * effectiveSpeed * delta) + e.knockbackY
  }

  if (e.auraAngle !== undefined) {
    e.auraAngle = (e.auraAngle + delta * 120) % 360
  }

  return e
}
