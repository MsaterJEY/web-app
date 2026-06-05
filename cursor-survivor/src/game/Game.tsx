import React, { useEffect, useRef, useCallback, useState } from 'react'
import { useGameStore } from '../game/store'
import { EnemyData, updateEnemy } from '../enemy/Enemy'
import { spawnWave, spawnBoss, getStageEnemyCount, shouldSpawnBoss } from '../enemy/EnemySpawner'
import { applyWeaponHit, HitEffect } from '../player/CursorWeapon'
import { WEAPONS } from '../data/weapons'

interface XPOrb {
  id: string
  x: number
  y: number
  value: number
  vx: number
  vy: number
}

interface StageState {
  enemies: EnemyData[]
  boss: EnemyData | null
  xpOrbs: XPOrb[]
  hitEffects: HitEffect[]
  stageKills: number
  stageTotal: number
  bossSpawned: boolean
  bossKilled: boolean
  spawnQueue: number
  spawnTimer: number
  attackTimer: number
  damageTimer: number
  stageComplete: boolean
  stageCompleteTimer: number
}

let orbId = 0

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<StageState>({
    enemies: [], boss: null, xpOrbs: [], hitEffects: [],
    stageKills: 0, stageTotal: 0, bossSpawned: false, bossKilled: false,
    spawnQueue: 0, spawnTimer: 0, attackTimer: 0, damageTimer: 0,
    stageComplete: false, stageCompleteTimer: 0,
  })
  const mouseRef = useRef({ x: 400, y: 300 })
  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const bgStarsRef = useRef<{ x: number; y: number; r: number; speed: number }[]>([])

  const store = useGameStore()
  const storeRef = useRef(store)
  storeRef.current = store

  // Init stars
  useEffect(() => {
    bgStarsRef.current = Array.from({ length: 120 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.3 + 0.05,
    }))
  }, [])

  const initStage = useCallback((stage: number) => {
    const hasBoss = shouldSpawnBoss(stage)
    const count = getStageEnemyCount(stage)
    const spawnNow = Math.min(6, count)
    const w = window.innerWidth, h = window.innerHeight

    const initial = spawnWave({ stage, canvasWidth: w, canvasHeight: h }, spawnNow)

    stateRef.current = {
      enemies: initial,
      boss: null,
      xpOrbs: [],
      hitEffects: [],
      stageKills: 0,
      stageTotal: count,
      bossSpawned: !hasBoss,
      bossKilled: !hasBoss,
      spawnQueue: count - spawnNow,
      spawnTimer: 2.5,
      attackTimer: 0,
      damageTimer: 0,
      stageComplete: false,
      stageCompleteTimer: 0,
    }
  }, [])

  useEffect(() => {
    if (store.phase === 'playing') {
      initStage(store.stage)
    }
  }, [store.stage, store.phase])

  const drawCursor = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, weapon: string, auraRange: number) => {
    const w = WEAPONS[weapon as keyof typeof WEAPONS]
    const col = w.color
    const range = auraRange + w.range

    // Aura circle
    ctx.save()
    const grad = ctx.createRadialGradient(x, y, 0, x, y, range)
    grad.addColorStop(0, `${col}00`)
    grad.addColorStop(0.7, `${col}08`)
    grad.addColorStop(1, `${col}22`)
    ctx.beginPath()
    ctx.arc(x, y, range, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.strokeStyle = `${col}44`
    ctx.lineWidth = 1
    ctx.setLineDash([4, 6])
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()

    ctx.save()
    ctx.shadowColor = col
    ctx.shadowBlur = 16

    if (weapon === 'sword') {
      ctx.strokeStyle = col
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(x, y - 22)
      ctx.lineTo(x, y + 10)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x - 8, y - 2)
      ctx.lineTo(x + 8, y - 2)
      ctx.stroke()
      ctx.fillStyle = '#ffd700'
      ctx.beginPath()
      ctx.arc(x, y + 12, 4, 0, Math.PI * 2)
      ctx.fill()
    } else if (weapon === 'spear') {
      ctx.strokeStyle = col
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(x, y - 30)
      ctx.lineTo(x, y + 15)
      ctx.stroke()
      ctx.fillStyle = col
      ctx.beginPath()
      ctx.moveTo(x, y - 30)
      ctx.lineTo(x - 6, y - 14)
      ctx.lineTo(x + 6, y - 14)
      ctx.closePath()
      ctx.fill()
    } else if (weapon === 'wand') {
      ctx.strokeStyle = col
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(x + 15, y - 15)
      ctx.lineTo(x - 10, y + 10)
      ctx.stroke()
      ctx.fillStyle = '#e056fd'
      ctx.shadowColor = '#e056fd'
      ctx.shadowBlur = 20
      ctx.beginPath()
      ctx.arc(x + 16, y - 16, 6, 0, Math.PI * 2)
      ctx.fill()
      // Sparkles
      for (let i = 0; i < 3; i++) {
        const a = (Date.now() * 0.003 + i * 2.1) % (Math.PI * 2)
        ctx.fillStyle = '#e056fd'
        ctx.beginPath()
        ctx.arc(x + 16 + Math.cos(a) * 12, y - 16 + Math.sin(a) * 12, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    } else {
      ctx.strokeStyle = col
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(x, y, 12, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = col
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }, [])

  const drawEnemy = useCallback((ctx: CanvasRenderingContext2D, enemy: EnemyData) => {
    const { x, y, size, hp, maxHp, color, glowColor, isBoss, auraAngle, statuses, nameTH } = enemy

    ctx.save()
    ctx.shadowColor = glowColor
    ctx.shadowBlur = isBoss ? 30 : 14

    // Body
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    ctx.fill()

    // Eyes
    ctx.fillStyle = '#000'
    const eyeOff = size * 0.18
    ctx.beginPath(); ctx.arc(x - eyeOff, y - size * 0.1, size * 0.08, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x + eyeOff, y - size * 0.1, size * 0.08, 0, Math.PI * 2); ctx.fill()

    // Smile
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(x, y + size * 0.05, size * 0.15, 0.2, Math.PI - 0.2)
    ctx.stroke()

    // Boss aura
    if (isBoss && auraAngle !== undefined) {
      const numOrbs = 8
      for (let i = 0; i < numOrbs; i++) {
        const angle = ((auraAngle + i * (360 / numOrbs)) * Math.PI) / 180
        const orbX = x + Math.cos(angle) * (size / 2 + 20)
        const orbY = y + Math.sin(angle) * (size / 2 + 20)
        ctx.fillStyle = i % 2 === 0 ? '#fff' : '#000'
        ctx.shadowColor = i % 2 === 0 ? '#fff' : '#666'
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(orbX, orbY, 5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Status effects
    if (statuses.has('burning')) {
      ctx.fillStyle = '#ff450088'; ctx.shadowColor = '#ff4500'; ctx.shadowBlur = 12
      ctx.beginPath(); ctx.arc(x, y, size / 2 + 4, 0, Math.PI * 2); ctx.fill()
    }
    if (statuses.has('frozen')) {
      ctx.fillStyle = '#1e90ff44'; ctx.shadowColor = '#1e90ff'; ctx.shadowBlur = 8
      ctx.beginPath(); ctx.arc(x, y, size / 2 + 3, 0, Math.PI * 2); ctx.fill()
    }
    if (statuses.has('poisoned')) {
      ctx.fillStyle = '#32cd3244'; ctx.shadowColor = '#32cd32'; ctx.shadowBlur = 8
      ctx.beginPath(); ctx.arc(x, y, size / 2 + 3, 0, Math.PI * 2); ctx.fill()
    }

    ctx.restore()

    // HP bar
    const barW = size * 1.4
    const barX = x - barW / 2
    const barY = y - size / 2 - 10
    ctx.fillStyle = '#333'
    ctx.fillRect(barX, barY, barW, 4)
    const pct = hp / maxHp
    const hpCol = pct > 0.6 ? '#22c55e' : pct > 0.3 ? '#f59e0b' : '#ef4444'
    ctx.fillStyle = hpCol
    ctx.fillRect(barX, barY, barW * pct, 4)

    // Boss name
    if (isBoss) {
      ctx.fillStyle = '#ffd700'
      ctx.font = 'bold 10px Orbitron, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`👑 ${nameTH}`, x, barY - 4)
    }
  }, [])

  const drawXPOrb = useCallback((ctx: CanvasRenderingContext2D, orb: XPOrb) => {
    const t = Date.now() * 0.004
    const pulse = 1 + Math.sin(t + orb.id.charCodeAt(orb.id.length - 1)) * 0.15
    ctx.save()
    ctx.shadowColor = '#a855f7'
    ctx.shadowBlur = 10
    const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, 7 * pulse)
    grad.addColorStop(0, '#e879f9')
    grad.addColorStop(1, '#7c3aed')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(orb.x, orb.y, 6 * pulse, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }, [])

  const loop = useCallback((timestamp: number) => {
    if (lastTimeRef.current === 0) lastTimeRef.current = timestamp
    const delta = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05)
    lastTimeRef.current = timestamp

    const canvas = canvasRef.current
    if (!canvas) { animRef.current = requestAnimationFrame(loop); return }
    const ctx = canvas.getContext('2d')!

    const s = storeRef.current
    if (s.phase !== 'playing') { animRef.current = requestAnimationFrame(loop); return }

    const W = canvas.width, H = canvas.height
    const mx = mouseRef.current.x, my = mouseRef.current.y
    const st = stateRef.current

    // ─── Background ───
    ctx.fillStyle = '#050510'
    ctx.fillRect(0, 0, W, H)

    // Stars
    bgStarsRef.current.forEach(star => {
      star.y += star.speed
      if (star.y > H) star.y = 0
      ctx.fillStyle = `rgba(255,255,255,${0.2 + star.r * 0.2})`
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2)
      ctx.fill()
    })

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.lineWidth = 1
    for (let gx = 0; gx < W; gx += 60) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke() }
    for (let gy = 0; gy < H; gy += 60) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke() }

    // ─── Spawn logic ───
    st.spawnTimer -= delta
    if (st.spawnTimer <= 0 && st.spawnQueue > 0) {
      const batch = Math.min(3, st.spawnQueue)
      const newEnemies = spawnWave({ stage: s.stage, canvasWidth: W, canvasHeight: H }, batch)
      st.enemies.push(...newEnemies)
      st.spawnQueue -= batch
      st.spawnTimer = Math.max(0.5, 2.0 - s.stage * 0.07)
    }

    // Spawn boss after regular enemies
    if (!st.bossSpawned && st.spawnQueue === 0 && st.enemies.length < 3) {
      st.boss = spawnBoss({ stage: s.stage, canvasWidth: W, canvasHeight: H })
      st.bossSpawned = true
    }

    // ─── Update enemies ───
    const playerStats = s.playerStats
    st.enemies = st.enemies.map(e => updateEnemy(e, mx, my, delta, playerStats.enemySpeedReduction))
    if (st.boss) st.boss = updateEnemy(st.boss, mx, my, delta, playerStats.enemySpeedReduction)

    // ─── Weapon attack ───
    st.attackTimer -= delta
    if (st.attackTimer <= 0) {
      st.attackTimer = 1 / (0.5 * playerStats.attackSpeed)
      const allTargets = [...st.enemies, ...(st.boss ? [st.boss] : [])]
      const { updatedEnemies, results, effects } = applyWeaponHit(
        s.selectedWeapon, mx, my, allTargets, playerStats, playerStats.auraRange
      )

      st.hitEffects.push(...effects)

      let killed = 0
      let xpGained = 0
      let bossKilled = false

      for (const r of results) {
        if (r.killed) {
          killed++
          xpGained += r.xpGained
          if (st.boss && r.enemyId === st.boss.id) bossKilled = true

          // XP orb
          const deadEnemy = allTargets.find(e => e.id === r.enemyId)
          if (deadEnemy) {
            st.xpOrbs.push({
              id: `orb_${++orbId}`,
              x: deadEnemy.x + (Math.random() - 0.5) * 20,
              y: deadEnemy.y + (Math.random() - 0.5) * 20,
              value: r.xpGained,
              vx: (Math.random() - 0.5) * 60,
              vy: (Math.random() - 0.5) * 60,
            })

            // Light heal
            if (playerStats.lightLevel > 0) {
              const healAmt = playerStats.lightLevel * 3
              storeRef.current.takeDamage(-healAmt) // negative = heal trick
            }
          }
        }
      }

      if (bossKilled) {
        st.boss = null
        st.bossKilled = true
      }

      // Update enemies (remove boss if killed)
      const bossId = bossKilled && st.boss === null ? results.find(r => r.killed && st.bossSpawned)?.enemyId : null
      st.enemies = updatedEnemies.filter(e => !bossKilled || e.id !== bossId)

      st.stageKills += killed
      if (xpGained > 0) s.addKill(xpGained)
    }

    // ─── Burn/poison damage ───
    for (const e of st.enemies) {
      if (e.burnTimer > 0) e.hp -= playerStats.fireLevel * 3 * delta
      if (e.poisonTimer > 0) e.hp -= playerStats.poisonLevel * 2 * delta
    }
    st.enemies = st.enemies.filter(e => e.hp > 0)

    // ─── Enemy touches player ───
    st.damageTimer -= delta
    if (st.damageTimer <= 0) {
      st.damageTimer = 0.5
      const allE = [...st.enemies, ...(st.boss ? [st.boss] : [])]
      for (const e of allE) {
        const dx = e.x - mx, dy = e.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < e.size / 2 + 20) {
          s.takeDamage(e.damage)
          break
        }
      }
    }

    // ─── XP orbs float to cursor ───
    st.xpOrbs = st.xpOrbs.filter(orb => {
      const dx = mx - orb.x, dy = my - orb.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 30) return false
      orb.vx += dx * 3 * delta
      orb.vy += dy * 3 * delta
      orb.x += orb.vx * delta
      orb.y += orb.vy * delta
      return true
    })

    // ─── Draw ───
    st.xpOrbs.forEach(orb => drawXPOrb(ctx, orb))
    st.enemies.forEach(e => drawEnemy(ctx, e))
    if (st.boss) drawEnemy(ctx, st.boss)

    // Hit effects
    st.hitEffects = st.hitEffects.filter(eff => {
      const age = (eff as any).age ?? 0
      ;(eff as any).age = age + delta
      const alpha = 1 - age * 2.5
      if (alpha <= 0) return false

      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = eff.isCrit ? '#ffd700' : '#fff'
      ctx.shadowColor = eff.isCrit ? '#ffd700' : '#ffffff'
      ctx.shadowBlur = 8
      ctx.font = `${eff.isCrit ? 'bold 16px' : '12px'} Orbitron, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(`${eff.isCrit ? '★ ' : ''}${eff.damage}`, eff.x, eff.y - age * 40)
      ctx.restore()
      return true
    })

    // Cursor
    drawCursor(ctx, mx, my, s.selectedWeapon, playerStats.auraRange)

    // Stage complete check
    if (!st.stageComplete && st.stageKills >= st.stageTotal && st.bossKilled && st.spawnQueue === 0) {
      st.stageComplete = true
      st.stageCompleteTimer = 2
    }
    if (st.stageComplete) {
      st.stageCompleteTimer -= delta
      ctx.save()
      ctx.globalAlpha = Math.min(1, 3 - st.stageCompleteTimer * 1.5)
      ctx.fillStyle = '#ffd700'
      ctx.shadowColor = '#ffd700'
      ctx.shadowBlur = 20
      ctx.font = 'bold 28px "Press Start 2P", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`STAGE ${s.stage} CLEAR!`, W / 2, H / 2)
      ctx.restore()

      if (st.stageCompleteTimer <= 0) {
        s.nextStage()
      }
    }

    animRef.current = requestAnimationFrame(loop)
  }, [drawCursor, drawEnemy, drawXPOrb])

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY } }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p') {
        const phase = storeRef.current.phase
        if (phase === 'playing') storeRef.current.setPhase('paused')
        else if (phase === 'paused') storeRef.current.setPhase('playing')
      }
    }
    window.addEventListener('mousemove', handleMouse)
    window.addEventListener('keydown', handleKey)
    return () => { window.removeEventListener('mousemove', handleMouse); window.removeEventListener('keydown', handleKey) }
  }, [])

  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth
        canvasRef.current.height = window.innerHeight
      }
    }
    resize()
    window.addEventListener('resize', resize)
    animRef.current = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [loop])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', cursor: 'none', position: 'fixed', inset: 0 }}
    />
  )
}
