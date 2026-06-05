export type ElementType = 'earth' | 'water' | 'wind' | 'fire' | 'lightning' | 'light' | 'dark' | 'poison'
export type SkillCategory = 'element' | 'attack' | 'defense'

export interface SkillCard {
  id: string
  name: string
  nameTH: string
  description: string
  descriptionTH: string
  category: SkillCategory
  element?: ElementType
  level?: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  icon: string
  effect: Partial<SkillEffect>
}

export interface SkillEffect {
  attackDamage: number
  attackSpeed: number
  areaDamage: number
  critRate: number
  critDamage: number
  xpGain: number
  auraRange: number
  hp: number
  defense: number
  enemyDmgReduction: number
  enemySpeedReduction: number
  bossReduction: number
  fireLevel: number
  waterLevel: number
  earthLevel: number
  windLevel: number
  lightningLevel: number
  lightLevel: number
  darkLevel: number
  poisonLevel: number
}

export const ELEMENT_COLORS: Record<ElementType, string> = {
  earth:     '#8B4513',
  water:     '#1e90ff',
  wind:      '#98fb98',
  fire:      '#ff4500',
  lightning: '#ffd700',
  light:     '#fffacd',
  dark:      '#4b0082',
  poison:    '#32cd32',
}

export const ELEMENT_NAMES_TH: Record<ElementType, string> = {
  earth:     'ดิน',
  water:     'น้ำ',
  wind:      'ลม',
  fire:      'ไฟ',
  lightning: 'สายฟ้า',
  light:     'แสง',
  dark:      'ความมืด',
  poison:    'พิษ',
}

export const SKILL_POOL: SkillCard[] = [
  // Attack skills
  {
    id: 'atk_dmg_1', name: 'Power Strike', nameTH: 'พลังโจมตี',
    description: '+15% Attack Damage', descriptionTH: '+15% พลังโจมตี',
    category: 'attack', rarity: 'common', icon: '⚔️',
    effect: { attackDamage: 0.15 },
  },
  {
    id: 'atk_spd_1', name: 'Swift Blade', nameTH: 'ใบมีดเร็ว',
    description: '+20% Attack Speed', descriptionTH: '+20% ความเร็วโจมตี',
    category: 'attack', rarity: 'common', icon: '💨',
    effect: { attackSpeed: 0.20 },
  },
  {
    id: 'crit_rate_1', name: 'Eagle Eye', nameTH: 'ตาเหยี่ยว',
    description: '+10% Critical Rate', descriptionTH: '+10% อัตราคริติคอล',
    category: 'attack', rarity: 'rare', icon: '🎯',
    effect: { critRate: 0.10 },
  },
  {
    id: 'crit_dmg_1', name: 'Lethal Blow', nameTH: 'ชี้ร้าย',
    description: '+25% Critical Damage', descriptionTH: '+25% ดาเมจคริติคอล',
    category: 'attack', rarity: 'rare', icon: '💥',
    effect: { critDamage: 0.25 },
  },
  {
    id: 'area_dmg_1', name: 'Shockwave', nameTH: 'คลื่นกระแทก',
    description: '+20% Area Damage', descriptionTH: '+20% ดาเมจพื้นที่',
    category: 'attack', rarity: 'rare', icon: '🌊',
    effect: { areaDamage: 0.20 },
  },
  {
    id: 'aura_range_1', name: 'Wide Aura', nameTH: 'ออร่ากว้าง',
    description: '+30 Aura Range', descriptionTH: '+30 พิสัยออร่า',
    category: 'attack', rarity: 'common', icon: '✨',
    effect: { auraRange: 30 },
  },
  {
    id: 'xp_gain_1', name: 'Scholar', nameTH: 'นักวิชาการ',
    description: '+25% XP Gain', descriptionTH: '+25% รับ XP',
    category: 'attack', rarity: 'common', icon: '📚',
    effect: { xpGain: 0.25 },
  },
  // Defense skills
  {
    id: 'hp_1', name: 'Iron Will', nameTH: 'เจตจำนงเหล็ก',
    description: '+50 Max HP', descriptionTH: '+50 HP สูงสุด',
    category: 'defense', rarity: 'common', icon: '❤️',
    effect: { hp: 50 },
  },
  {
    id: 'defense_1', name: 'Stone Skin', nameTH: 'หนังหิน',
    description: '+15% Defense', descriptionTH: '+15% ป้องกัน',
    category: 'defense', rarity: 'common', icon: '🛡️',
    effect: { defense: 0.15 },
  },
  {
    id: 'enemy_dmg_red_1', name: 'Barrier', nameTH: 'กำแพงกั้น',
    description: '-10% Enemy Damage', descriptionTH: '-10% ดาเมจศัตรู',
    category: 'defense', rarity: 'rare', icon: '🔮',
    effect: { enemyDmgReduction: 0.10 },
  },
  {
    id: 'enemy_spd_red_1', name: 'Slow Field', nameTH: 'สนามช้า',
    description: '-15% Enemy Speed', descriptionTH: '-15% ความเร็วศัตรู',
    category: 'defense', rarity: 'rare', icon: '🐌',
    effect: { enemySpeedReduction: 0.15 },
  },
  {
    id: 'boss_red_1', name: 'Giant Slayer', nameTH: 'นักล่ายักษ์',
    description: '-20% Boss Damage', descriptionTH: '-20% ดาเมจบอส',
    category: 'defense', rarity: 'epic', icon: '🗡️',
    effect: { bossReduction: 0.20 },
  },
  // Element skills
  {
    id: 'fire_1', name: 'Flame Touch', nameTH: 'ไฟแตะ',
    description: 'Fire Lv.1 - Burns enemies', descriptionTH: 'ไฟ Lv.1 - เผาศัตรู',
    category: 'element', element: 'fire', level: 1, rarity: 'rare', icon: '🔥',
    effect: { fireLevel: 1 },
  },
  {
    id: 'ice_1', name: 'Frost Touch', nameTH: 'น้ำแข็งแตะ',
    description: 'Water Lv.1 - Slows enemies', descriptionTH: 'น้ำ Lv.1 - ชะลอศัตรู',
    category: 'element', element: 'water', level: 1, rarity: 'rare', icon: '❄️',
    effect: { waterLevel: 1 },
  },
  {
    id: 'lightning_1', name: 'Static Shock', nameTH: 'ไฟฟ้าสถิต',
    description: 'Lightning Lv.1 - Stuns', descriptionTH: 'สายฟ้า Lv.1 - มึนงง',
    category: 'element', element: 'lightning', level: 1, rarity: 'rare', icon: '⚡',
    effect: { lightningLevel: 1 },
  },
  {
    id: 'poison_1', name: 'Toxic Touch', nameTH: 'พิษแตะ',
    description: 'Poison Lv.1 - DoT damage', descriptionTH: 'พิษ Lv.1 - ดาเมจต่อเนื่อง',
    category: 'element', element: 'poison', level: 1, rarity: 'rare', icon: '☠️',
    effect: { poisonLevel: 1 },
  },
  {
    id: 'wind_1', name: 'Gust', nameTH: 'ลมกระโชก',
    description: 'Wind Lv.1 - Knockback', descriptionTH: 'ลม Lv.1 - ดันศัตรู',
    category: 'element', element: 'wind', level: 1, rarity: 'rare', icon: '🌪️',
    effect: { windLevel: 1 },
  },
  {
    id: 'dark_1', name: 'Shadow Touch', nameTH: 'เงามืดแตะ',
    description: 'Dark Lv.1 - Weakness curse', descriptionTH: 'ความมืด Lv.1 - สาปอ่อนแอ',
    category: 'element', element: 'dark', level: 1, rarity: 'epic', icon: '🌑',
    effect: { darkLevel: 1 },
  },
  {
    id: 'light_1', name: 'Holy Light', nameTH: 'แสงศักดิ์สิทธิ์',
    description: 'Light Lv.1 - Heal on kill', descriptionTH: 'แสง Lv.1 - รักษาเมื่อฆ่า',
    category: 'element', element: 'light', level: 1, rarity: 'epic', icon: '🌟',
    effect: { lightLevel: 1 },
  },
  {
    id: 'earth_1', name: 'Earthen Strike', nameTH: 'โจมตีแผ่นดิน',
    description: 'Earth Lv.1 - Armor break', descriptionTH: 'ดิน Lv.1 - ทำลายเกราะ',
    category: 'element', element: 'earth', level: 1, rarity: 'rare', icon: '🪨',
    effect: { earthLevel: 1 },
  },
  // Legendary
  {
    id: 'atk_dmg_leg', name: 'Berserker', nameTH: 'เบอร์เซิร์ก',
    description: '+40% ATK, +50% Crit Dmg', descriptionTH: '+40% โจมตี, +50% คริดาเมจ',
    category: 'attack', rarity: 'legendary', icon: '🩸',
    effect: { attackDamage: 0.40, critDamage: 0.50 },
  },
  {
    id: 'def_leg', name: 'Fortress', nameTH: 'ป้อมปราการ',
    description: '+100 HP, -20% Enemy DMG', descriptionTH: '+100 HP, -20% ดาเมจศัตรู',
    category: 'defense', rarity: 'legendary', icon: '🏰',
    effect: { hp: 100, enemyDmgReduction: 0.20 },
  },
]
