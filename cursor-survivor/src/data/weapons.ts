export type WeaponType = 'sword' | 'spear' | 'wand' | 'bow' | 'gun' | 'scythe' | 'hammer' | 'dagger'

export interface Weapon {
  id: WeaponType
  name: string
  nameTH: string
  damage: number
  attackSpeed: number
  range: number
  aoeRadius: number
  cursorSize: number
  color: string
  unlocked: boolean
}

export const WEAPONS: Record<WeaponType, Weapon> = {
  sword: {
    id: 'sword',
    name: 'Sword',
    nameTH: 'ดาบ',
    damage: 25,
    attackSpeed: 1.2,
    range: 60,
    aoeRadius: 0,
    cursorSize: 40,
    color: '#c0c0c0',
    unlocked: true,
  },
  spear: {
    id: 'spear',
    name: 'Spear',
    nameTH: 'หอก',
    damage: 35,
    attackSpeed: 0.8,
    range: 100,
    aoeRadius: 0,
    cursorSize: 50,
    color: '#8B6914',
    unlocked: true,
  },
  wand: {
    id: 'wand',
    name: 'Wand',
    nameTH: 'ไม้เท้า',
    damage: 20,
    attackSpeed: 1.5,
    range: 120,
    aoeRadius: 30,
    cursorSize: 35,
    color: '#9b59b6',
    unlocked: true,
  },
  bow: {
    id: 'bow',
    name: 'Bow',
    nameTH: 'ธนู',
    damage: 30,
    attackSpeed: 1.0,
    range: 150,
    aoeRadius: 0,
    cursorSize: 45,
    color: '#27ae60',
    unlocked: false,
  },
  gun: {
    id: 'gun',
    name: 'Gun',
    nameTH: 'ปืน',
    damage: 50,
    attackSpeed: 2.0,
    range: 200,
    aoeRadius: 0,
    cursorSize: 38,
    color: '#7f8c8d',
    unlocked: false,
  },
  scythe: {
    id: 'scythe',
    name: 'Scythe',
    nameTH: 'เคียว',
    damage: 45,
    attackSpeed: 0.7,
    range: 80,
    aoeRadius: 50,
    cursorSize: 55,
    color: '#e74c3c',
    unlocked: false,
  },
  hammer: {
    id: 'hammer',
    name: 'Hammer',
    nameTH: 'ค้อน',
    damage: 70,
    attackSpeed: 0.5,
    range: 50,
    aoeRadius: 60,
    cursorSize: 60,
    color: '#e67e22',
    unlocked: false,
  },
  dagger: {
    id: 'dagger',
    name: 'Dagger',
    nameTH: 'กริช',
    damage: 15,
    attackSpeed: 3.0,
    range: 40,
    aoeRadius: 0,
    cursorSize: 30,
    color: '#1abc9c',
    unlocked: false,
  },
}
