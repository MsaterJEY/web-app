import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { WeaponType } from '../data/weapons'
import { SkillCard, SkillEffect, ElementType } from '../data/skills'

export type GamePhase = 'menu' | 'loading' | 'element_pick' | 'playing' | 'levelup' | 'paused' | 'gameover' | 'victory'

export interface PlayerStats {
  hp: number; maxHp: number; defense: number
  attackDamage: number; attackSpeed: number; areaDamage: number
  critRate: number; critDamage: number; xpGain: number; auraRange: number
  enemyDmgReduction: number; enemySpeedReduction: number; bossReduction: number
  fireLevel: number; waterLevel: number; earthLevel: number; windLevel: number
  lightningLevel: number; lightLevel: number; darkLevel: number; poisonLevel: number
}

export interface GameState {
  phase: GamePhase
  stage: number; level: number; xp: number; xpRequired: number
  score: number; killCount: number
  selectedWeapon: WeaponType
  playerStats: PlayerStats
  acquiredSkills: SkillCard[]
  highScore: number; bestStage: number
  pendingWeapon: WeaponType | null
  pendingXP: number       // XP สะสมระหว่าง stage รอ collect หลังจบ
  devMode: boolean
  pendingLevelUps: number

  setPhase: (phase: GamePhase) => void
  startGame: (weapon: WeaponType) => void
  pickElement: (element: ElementType) => void
  gainXP: (amount: number) => void
  collectPendingXP: () => void
  levelUp: () => void
  applySkill: (skill: SkillCard) => void
  takeDamage: (amount: number) => void
  healPlayer: (amount: number) => void
  nextStage: () => void
  addKill: (xp: number) => void
  resetGame: () => void
  setWeapon: (weapon: WeaponType) => void
  setDevMode: (v: boolean) => void
  // Dev commands
  devSetStage: (n: number) => void
  devSetLevel: (n: number) => void
  devSetHP: (n: number) => void
  devGodMode: (v: boolean) => void
  devKillAll: () => void
  devResetAll: () => void
  devSetStat: (key: 'attackSpeed' | 'attackDamage' | 'auraRange', value: number) => void
}

export const BASE_STATS: PlayerStats = {
  hp: 200, maxHp: 200, defense: 0,
  attackDamage: 1.0, attackSpeed: 1.0, areaDamage: 1.0,
  critRate: 0.05, critDamage: 1.5, xpGain: 1.0, auraRange: 80,
  enemyDmgReduction: 0, enemySpeedReduction: 0, bossReduction: 0,
  fireLevel: 0, waterLevel: 0, earthLevel: 0, windLevel: 0,
  lightningLevel: 0, lightLevel: 0, darkLevel: 0, poisonLevel: 0,
}

export function calcXPRequired(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

function applyElementToStats(stats: PlayerStats, element: ElementType): PlayerStats {
  const s = { ...stats }
  const map: Record<ElementType, keyof PlayerStats> = {
    fire: 'fireLevel', water: 'waterLevel', earth: 'earthLevel', wind: 'windLevel',
    lightning: 'lightningLevel', light: 'lightLevel', dark: 'darkLevel', poison: 'poisonLevel',
  }
  ;(s as any)[map[element]] = 1
  return s
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      phase: 'menu',
      stage: 1, level: 1, xp: 0, xpRequired: 100,
      score: 0, killCount: 0,
      selectedWeapon: 'sword' as WeaponType,
      playerStats: { ...BASE_STATS },
      acquiredSkills: [],
      highScore: 0, bestStage: 0,
      pendingWeapon: null,
      pendingXP: 0,
      devMode: false,
      pendingLevelUps: 0,

      setPhase: (phase) => set({ phase }),

      startGame: (weapon) => {
        if (weapon === 'wand') {
          set({ pendingWeapon: weapon, phase: 'element_pick' })
        } else {
          set({
            phase: 'loading', stage: 1, level: 1, xp: 0, xpRequired: 100,
            score: 0, killCount: 0, selectedWeapon: weapon,
            playerStats: { ...BASE_STATS }, acquiredSkills: [], pendingWeapon: null, pendingXP: 0,
          })
        }
      },

      pickElement: (element) => {
        const weapon = get().pendingWeapon ?? 'wand'
        const stats = applyElementToStats({ ...BASE_STATS }, element)
        set({
          phase: 'loading', stage: 1, level: 1, xp: 0, xpRequired: 100,
          score: 0, killCount: 0, selectedWeapon: weapon,
          playerStats: stats, acquiredSkills: [], pendingWeapon: null, pendingXP: 0,
        })
      },

      // XP สะสมระหว่าง stage — ยังไม่เข้า level
      gainXP: (amount) => {
        const state = get()
        // บวก 30% จากฐาน แล้วคูณ xpGain multiplier ของผู้เล่น
        const gained = Math.floor(amount * 1.3 * state.playerStats.xpGain)
        set({ pendingXP: state.pendingXP + gained })
      },

      // เรียกหลังจบ stage — แจก XP จริง
      collectPendingXP: () => {
        const state = get()
        if (state.pendingXP === 0) return
        let xp = state.xp + state.pendingXP
        let level = state.level
        let xpRequired = state.xpRequired
        let levelUpCount = 0

        while (xp >= xpRequired) {
          xp -= xpRequired
          level++
          xpRequired = calcXPRequired(level)
          levelUpCount++
        }

        set({ xp, level, xpRequired, pendingXP: 0 })

        if (levelUpCount > 0) {
          // เก็บจำนวนที่เหลือไว้ (ลบ 1 เพราะ set phase levelup ทันที)
          set({ pendingLevelUps: levelUpCount - 1, phase: 'levelup' })
        }
      },

      levelUp: () => {
        const state = get()
        const newLevel = state.level + 1
        set({ level: newLevel, xpRequired: calcXPRequired(newLevel), pendingLevelUps: 0, phase: 'levelup' })
      },

      applySkill: (skill) => {
        const state = get()
        const stats = { ...state.playerStats }
        const eff = skill.effect as Partial<SkillEffect>
        if (eff.attackDamage)       stats.attackDamage       += eff.attackDamage
        if (eff.attackSpeed)        stats.attackSpeed        += eff.attackSpeed
        if (eff.areaDamage)         stats.areaDamage         += eff.areaDamage
        if (eff.critRate)           stats.critRate            = Math.min(1, stats.critRate + eff.critRate)
        if (eff.critDamage)         stats.critDamage         += eff.critDamage
        if (eff.xpGain)             stats.xpGain             += eff.xpGain
        if (eff.auraRange)          stats.auraRange          += eff.auraRange
        if (eff.hp)                 { stats.maxHp += eff.hp; stats.hp = Math.min(stats.hp + eff.hp, stats.maxHp) }
        if (eff.defense)            stats.defense            += eff.defense
        if (eff.enemyDmgReduction)  stats.enemyDmgReduction  = Math.min(0.8, stats.enemyDmgReduction  + eff.enemyDmgReduction)
        if (eff.enemySpeedReduction)stats.enemySpeedReduction = Math.min(0.7, stats.enemySpeedReduction + eff.enemySpeedReduction)
        if (eff.bossReduction)      stats.bossReduction       = Math.min(0.7, stats.bossReduction      + eff.bossReduction)
        if (eff.fireLevel)          stats.fireLevel           = Math.min(5, stats.fireLevel      + eff.fireLevel)
        if (eff.waterLevel)         stats.waterLevel          = Math.min(5, stats.waterLevel     + eff.waterLevel)
        if (eff.earthLevel)         stats.earthLevel          = Math.min(5, stats.earthLevel     + eff.earthLevel)
        if (eff.windLevel)          stats.windLevel           = Math.min(5, stats.windLevel      + eff.windLevel)
        if (eff.lightningLevel)     stats.lightningLevel      = Math.min(5, stats.lightningLevel + eff.lightningLevel)
        if (eff.lightLevel)         stats.lightLevel          = Math.min(5, stats.lightLevel     + eff.lightLevel)
        if (eff.darkLevel)          stats.darkLevel           = Math.min(5, stats.darkLevel      + eff.darkLevel)
        if (eff.poisonLevel)        stats.poisonLevel         = Math.min(5, stats.poisonLevel    + eff.poisonLevel)
        const remaining = state.pendingLevelUps ?? 0
        if (remaining > 0) {
          // ยังมี level up ที่รอ — แสดง skill card ต่อ
          set({ playerStats: stats, acquiredSkills: [...state.acquiredSkills, skill], pendingLevelUps: remaining - 1, phase: 'levelup' })
        } else {
          set({ playerStats: stats, acquiredSkills: [...state.acquiredSkills, skill], phase: 'playing' })
        }
      },

      takeDamage: (amount) => {
        const state = get()
        if (state.devMode) return // god mode in dev
        const stats = state.playerStats
        let dmg = Math.max(1, Math.floor(amount * (1 - stats.defense) * (1 - stats.enemyDmgReduction)))
        const newHp = stats.hp - dmg
        if (newHp <= 0) {
          set({ playerStats: { ...stats, hp: 0 }, phase: 'gameover',
            highScore: Math.max(state.highScore, state.score),
            bestStage: Math.max(state.bestStage, state.stage) })
        } else {
          set({ playerStats: { ...stats, hp: newHp } })
        }
      },

      healPlayer: (amount) => {
        const s = get().playerStats
        set({ playerStats: { ...s, hp: Math.min(s.maxHp, s.hp + amount) } })
      },

      nextStage: () => {
        const state = get()
        // Collect XP after stage complete then advance
        const newStage = state.stage + 1
        set({ stage: newStage })
        get().collectPendingXP()
      },

      addKill: (xp) => {
        const state = get()
        set({ killCount: state.killCount + 1, score: state.score + xp * 10 })
        get().gainXP(xp)
      },

      resetGame: () => set({
        phase: 'menu', stage: 1, level: 1, xp: 0, xpRequired: 100,
        score: 0, killCount: 0, playerStats: { ...BASE_STATS },
        acquiredSkills: [], pendingWeapon: null, pendingXP: 0,
      }),

      setWeapon: (weapon) => set({ selectedWeapon: weapon }),
      setDevMode: (v) => set({ devMode: v }),

      devSetStage:  (n) => set({ stage: n }),
      devSetLevel:  (n) => set({ level: n, xpRequired: calcXPRequired(n) }),
      devSetHP:     (n) => set(s => ({ playerStats: { ...s.playerStats, hp: n, maxHp: Math.max(n, s.playerStats.maxHp) } })),
      devGodMode:   (v) => set({ devMode: v }),
      devKillAll:   ()  => { /* signal handled in Game.tsx via devMode flag */ },
      devSetStat: (key, value) => set(s => ({ playerStats: { ...s.playerStats, [key]: value } })),
      devResetAll: () => set((state) => ({
        stage: 1,
        level: 1,
        xp: 0,
        xpRequired: 100,
        score: 0,
        killCount: 0,
        playerStats: { ...BASE_STATS },
        acquiredSkills: [],
        pendingXP: 0,
        devMode: state.devMode // คงสถานะ devMode ไว้
      })),
    }),
    {
      name: 'cursor-survivor-save',
      partialize: (s) => ({ highScore: s.highScore, bestStage: s.bestStage }),
    }
  )
)
