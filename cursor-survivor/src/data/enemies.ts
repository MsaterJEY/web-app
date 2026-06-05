export type EnemyTier = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface EnemyTierData {
  tier: EnemyTier
  nameTH: string
  color: string
  glowColor: string
  hpMultiplier: number
  damageMultiplier: number
  speedMultiplier: number
  xpMultiplier: number
  size: number
}

export const ENEMY_TIERS: EnemyTierData[] = [
  { tier: 0, nameTH: 'ขาว',    color: '#e8e8e8', glowColor: '#ffffff', hpMultiplier: 1.0, damageMultiplier: 1.0, speedMultiplier: 1.0, xpMultiplier: 1.0,  size: 28 },
  { tier: 1, nameTH: 'ฟ้า',    color: '#00bfff', glowColor: '#00bfff', hpMultiplier: 1.4, damageMultiplier: 1.3, speedMultiplier: 1.1, xpMultiplier: 1.5,  size: 30 },
  { tier: 2, nameTH: 'น้ำเงิน', color: '#3a3aff', glowColor: '#3a3aff', hpMultiplier: 2.0, damageMultiplier: 1.6, speedMultiplier: 1.2, xpMultiplier: 2.2,  size: 32 },
  { tier: 3, nameTH: 'เหลือง', color: '#ffd700', glowColor: '#ffd700', hpMultiplier: 3.0, damageMultiplier: 2.0, speedMultiplier: 1.3, xpMultiplier: 3.5,  size: 34 },
  { tier: 4, nameTH: 'ส้ม',    color: '#ff8c00', glowColor: '#ff8c00', hpMultiplier: 4.5, damageMultiplier: 2.5, speedMultiplier: 1.4, xpMultiplier: 5.5,  size: 36 },
  { tier: 5, nameTH: 'ชมพู',   color: '#ff69b4', glowColor: '#ff69b4', hpMultiplier: 6.5, damageMultiplier: 3.2, speedMultiplier: 1.5, xpMultiplier: 8.0,  size: 38 },
  { tier: 6, nameTH: 'แดง',    color: '#ff1a1a', glowColor: '#ff0000', hpMultiplier: 9.0, damageMultiplier: 4.0, speedMultiplier: 1.6, xpMultiplier: 12.0, size: 40 },
  { tier: 7, nameTH: 'ม่วง',   color: '#9b30ff', glowColor: '#9b30ff', hpMultiplier: 13.0, damageMultiplier: 5.0, speedMultiplier: 1.8, xpMultiplier: 18.0, size: 42 },
]

export const BASE_ENEMY_HP = 60
export const BASE_ENEMY_DAMAGE = 8
export const BASE_ENEMY_SPEED = 55
export const BASE_ENEMY_XP = 10
