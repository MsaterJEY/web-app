import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { WeaponType, WEAPONS } from '../data/weapons'
import { SkillCard, SkillEffect } from '../data/skills'

export type GamePhase = 'menu' | 'playing' | 'levelup' | 'paused' | 'gameover' | 'victory'

export interface PlayerStats {
  hp: number
  maxHp: number
  defense: number
  attackDamage: number
  attackSpeed: number
  areaDamage: number
  critRate: number
  critDamage: number
  xpGain: number
  auraRange: number
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

export interface GameState {
  phase: GamePhase
  stage: number
  level: number
  xp: number
  xpRequired: number
  score: number
  killCount: number
  selectedWeapon: WeaponType
  playerStats: PlayerStats
  acquiredSkills: SkillCard[]
  highScore: number
  bestStage: number

  // Actions
  setPhase: (phase: GamePhase) => void
  startGame: (weapon: WeaponType) => void
  gainXP: (amount: number) => void
  levelUp: () => void
  applySkill: (skill: SkillCard) => void
  takeDamage: (amount: number) => void
  nextStage: () => void
  addKill: (xp: number) => void
  resetGame: () => void
  setWeapon: (weapon: WeaponType) => void
}

const BASE_STATS: PlayerStats = {
  hp: 200,
  maxHp: 200,
  defense: 0,
  attackDamage: 1.0,
  attackSpeed: 1.0,
  areaDamage: 1.0,
  critRate: 0.05,
  critDamage: 1.5,
  xpGain: 1.0,
  auraRange: 80,
  enemyDmgReduction: 0,
  enemySpeedReduction: 0,
  bossReduction: 0,
  fireLevel: 0,
  waterLevel: 0,
  earthLevel: 0,
  windLevel: 0,
  lightningLevel: 0,
  lightLevel: 0,
  darkLevel: 0,
  poisonLevel: 0,
}

function calcXPRequired(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      phase: 'menu',
      stage: 1,
      level: 1,
      xp: 0,
      xpRequired: 100,
      score: 0,
      killCount: 0,
      selectedWeapon: 'sword',
      playerStats: { ...BASE_STATS },
      acquiredSkills: [],
      highScore: 0,
      bestStage: 0,

      setPhase: (phase) => set({ phase }),

      startGame: (weapon) => {
        set({
          phase: 'playing',
          stage: 1,
          level: 1,
          xp: 0,
          xpRequired: 100,
          score: 0,
          killCount: 0,
          selectedWeapon: weapon,
          playerStats: { ...BASE_STATS },
          acquiredSkills: [],
        })
      },

      gainXP: (amount) => {
        const state = get()
        const gained = Math.floor(amount * state.playerStats.xpGain)
        const newXP = state.xp + gained
        if (newXP >= state.xpRequired) {
          set({ xp: newXP - state.xpRequired })
          get().levelUp()
        } else {
          set({ xp: newXP })
        }
      },

      levelUp: () => {
        const state = get()
        const newLevel = state.level + 1
        set({
          level: newLevel,
          xpRequired: calcXPRequired(newLevel),
          phase: 'levelup',
        })
      },

      applySkill: (skill) => {
        const state = get()
        const stats = { ...state.playerStats }
        const eff = skill.effect as Partial<SkillEffect>

        if (eff.attackDamage) stats.attackDamage += eff.attackDamage
        if (eff.attackSpeed) stats.attackSpeed += eff.attackSpeed
        if (eff.areaDamage) stats.areaDamage += eff.areaDamage
        if (eff.critRate) stats.critRate = Math.min(1, stats.critRate + eff.critRate)
        if (eff.critDamage) stats.critDamage += eff.critDamage
        if (eff.xpGain) stats.xpGain += eff.xpGain
        if (eff.auraRange) stats.auraRange += eff.auraRange
        if (eff.hp) { stats.maxHp += eff.hp; stats.hp = Math.min(stats.hp + eff.hp, stats.maxHp) }
        if (eff.defense) stats.defense += eff.defense
        if (eff.enemyDmgReduction) stats.enemyDmgReduction = Math.min(0.8, stats.enemyDmgReduction + eff.enemyDmgReduction)
        if (eff.enemySpeedReduction) stats.enemySpeedReduction = Math.min(0.7, stats.enemySpeedReduction + eff.enemySpeedReduction)
        if (eff.bossReduction) stats.bossReduction = Math.min(0.7, stats.bossReduction + eff.bossReduction)
        if (eff.fireLevel) stats.fireLevel = Math.min(5, stats.fireLevel + eff.fireLevel)
        if (eff.waterLevel) stats.waterLevel = Math.min(5, stats.waterLevel + eff.waterLevel)
        if (eff.earthLevel) stats.earthLevel = Math.min(5, stats.earthLevel + eff.earthLevel)
        if (eff.windLevel) stats.windLevel = Math.min(5, stats.windLevel + eff.windLevel)
        if (eff.lightningLevel) stats.lightningLevel = Math.min(5, stats.lightningLevel + eff.lightningLevel)
        if (eff.lightLevel) stats.lightLevel = Math.min(5, stats.lightLevel + eff.lightLevel)
        if (eff.darkLevel) stats.darkLevel = Math.min(5, stats.darkLevel + eff.darkLevel)
        if (eff.poisonLevel) stats.poisonLevel = Math.min(5, stats.poisonLevel + eff.poisonLevel)

        set({
          playerStats: stats,
          acquiredSkills: [...state.acquiredSkills, skill],
          phase: 'playing',
        })
      },

      takeDamage: (amount) => {
        const state = get()
        const stats = state.playerStats
        let dmg = amount * (1 - stats.defense) * (1 - stats.enemyDmgReduction)
        dmg = Math.max(1, Math.floor(dmg))
        const newHp = stats.hp - dmg
        if (newHp <= 0) {
          const hs = Math.max(state.highScore, state.score)
          const bs = Math.max(state.bestStage, state.stage)
          set({
            playerStats: { ...stats, hp: 0 },
            phase: 'gameover',
            highScore: hs,
            bestStage: bs,
          })
        } else {
          set({ playerStats: { ...stats, hp: newHp } })
        }
      },

      nextStage: () => {
        const state = get()
        set({ stage: state.stage + 1 })
      },

      addKill: (xp) => {
        const state = get()
        set({ killCount: state.killCount + 1, score: state.score + xp * 10 })
        get().gainXP(xp)
      },

      resetGame: () => {
        set({
          phase: 'menu',
          stage: 1,
          level: 1,
          xp: 0,
          xpRequired: 100,
          score: 0,
          killCount: 0,
          playerStats: { ...BASE_STATS },
          acquiredSkills: [],
        })
      },

      setWeapon: (weapon) => set({ selectedWeapon: weapon }),
    }),
    {
      name: 'cursor-survivor-save',
      partialize: (state) => ({ highScore: state.highScore, bestStage: state.bestStage }),
    }
  )
)
