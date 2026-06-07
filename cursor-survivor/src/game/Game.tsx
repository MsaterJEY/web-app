import React, { useEffect, useRef, useCallback } from 'react'
import { useGameStore, PlayerStats } from '../game/store'
import { EnemyData, updateEnemy } from '../enemy/Enemy'
import { spawnWave, spawnBoss, getStageEnemyCount, shouldSpawnBoss } from '../enemy/EnemySpawner'
import { applyWeaponHit, HitEffect } from '../player/CursorWeapon'
import { WEAPONS } from '../data/weapons'
import { soundManager } from './SoundManager'

// ─── Types ───────────────────────────────────────────────
interface XPOrb { id: string; x: number; y: number; value: number; vx: number; vy: number }

interface SwordSlash {
  id: string; x: number; y: number
  angle: number; radius: number
  age: number; maxAge: number
}

interface SpearStab {
  id: string
  startX: number; startY: number
  endX: number; endY: number
  age: number; maxAge: number
  hit: boolean
}

interface MagicBullet {
  id: string; x: number; y: number
  vx: number; vy: number
  element: string; color: string
  age: number; maxAge: number
  radius: number
}

interface StageState {
  enemies: EnemyData[]
  boss: EnemyData | null
  xpOrbs: XPOrb[]
  hitEffects: HitEffect[]
  swordSlashes: SwordSlash[]
  spearStabs: SpearStab[]
  magicBullets: MagicBullet[]
  stageKills: number; stageTotal: number
  bossSpawned: boolean; bossKilled: boolean
  spawnQueue: number; spawnTimer: number
  attackTimer: number; damageTimer: number
  stageComplete: boolean; stageCompleteTimer: number
  lastAttackAngle: number
}

let uid = 0
const nid = () => `e${++uid}`

// ─── Element bullet color ─────────────────────────────────
function getElementColor(stats: PlayerStats): string {
  if (stats.fireLevel > 0) return '#ff4500'
  if (stats.waterLevel > 0) return '#1e90ff'
  if (stats.lightningLevel > 0) return '#ffd700'
  if (stats.poisonLevel > 0) return '#32cd32'
  if (stats.windLevel > 0) return '#98fb98'
  if (stats.darkLevel > 0) return '#9b30ff'
  if (stats.lightLevel > 0) return '#fffacd'
  if (stats.earthLevel > 0) return '#8B4513'
  return '#e056fd'
}

function getElementName(stats: PlayerStats): string {
  if (stats.fireLevel > 0) return 'fire'
  if (stats.waterLevel > 0) return 'water'
  if (stats.lightningLevel > 0) return 'lightning'
  if (stats.poisonLevel > 0) return 'poison'
  if (stats.windLevel > 0) return 'wind'
  if (stats.darkLevel > 0) return 'dark'
  if (stats.lightLevel > 0) return 'light'
  if (stats.earthLevel > 0) return 'earth'
  return 'none'
}

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<StageState>({
    enemies: [], boss: null, xpOrbs: [], hitEffects: [],
    swordSlashes: [], spearStabs: [], magicBullets: [],
    stageKills: 0, stageTotal: 0, bossSpawned: false, bossKilled: false,
    spawnQueue: 0, spawnTimer: 0, attackTimer: 0, damageTimer: 0,
    stageComplete: false, stageCompleteTimer: 0, lastAttackAngle: 0,
  })
  const mouseRef = useRef({ x: 400, y: 300 })
  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const bgStarsRef = useRef<{ x: number; y: number; r: number; speed: number }[]>([])
  const prevMouseRef = useRef({ x: 400, y: 300 })

  const store = useGameStore()
  const storeRef = useRef(store)
  storeRef.current = store

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
      enemies: initial, boss: null, xpOrbs: [], hitEffects: [],
      swordSlashes: [], spearStabs: [], magicBullets: [],
      stageKills: 0, stageTotal: count,
      bossSpawned: !hasBoss, bossKilled: !hasBoss,
      spawnQueue: count - spawnNow, spawnTimer: 2.5,
      attackTimer: 0, damageTimer: 0,
      stageComplete: false, stageCompleteTimer: 0, lastAttackAngle: 0,
    }
  }, [])

  useEffect(() => {
    if (store.phase === 'playing') initStage(store.stage)
  }, [store.stage, store.phase])

  // ─── Draw cursor ─────────────────────────────────────────
  const drawCursor = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    weapon: string, auraRange: number,
    elementColor: string
  ) => {
    const w = WEAPONS[weapon as keyof typeof WEAPONS]
    const col = weapon === 'wand' ? elementColor : w.color
    const range = auraRange + w.range

    // Aura
    ctx.save()
    const grad = ctx.createRadialGradient(x, y, 0, x, y, range)
    grad.addColorStop(0, `${col}00`)
    grad.addColorStop(0.7, `${col}08`)
    grad.addColorStop(1, `${col}22`)
    ctx.beginPath(); ctx.arc(x, y, range, 0, Math.PI * 2)
    ctx.fillStyle = grad; ctx.fill()
    ctx.strokeStyle = `${col}44`; ctx.lineWidth = 1
    ctx.setLineDash([4, 6]); ctx.stroke(); ctx.setLineDash([])
    ctx.restore()

    ctx.save()
    ctx.shadowColor = col; ctx.shadowBlur = 16

    if (weapon === 'sword') {
      ctx.strokeStyle = col; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x, y + 10); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x - 8, y - 2); ctx.lineTo(x + 8, y - 2); ctx.stroke()
      ctx.fillStyle = '#ffd700'
      ctx.beginPath(); ctx.arc(x, y + 12, 4, 0, Math.PI * 2); ctx.fill()
    } else if (weapon === 'spear') {
      ctx.strokeStyle = col; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.lineTo(x, y + 15); ctx.stroke()
      ctx.fillStyle = col
      ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.lineTo(x - 6, y - 14); ctx.lineTo(x + 6, y - 14)
      ctx.closePath(); ctx.fill()
    } else if (weapon === 'wand') {
      ctx.strokeStyle = col; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.moveTo(x + 15, y - 15); ctx.lineTo(x - 10, y + 10); ctx.stroke()
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 20
      ctx.beginPath(); ctx.arc(x + 16, y - 16, 6, 0, Math.PI * 2); ctx.fill()
      for (let i = 0; i < 3; i++) {
        const a = (Date.now() * 0.003 + i * 2.1) % (Math.PI * 2)
        ctx.fillStyle = col
        ctx.beginPath()
        ctx.arc(x + 16 + Math.cos(a) * 12, y - 16 + Math.sin(a) * 12, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    } else {
      ctx.strokeStyle = col; ctx.lineWidth = 3
      ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.stroke()
      ctx.fillStyle = col
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
  }, [])

  // ─── Draw sword slash ─────────────────────────────────────
  const drawSwordSlash = useCallback((ctx: CanvasRenderingContext2D, slash: SwordSlash) => {
    const pct = slash.age / slash.maxAge
    const alpha = 1 - pct
    const radius = slash.radius * (0.5 + pct * 0.5)
    ctx.save()
    ctx.globalAlpha = alpha * 0.85
    ctx.strokeStyle = '#c0c0c0'
    ctx.shadowColor = '#ffffff'
    ctx.shadowBlur = 12
    ctx.lineWidth = 4 - pct * 2
    ctx.beginPath()
    ctx.arc(slash.x, slash.y, radius, slash.angle - 0.8, slash.angle + 0.8)
    ctx.stroke()
    // Inner bright
    ctx.globalAlpha = alpha * 0.5
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(slash.x, slash.y, radius * 0.85, slash.angle - 0.6, slash.angle + 0.6)
    ctx.stroke()
    ctx.restore()
  }, [])

  // ─── Draw spear stab ─────────────────────────────────────
  const drawSpearStab = useCallback((ctx: CanvasRenderingContext2D, stab: SpearStab) => {
    const pct = stab.age / stab.maxAge
    const alpha = pct < 0.4 ? pct / 0.4 : 1 - (pct - 0.4) / 0.6
    const progress = pct < 0.5 ? pct / 0.5 : 1
    const cx = stab.startX + (stab.endX - stab.startX) * progress
    const cy = stab.startY + (stab.endY - stab.startY) * progress
    const len = 55

    const dx = stab.endX - stab.startX
    const dy = stab.endY - stab.startY
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const nx = dx / dist, ny = dy / dist

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.strokeStyle = '#8B6914'
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 10
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(cx - nx * len * 0.3, cy - ny * len * 0.3)
    ctx.lineTo(cx + nx * len * 0.7, cy + ny * len * 0.7)
    ctx.stroke()
    // Tip
    ctx.fillStyle = '#c0c0c0'
    ctx.shadowColor = '#ffffff'
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.moveTo(cx + nx * len * 0.7, cy + ny * len * 0.7)
    ctx.lineTo(cx + nx * len * 0.7 - ny * 5, cy + ny * len * 0.7 + nx * 5)
    ctx.lineTo(cx + nx * (len * 0.7 + 14), cy + ny * (len * 0.7 + 14))
    ctx.lineTo(cx + nx * len * 0.7 + ny * 5, cy + ny * len * 0.7 - nx * 5)
    ctx.closePath(); ctx.fill()
    // Trail
    if (pct < 0.5) {
      ctx.globalAlpha = alpha * 0.3
      ctx.strokeStyle = '#ffd700'
      ctx.lineWidth = 8
      ctx.beginPath()
      ctx.moveTo(stab.startX, stab.startY)
      ctx.lineTo(cx, cy)
      ctx.stroke()
    }
    ctx.restore()
  }, [])

  // ─── Draw magic bullet ───────────────────────────────────
  const drawMagicBullet = useCallback((ctx: CanvasRenderingContext2D, b: MagicBullet) => {
    const pct = b.age / b.maxAge
    const alpha = pct < 0.15 ? pct / 0.15 : 1 - pct * 0.4
    ctx.save()
    ctx.globalAlpha = Math.max(0, alpha)
    // Glow
    const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 2.5)
    grd.addColorStop(0, b.color + 'ff')
    grd.addColorStop(0.5, b.color + '88')
    grd.addColorStop(1, b.color + '00')
    ctx.fillStyle = grd
    ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 2.5, 0, Math.PI * 2); ctx.fill()
    // Core
    ctx.shadowColor = b.color; ctx.shadowBlur = 14
    ctx.fillStyle = '#ffffff'
    ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 0.5, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = b.color
    ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill()
    // Trail
    ctx.globalAlpha = alpha * 0.25
    ctx.strokeStyle = b.color
    ctx.lineWidth = b.radius * 1.2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(b.x - b.vx * 0.06, b.y - b.vy * 0.06)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
    ctx.restore()
  }, [])

  // ─── Draw enemy ───────────────────────────────────────────
  const drawEnemy = useCallback((ctx: CanvasRenderingContext2D, enemy: EnemyData) => {
    const { x, y, size, hp, maxHp, color, glowColor, isBoss, auraAngle, statuses, nameTH } = enemy
    ctx.save()
    ctx.shadowColor = glowColor
    ctx.shadowBlur = isBoss ? 30 : 14
    ctx.fillStyle = color
    ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#000'
    const eyeOff = size * 0.18
    ctx.beginPath(); ctx.arc(x - eyeOff, y - size * 0.1, size * 0.08, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x + eyeOff, y - size * 0.1, size * 0.08, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(x, y + size * 0.05, size * 0.15, 0.2, Math.PI - 0.2); ctx.stroke()
    if (isBoss && auraAngle !== undefined) {
      for (let i = 0; i < 8; i++) {
        const angle = ((auraAngle + i * 45) * Math.PI) / 180
        const ox = x + Math.cos(angle) * (size / 2 + 20)
        const oy = y + Math.sin(angle) * (size / 2 + 20)
        ctx.fillStyle = i % 2 === 0 ? '#fff' : '#000'
        ctx.shadowColor = i % 2 === 0 ? '#fff' : '#666'; ctx.shadowBlur = 8
        ctx.beginPath(); ctx.arc(ox, oy, 5, 0, Math.PI * 2); ctx.fill()
      }
    }
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
    const barW = size * 1.4
    const barX = x - barW / 2, barY = y - size / 2 - 10
    ctx.fillStyle = '#333'; ctx.fillRect(barX, barY, barW, 4)
    const pct = hp / maxHp
    ctx.fillStyle = pct > 0.6 ? '#22c55e' : pct > 0.3 ? '#f59e0b' : '#ef4444'
    ctx.fillRect(barX, barY, barW * pct, 4)
    if (isBoss) {
      ctx.fillStyle = '#ffd700'
      ctx.font = 'bold 10px Orbitron, sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(`👑 ${nameTH}`, x, barY - 4)
    }
  }, [])

  const drawXPOrb = useCallback((ctx: CanvasRenderingContext2D, orb: XPOrb) => {
    const pulse = 1 + Math.sin(Date.now() * 0.004 + orb.id.charCodeAt(orb.id.length - 1)) * 0.15
    ctx.save()
    ctx.shadowColor = '#a855f7'; ctx.shadowBlur = 10
    const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, 7 * pulse)
    grad.addColorStop(0, '#e879f9'); grad.addColorStop(1, '#7c3aed')
    ctx.fillStyle = grad
    ctx.beginPath(); ctx.arc(orb.x, orb.y, 6 * pulse, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  }, [])

  // ─── Main loop ────────────────────────────────────────────
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
    const playerStats = s.playerStats
    const weapon = s.selectedWeapon
    const elementColor = getElementColor(playerStats)
    const elementName = getElementName(playerStats)

    // ── Background ──
    ctx.fillStyle = '#050510'; ctx.fillRect(0, 0, W, H)
    bgStarsRef.current.forEach(star => {
      star.y += star.speed; if (star.y > H) star.y = 0
      ctx.fillStyle = `rgba(255,255,255,${0.2 + star.r * 0.2})`
      ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2); ctx.fill()
    })
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1
    for (let gx = 0; gx < W; gx += 60) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke() }
    for (let gy = 0; gy < H; gy += 60) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke() }

    // ── Spawn ──
    st.spawnTimer -= delta
    if (st.spawnTimer <= 0 && st.spawnQueue > 0) {
      const batch = Math.min(3, st.spawnQueue)
      st.enemies.push(...spawnWave({ stage: s.stage, canvasWidth: W, canvasHeight: H }, batch))
      st.spawnQueue -= batch
      st.spawnTimer = Math.max(0.5, 2.0 - s.stage * 0.07)
    }
    if (!st.bossSpawned && st.spawnQueue === 0 && st.enemies.length < 3) {
      st.boss = spawnBoss({ stage: s.stage, canvasWidth: W, canvasHeight: H })
      st.bossSpawned = true
    }

    // ── Update enemies ──
    st.enemies = st.enemies.map(e => updateEnemy(e, mx, my, delta, playerStats.enemySpeedReduction))
    if (st.boss) st.boss = updateEnemy(st.boss, mx, my, delta, playerStats.enemySpeedReduction)

    // ── Attack ──
    st.attackTimer -= delta
    if (st.attackTimer <= 0) {
      st.attackTimer = 1 / (0.5 * playerStats.attackSpeed)
      const allTargets = [...st.enemies, ...(st.boss ? [st.boss] : [])]

      if (weapon === 'sword') {
        // Find nearest enemy for slash angle
        let nearestDist = Infinity, nearestAngle = st.lastAttackAngle + Math.PI * 0.7
        for (const e of allTargets) {
          const dx = e.x - mx, dy = e.y - my
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < nearestDist) { nearestDist = d; nearestAngle = Math.atan2(dy, dx) }
        }
        st.lastAttackAngle = nearestAngle
        const range = playerStats.auraRange + WEAPONS.sword.range
        st.swordSlashes.push({ id: nid(), x: mx, y: my, angle: nearestAngle, radius: range * 0.7, age: 0, maxAge: 0.22 })
        soundManager.swordSwing()

        const { updatedEnemies, results, effects } = applyWeaponHit('sword', mx, my, allTargets, playerStats, playerStats.auraRange)
        handleResults(results, effects, allTargets, st, s, updatedEnemies, playerStats)

      } else if (weapon === 'spear') {
        // Stab toward nearest enemy
        let tx = mx, ty = my - 120
        let nearestDist = Infinity
        for (const e of allTargets) {
          const dx = e.x - mx, dy = e.y - my
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < nearestDist) { nearestDist = d; tx = e.x; ty = e.y }
        }
        const range = playerStats.auraRange + WEAPONS.spear.range
        const dx = tx - mx, dy = ty - my
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const ex = mx + (dx / dist) * range
        const ey = my + (dy / dist) * range
        st.spearStabs.push({ id: nid(), startX: mx, startY: my, endX: ex, endY: ey, age: 0, maxAge: 0.28, hit: false })
        soundManager.spearThrust()

        const { updatedEnemies, results, effects } = applyWeaponHit('spear', mx, my, allTargets, playerStats, playerStats.auraRange)
        handleResults(results, effects, allTargets, st, s, updatedEnemies, playerStats)

      } else if (weapon === 'wand') {
        // Shoot bullet toward nearest enemy
        let bvx = 0, bvy = -300
        let nearestDist = Infinity
        for (const e of allTargets) {
          const dx = e.x - mx, dy = e.y - my
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < nearestDist) { nearestDist = d; bvx = dx; bvy = dy }
        }
        const bmag = Math.sqrt(bvx * bvx + bvy * bvy) || 1
        const speed = 380 + playerStats.attackSpeed * 60
        st.magicBullets.push({
          id: nid(), x: mx + 16, y: my - 16,
          vx: (bvx / bmag) * speed, vy: (bvy / bmag) * speed,
          element: elementName, color: elementColor,
          age: 0, maxAge: 1.4, radius: 9,
        })
        soundManager.wandShoot()

      } else {
        const { updatedEnemies, results, effects } = applyWeaponHit(weapon, mx, my, allTargets, playerStats, playerStats.auraRange)
        handleResults(results, effects, allTargets, st, s, updatedEnemies, playerStats)
      }
    }

    // ── Update magic bullets ──
    const newBullets: typeof st.magicBullets = []
    for (const b of st.magicBullets) {
      b.x += b.vx * delta; b.y += b.vy * delta; b.age += delta
      if (b.age >= b.maxAge || b.x < -50 || b.x > W + 50 || b.y < -50 || b.y > H + 50) continue
      // Check hit
      const allTargets = [...st.enemies, ...(st.boss ? [st.boss] : [])]
      let hit = false
      for (const e of allTargets) {
        const dx = b.x - e.x, dy = b.y - e.y
        if (Math.sqrt(dx * dx + dy * dy) < b.radius + e.size / 2) {
          const { updatedEnemies, results, effects } = applyWeaponHit('wand', b.x, b.y, [e], playerStats, 0)
          handleResults(results, effects, [e], st, s, updatedEnemies, playerStats)
          soundManager.wandHit()
          hit = true
          // AOE burst
          st.hitEffects.push({ x: b.x, y: b.y, damage: 0, isCrit: false, color: b.color, id: nid() });
          (st.hitEffects[st.hitEffects.length - 1] as any).isExplosion = true;
          (st.hitEffects[st.hitEffects.length - 1] as any).explosionColor = b.color
          break
        }
      }
      if (!hit) newBullets.push(b)
    }
    st.magicBullets = newBullets

    // ── Burn/poison DoT ──
    for (const e of st.enemies) {
      if (e.burnTimer > 0) e.hp -= playerStats.fireLevel * 3 * delta
      if (e.poisonTimer > 0) e.hp -= playerStats.poisonLevel * 2 * delta
    }
    st.enemies = st.enemies.filter(e => e.hp > 0)

    // ── Enemy contact damage ──
    st.damageTimer -= delta
    if (st.damageTimer <= 0) {
      st.damageTimer = 0.5
      const allE = [...st.enemies, ...(st.boss ? [st.boss] : [])]
      for (const e of allE) {
        const dx = e.x - mx, dy = e.y - my
        if (Math.sqrt(dx * dx + dy * dy) < e.size / 2 + 20) {
          s.takeDamage(e.damage)
          break
        }
      }
    }

    // ── XP orbs ──
    st.xpOrbs = st.xpOrbs.filter(orb => {
      const dx = mx - orb.x, dy = my - orb.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 30) { soundManager.xpPickup(); return false }
      orb.vx += dx * 3 * delta; orb.vy += dy * 3 * delta
      orb.x += orb.vx * delta; orb.y += orb.vy * delta
      return true
    })

    // ── Draw layers ──
    st.xpOrbs.forEach(orb => drawXPOrb(ctx, orb))
    st.enemies.forEach(e => drawEnemy(ctx, e))
    if (st.boss) drawEnemy(ctx, st.boss)

    // Sword slashes
    st.swordSlashes = st.swordSlashes.filter(sl => {
      sl.age += delta
      if (sl.age >= sl.maxAge) return false
      drawSwordSlash(ctx, sl)
      return true
    })

    // Spear stabs
    st.spearStabs = st.spearStabs.filter(stab => {
      stab.age += delta
      if (stab.age >= stab.maxAge) return false
      drawSpearStab(ctx, stab)
      return true
    })

    // Magic bullets
    st.magicBullets.forEach(b => drawMagicBullet(ctx, b))

    // Hit effects & damage numbers
    st.hitEffects = st.hitEffects.filter(eff => {
      const age = (eff as any).age ?? 0
      ;(eff as any).age = age + delta
      const alpha = 1 - age * 2.5
      if (alpha <= 0) return false

      if ((eff as any).isExplosion) {
        const ec = (eff as any).explosionColor
        const r = age * 120
        ctx.save(); ctx.globalAlpha = alpha * 0.6
        ctx.strokeStyle = ec; ctx.shadowColor = ec; ctx.shadowBlur = 12
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(eff.x, eff.y, r, 0, Math.PI * 2); ctx.stroke()
        ctx.restore()
        return true
      }

      ctx.save(); ctx.globalAlpha = alpha
      ctx.fillStyle = eff.isCrit ? '#ffd700' : '#fff'
      ctx.shadowColor = eff.isCrit ? '#ffd700' : '#ffffff'; ctx.shadowBlur = 8
      ctx.font = `${eff.isCrit ? 'bold 16px' : '12px'} Orbitron, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(`${eff.isCrit ? '★ ' : ''}${eff.damage}`, eff.x, eff.y - age * 40)
      ctx.restore()
      return true
    })

    drawCursor(ctx, mx, my, weapon, playerStats.auraRange, elementColor)

    // Stage complete
    if (!st.stageComplete && st.stageKills >= st.stageTotal && st.bossKilled && st.spawnQueue === 0) {
      st.stageComplete = true; st.stageCompleteTimer = 2
      soundManager.stageClear()
    }
    if (st.stageComplete) {
      st.stageCompleteTimer -= delta
      ctx.save()
      ctx.globalAlpha = Math.min(1, 3 - st.stageCompleteTimer * 1.5)
      ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 20
      ctx.font = 'bold 28px "Press Start 2P", monospace'; ctx.textAlign = 'center'
      ctx.fillText(`STAGE ${s.stage} CLEAR!`, W / 2, H / 2)
      ctx.restore()
      if (st.stageCompleteTimer <= 0) s.nextStage()
    }

    prevMouseRef.current = { x: mx, y: my }
    animRef.current = requestAnimationFrame(loop)
  }, [drawCursor, drawEnemy, drawXPOrb, drawSwordSlash, drawSpearStab, drawMagicBullet])

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY } }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p') {
        const phase = storeRef.current.phase
        if (phase === 'playing') { storeRef.current.setPhase('paused'); soundManager.pauseGame() }
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
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animRef.current) }
  }, [loop])

  return <canvas ref={canvasRef} style={{ display: 'block', cursor: 'none', position: 'fixed', inset: 0 }} />
}

// ─── Helper: handle attack results ───────────────────────
interface HandleResultsStore {
  healPlayer: (amt: number) => void
  addKill: (xp: number) => void
}

function handleResults(
  results: { enemyId: string; damage: number; isCrit: boolean; killed: boolean; xpGained: number }[],
  effects: HitEffect[],
  allTargets: EnemyData[],
  st: StageState,
  s: HandleResultsStore,
  updatedEnemies: EnemyData[],
  playerStats: PlayerStats
) {
  st.hitEffects.push(...effects)
  let killed = 0, xpGained = 0, bossKilled = false
  let playedHitSound = false

  for (const r of results) {
    if (r.killed) {
      killed++; xpGained += r.xpGained
      if (st.boss && r.enemyId === st.boss.id) bossKilled = true
      const dead = allTargets.find(e => e.id === r.enemyId)
      if (dead) {
        let oid = 0
        st.xpOrbs.push({
          id: `orb_${++oid}_${Date.now()}`,
          x: dead.x + (Math.random() - 0.5) * 20,
          y: dead.y + (Math.random() - 0.5) * 20,
          value: r.xpGained,
          vx: (Math.random() - 0.5) * 60,
          vy: (Math.random() - 0.5) * 60,
        })
        if (playerStats.lightLevel > 0) s.healPlayer(playerStats.lightLevel * 3)
        if (dead.isBoss) soundManager.bossDie()
        else soundManager.enemyDie()
      }
    } else if (!playedHitSound && r.damage > 0) {
      playedHitSound = true
      const target = allTargets.find(e => e.id === r.enemyId)
      if (target?.isBoss) soundManager.bossHit()
      else soundManager.enemyHit()
    }
  }

  if (bossKilled) { st.boss = null; st.bossKilled = true }
  const bossDeadId = bossKilled ? results.find(r => r.killed && allTargets.find(e => e.id === r.enemyId)?.isBoss)?.enemyId : null
  st.enemies = updatedEnemies.filter(e => !bossDeadId || e.id !== bossDeadId)
  st.stageKills += killed
  if (xpGained > 0) s.addKill(xpGained)
}
