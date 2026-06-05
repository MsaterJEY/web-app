import { WeaponType, WEAPONS } from '../data/weapons'
import { PlayerStats } from '../game/store'
import { EnemyData, EnemyStatus } from '../enemy/Enemy'

export interface DamageResult {
  enemyId: string
  damage: number
  isCrit: boolean
  killed: boolean
  xpGained: number
  appliedStatuses: EnemyStatus[]
}

export interface HitEffect {
  x: number
  y: number
  damage: number
  isCrit: boolean
  color: string
  id: string
}

let effectId = 0

export function computeDamage(
  base: number,
  stats: PlayerStats,
  isBoss: boolean
): { damage: number; isCrit: boolean } {
  const isCrit = Math.random() < stats.critRate
  let dmg = base * stats.attackDamage
  if (isBoss) dmg *= (1 - stats.bossReduction)
  if (isCrit) dmg *= stats.critDamage
  return { damage: Math.floor(dmg), isCrit }
}

export function applyWeaponHit(
  weapon: WeaponType,
  cursorX: number,
  cursorY: number,
  enemies: EnemyData[],
  stats: PlayerStats,
  auraRange: number
): { updatedEnemies: EnemyData[]; results: DamageResult[]; effects: HitEffect[] } {
  const weaponData = WEAPONS[weapon]
  const results: DamageResult[] = []
  const effects: HitEffect[] = []
  const updatedEnemies: EnemyData[] = []

  const effectiveRange = auraRange + weaponData.range
  const effectiveAoe = weaponData.aoeRadius * stats.areaDamage

  for (const enemy of enemies) {
    const dx = enemy.x - cursorX
    const dy = enemy.y - cursorY
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist <= effectiveRange + enemy.size / 2) {
      const { damage, isCrit } = computeDamage(weaponData.damage, stats, enemy.isBoss)
      const appliedStatuses: EnemyStatus[] = []

      const updatedEnemy = { ...enemy }
      updatedEnemy.hp -= damage

      // Apply element effects
      if (stats.fireLevel > 0 && Math.random() < 0.3) {
        updatedEnemy.burnTimer = 2 + stats.fireLevel * 0.5
        updatedEnemy.statuses = new Map(updatedEnemy.statuses)
        updatedEnemy.statuses.set('burning', stats.fireLevel)
        appliedStatuses.push('burning')
      }
      if (stats.poisonLevel > 0 && Math.random() < 0.25) {
        updatedEnemy.poisonTimer = 3 + stats.poisonLevel * 0.8
        updatedEnemy.statuses = new Map(updatedEnemy.statuses)
        updatedEnemy.statuses.set('poisoned', stats.poisonLevel)
        appliedStatuses.push('poisoned')
      }
      if (stats.waterLevel > 0 && Math.random() < 0.3) {
        updatedEnemy.statuses = new Map(updatedEnemy.statuses)
        updatedEnemy.statuses.set('frozen', stats.waterLevel)
        appliedStatuses.push('frozen')
      }
      if (stats.lightningLevel > 0 && Math.random() < 0.2) {
        updatedEnemy.stunTimer = 0.5 + stats.lightningLevel * 0.2
        updatedEnemy.statuses = new Map(updatedEnemy.statuses)
        updatedEnemy.statuses.set('stunned', stats.lightningLevel)
        appliedStatuses.push('stunned')
      }
      if (stats.windLevel > 0) {
        const knockMag = 80 + stats.windLevel * 20
        const nx = dx / (dist || 1)
        const ny = dy / (dist || 1)
        updatedEnemy.knockbackX = nx * knockMag * 0.016
        updatedEnemy.knockbackY = ny * knockMag * 0.016
      }
      if (stats.darkLevel > 0 && Math.random() < 0.2) {
        updatedEnemy.damage = Math.floor(updatedEnemy.damage * (1 - stats.darkLevel * 0.08))
        appliedStatuses.push('weakened')
      }
      if (stats.lightLevel > 0 && updatedEnemy.hp <= 0) {
        // Heal handled in game loop
      }
      if (stats.earthLevel > 0) {
        // Armor break — handled via extra damage multiplier already
      }

      const killed = updatedEnemy.hp <= 0
      const xpGained = killed ? enemy.xpDrop : 0

      results.push({ enemyId: enemy.id, damage, isCrit, killed, xpGained, appliedStatuses })
      effects.push({
        x: enemy.x,
        y: enemy.y,
        damage,
        isCrit,
        color: isCrit ? '#ffd700' : '#ffffff',
        id: `eff_${++effectId}`,
      })

      if (!killed) updatedEnemies.push(updatedEnemy)

      // AOE
      if (effectiveAoe > 0 && killed) {
        for (const other of enemies) {
          if (other.id === enemy.id) continue
          const odx = other.x - enemy.x
          const ody = other.y - enemy.y
          const odist = Math.sqrt(odx * odx + ody * ody)
          if (odist <= effectiveAoe) {
            const { damage: aoeD, isCrit: aoeCrit } = computeDamage(
              weaponData.damage * 0.5, stats, other.isBoss
            )
            const updO = { ...other, hp: other.hp - aoeD }
            if (updO.hp > 0) updatedEnemies.push(updO)
            else {
              results.push({ enemyId: other.id, damage: aoeD, isCrit: aoeCrit, killed: true, xpGained: other.xpDrop, appliedStatuses: [] })
            }
            effects.push({ x: other.x, y: other.y, damage: aoeD, isCrit: aoeCrit, color: '#ff8800', id: `eff_${++effectId}` })
          }
        }
      }
    } else {
      updatedEnemies.push(enemy)
    }
  }

  return { updatedEnemies, results, effects }
}
