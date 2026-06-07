import React, { useEffect, useRef, useCallback } from 'react'
import { useGameStore, PlayerStats } from './store'
import { EnemyData, updateEnemy, BossElement, BOSS_ELEMENT_COLORS } from '../enemy/Enemy'
import { spawnWave, spawnBoss, getStageEnemyCount, shouldSpawnBoss } from '../enemy/EnemySpawner'
import { applyWeaponHit, HitEffect } from '../player/CursorWeapon'
import { WEAPONS } from '../data/weapons'
import { soundManager } from './SoundManager'
import { DevConsole } from '../ui/DevConsole'

// ─── Types ────────────────────────────────────────────────
interface XPOrb {
  id: string; x: number; y: number; value: number
  vx: number; vy: number
  orbType: 'normal' | 'elite' | 'boss'  // สีต่างกัน
}

interface SwordSlash { id: string; x: number; y: number; angle: number; radius: number; age: number; maxAge: number }
interface SpearStab  { id: string; startX: number; startY: number; endX: number; endY: number; age: number; maxAge: number }
interface MagicBullet { id: string; x: number; y: number; vx: number; vy: number; element: string; color: string; age: number; maxAge: number; radius: number }
interface BossProjectile { id: string; x: number; y: number; vx: number; vy: number; element: BossElement; color: string; age: number; pattern: 'straight' | 'spiral' | 'spread'; angle?: number }

interface StageState {
  enemies: EnemyData[]; boss: EnemyData | null
  xpOrbs: XPOrb[]; hitEffects: HitEffect[]
  swordSlashes: SwordSlash[]; spearStabs: SpearStab[]
  magicBullets: MagicBullet[]; bossProjectiles: BossProjectile[]
  stageKills: number; stageTotal: number
  bossSpawned: boolean; bossKilled: boolean
  spawnQueue: number; spawnTimer: number
  attackTimer: number; damageTimer: number
  stageComplete: boolean; stageCompleteTimer: number
  lastAttackAngle: number
  devKillAll: boolean
}

let uid = 0
const nid = () => `e${++uid}`

// ─── Helpers ──────────────────────────────────────────────
function getElementColor(stats: PlayerStats): string {
  if (stats.fireLevel > 0)      return '#ff4500'
  if (stats.waterLevel > 0)     return '#1e90ff'
  if (stats.lightningLevel > 0) return '#ffd700'
  if (stats.poisonLevel > 0)    return '#32cd32'
  if (stats.windLevel > 0)      return '#98fb98'
  if (stats.darkLevel > 0)      return '#9b30ff'
  if (stats.lightLevel > 0)     return '#fffacd'
  if (stats.earthLevel > 0)     return '#8B4513'
  return '#e056fd'
}
function getElementName(stats: PlayerStats): string {
  if (stats.fireLevel > 0)      return 'fire'
  if (stats.waterLevel > 0)     return 'water'
  if (stats.lightningLevel > 0) return 'lightning'
  if (stats.poisonLevel > 0)    return 'poison'
  if (stats.windLevel > 0)      return 'wind'
  if (stats.darkLevel > 0)      return 'dark'
  if (stats.lightLevel > 0)     return 'light'
  if (stats.earthLevel > 0)     return 'earth'
  return 'none'
}

// ─── isMobile ────────────────────────────────────────────
function isMobile() { return window.innerWidth < 768 || 'ontouchstart' in window }

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<StageState>({
    enemies: [], boss: null, xpOrbs: [], hitEffects: [],
    swordSlashes: [], spearStabs: [], magicBullets: [], bossProjectiles: [],
    stageKills: 0, stageTotal: 0, bossSpawned: false, bossKilled: false,
    spawnQueue: 0, spawnTimer: 0, attackTimer: 0, damageTimer: 0,
    stageComplete: false, stageCompleteTimer: 0, lastAttackAngle: 0,
    devKillAll: false,
  })
  const mouseRef = useRef({ x: 400, y: 300 })
  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const bgStarsRef = useRef<{ x: number; y: number; r: number; speed: number }[]>([])
  const mobile = useRef(false)

  const store = useGameStore()
  const storeRef = useRef(store)
  storeRef.current = store

  useEffect(() => {
    mobile.current = isMobile()
    bgStarsRef.current = Array.from({ length: 120 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3, speed: Math.random() * 0.3 + 0.05,
    }))
  }, [])

  const initStage = useCallback((stage: number) => {
    const hasBoss = shouldSpawnBoss(stage)
    const count = hasBoss ? 0 : getStageEnemyCount(stage) // Boss stage = boss only
    const spawnNow = hasBoss ? 0 : Math.min(5, count)
    const w = window.innerWidth, h = window.innerHeight
    const initial = spawnNow > 0 ? spawnWave({ stage, canvasWidth: w, canvasHeight: h }, spawnNow) : []
    stateRef.current = {
      enemies: initial, boss: null, xpOrbs: [], hitEffects: [],
      swordSlashes: [], spearStabs: [], magicBullets: [], bossProjectiles: [],
      stageKills: 0, stageTotal: hasBoss ? 1 : count,
      bossSpawned: !hasBoss, bossKilled: !hasBoss,
      spawnQueue: hasBoss ? 0 : count - spawnNow,
      spawnTimer: 2.0, attackTimer: 0, damageTimer: 0,
      stageComplete: false, stageCompleteTimer: 0, lastAttackAngle: 0,
      devKillAll: false,
    }
    // Spawn boss immediately on boss stages
    if (hasBoss) {
      stateRef.current.boss = spawnBoss({ stage, canvasWidth: w, canvasHeight: h })
      stateRef.current.bossSpawned = true
    }
  }, [])

  useEffect(() => {
    if (store.phase === 'playing') initStage(store.stage)
  }, [store.stage, store.phase])

  // Mobile joystick state
  const joystickRef = useRef({ active: false, startX: 0, startY: 0, x: 0, y: 0 })

  // ─── Draw helpers ────────────────────────────────────────
  const drawCursor = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, weapon: string, auraRange: number, elementColor: string) => {
    const w = WEAPONS[weapon as keyof typeof WEAPONS]
    const col = weapon === 'wand' ? elementColor : w.color
    const range = auraRange + w.range

    ctx.save()
    const grad = ctx.createRadialGradient(x, y, 0, x, y, range)
    grad.addColorStop(0, `${col}00`); grad.addColorStop(0.7, `${col}08`); grad.addColorStop(1, `${col}22`)
    ctx.beginPath(); ctx.arc(x, y, range, 0, Math.PI * 2)
    ctx.fillStyle = grad; ctx.fill()
    ctx.strokeStyle = `${col}44`; ctx.lineWidth = 1; ctx.setLineDash([4, 6]); ctx.stroke(); ctx.setLineDash([])
    ctx.restore()

    ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 16
    if (weapon === 'sword') {
      ctx.strokeStyle = col; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x, y + 10); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x - 8, y - 2); ctx.lineTo(x + 8, y - 2); ctx.stroke()
      ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(x, y + 12, 4, 0, Math.PI * 2); ctx.fill()
    } else if (weapon === 'spear') {
      ctx.strokeStyle = col; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.lineTo(x, y + 15); ctx.stroke()
      ctx.fillStyle = col
      ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.lineTo(x - 6, y - 14); ctx.lineTo(x + 6, y - 14); ctx.closePath(); ctx.fill()
    } else if (weapon === 'wand') {
      ctx.strokeStyle = col; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.moveTo(x + 15, y - 15); ctx.lineTo(x - 10, y + 10); ctx.stroke()
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 20
      ctx.beginPath(); ctx.arc(x + 16, y - 16, 6, 0, Math.PI * 2); ctx.fill()
      for (let i = 0; i < 3; i++) {
        const a = (Date.now() * 0.003 + i * 2.1) % (Math.PI * 2)
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + 16 + Math.cos(a) * 12, y - 16 + Math.sin(a) * 12, 2, 0, Math.PI * 2); ctx.fill()
      }
    } else {
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.stroke()
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
  }, [])

  const drawSwordSlash = useCallback((ctx: CanvasRenderingContext2D, slash: SwordSlash) => {
    const pct = slash.age / slash.maxAge; const alpha = 1 - pct; const r = slash.radius * (0.5 + pct * 0.5)
    ctx.save(); ctx.globalAlpha = alpha * 0.9; ctx.strokeStyle = '#c0c0c0'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 12; ctx.lineWidth = 4 - pct * 2
    ctx.beginPath(); ctx.arc(slash.x, slash.y, r, slash.angle - 0.9, slash.angle + 0.9); ctx.stroke()
    ctx.globalAlpha = alpha * 0.5; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(slash.x, slash.y, r * 0.85, slash.angle - 0.7, slash.angle + 0.7); ctx.stroke()
    ctx.restore()
  }, [])

  const drawSpearStab = useCallback((ctx: CanvasRenderingContext2D, stab: SpearStab) => {
    const pct = stab.age / stab.maxAge
    const alpha = pct < 0.4 ? pct / 0.4 : 1 - (pct - 0.4) / 0.6
    const progress = Math.min(1, pct / 0.5)
    const cx = stab.startX + (stab.endX - stab.startX) * progress
    const cy = stab.startY + (stab.endY - stab.startY) * progress
    const len = 60
    const dx = stab.endX - stab.startX, dy = stab.endY - stab.startY
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const nx = dx / dist, ny = dy / dist
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = '#8B6914'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 10; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(cx - nx * len * 0.3, cy - ny * len * 0.3); ctx.lineTo(cx + nx * len * 0.7, cy + ny * len * 0.7); ctx.stroke()
    ctx.fillStyle = '#c0c0c0'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 8
    ctx.beginPath(); ctx.moveTo(cx + nx * len * 0.7, cy + ny * len * 0.7); ctx.lineTo(cx + nx * len * 0.7 - ny * 5, cy + ny * len * 0.7 + nx * 5); ctx.lineTo(cx + nx * (len * 0.7 + 14), cy + ny * (len * 0.7 + 14)); ctx.lineTo(cx + nx * len * 0.7 + ny * 5, cy + ny * len * 0.7 - nx * 5); ctx.closePath(); ctx.fill()
    if (pct < 0.5) { ctx.globalAlpha = alpha * 0.3; ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(stab.startX, stab.startY); ctx.lineTo(cx, cy); ctx.stroke() }
    ctx.restore()
  }, [])

  const drawMagicBullet = useCallback((ctx: CanvasRenderingContext2D, b: MagicBullet) => {
    const pct = b.age / b.maxAge; const alpha = Math.max(0, pct < 0.15 ? pct / 0.15 : 1 - pct * 0.4)
    ctx.save(); ctx.globalAlpha = alpha
    const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 2.5)
    grd.addColorStop(0, b.color + 'ff'); grd.addColorStop(0.5, b.color + '88'); grd.addColorStop(1, b.color + '00')
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 2.5, 0, Math.PI * 2); ctx.fill()
    ctx.shadowColor = b.color; ctx.shadowBlur = 14; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 0.5, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = alpha * 0.25; ctx.strokeStyle = b.color; ctx.lineWidth = b.radius * 1.2; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(b.x - b.vx * 0.06, b.y - b.vy * 0.06); ctx.lineTo(b.x, b.y); ctx.stroke()
    ctx.restore()
  }, [])

  const drawBossProjectile = useCallback((ctx: CanvasRenderingContext2D, p: BossProjectile) => {
    const alpha = Math.min(1, p.age * 5) * (1 - Math.max(0, p.age - 3) * 0.3)
    ctx.save(); ctx.globalAlpha = Math.max(0, alpha)
    // Warning pulse glow
    const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 14)
    grd.addColorStop(0, p.color + 'ee'); grd.addColorStop(0.6, p.color + '55'); grd.addColorStop(1, p.color + '00')
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.fill()
    ctx.shadowColor = p.color; ctx.shadowBlur = 16; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  }, [])

  const drawEnemy = useCallback((ctx: CanvasRenderingContext2D, enemy: EnemyData) => {
    const { x, y, size, hp, maxHp, color, glowColor, isBoss, isElite, auraAngle, statuses, nameTH, bossElement } = enemy
    ctx.save()
    ctx.shadowColor = glowColor; ctx.shadowBlur = isBoss ? 35 : isElite ? 20 : 12
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.fill()
    // Elite ring
    if (isElite) {
      ctx.strokeStyle = '#ff1493'; ctx.lineWidth = 2.5; ctx.shadowColor = '#ff1493'; ctx.shadowBlur = 12
      ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.arc(x, y, size / 2 + 5, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([])
    }
    ctx.fillStyle = '#000'; const eo = size * 0.18
    ctx.beginPath(); ctx.arc(x - eo, y - size * 0.1, size * 0.09, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x + eo, y - size * 0.1, size * 0.09, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y + size * 0.05, size * 0.15, 0.2, Math.PI - 0.2); ctx.stroke()
    // Boss aura
    if (isBoss && auraAngle !== undefined) {
      const bossCol = bossElement ? BOSS_ELEMENT_COLORS[bossElement] : '#fff'
      for (let i = 0; i < 10; i++) {
        const a = ((auraAngle + i * 36) * Math.PI) / 180
        const ox = x + Math.cos(a) * (size / 2 + 22), oy = y + Math.sin(a) * (size / 2 + 22)
        ctx.fillStyle = i % 2 === 0 ? '#fff' : bossCol; ctx.shadowColor = bossCol; ctx.shadowBlur = 10
        ctx.beginPath(); ctx.arc(ox, oy, 5, 0, Math.PI * 2); ctx.fill()
      }
      // Boss element label
      if (bossElement) {
        ctx.font = 'bold 11px Orbitron,sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = bossCol
        ctx.fillText(`⚡${bossElement.toUpperCase()}`, x, y - size / 2 - 28)
      }
    }
    // Status overlays
    if (statuses.has('burning'))  { ctx.fillStyle = '#ff450088'; ctx.shadowColor = '#ff4500'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(x, y, size / 2 + 4, 0, Math.PI * 2); ctx.fill() }
    if (statuses.has('frozen'))   { ctx.fillStyle = '#1e90ff44'; ctx.shadowColor = '#1e90ff'; ctx.shadowBlur = 8;  ctx.beginPath(); ctx.arc(x, y, size / 2 + 3, 0, Math.PI * 2); ctx.fill() }
    if (statuses.has('poisoned')) { ctx.fillStyle = '#32cd3244'; ctx.shadowColor = '#32cd32'; ctx.shadowBlur = 8;  ctx.beginPath(); ctx.arc(x, y, size / 2 + 3, 0, Math.PI * 2); ctx.fill() }
    ctx.restore()
    // HP bar
    const barW = size * 1.5, barX = x - barW / 2, barY = y - size / 2 - 12
    ctx.fillStyle = '#333'; ctx.fillRect(barX, barY, barW, 5)
    const pct = hp / maxHp; ctx.fillStyle = pct > 0.6 ? '#22c55e' : pct > 0.3 ? '#f59e0b' : '#ef4444'
    ctx.fillRect(barX, barY, barW * pct, 5)
    if (isBoss || isElite) {
      ctx.fillStyle = isBoss ? '#ffd700' : '#ff69b4'
      ctx.font = `bold ${isBoss ? 11 : 9}px Orbitron,sans-serif`; ctx.textAlign = 'center'
      ctx.fillText(nameTH, x, barY - 4)
    }
  }, [])

  const drawXPOrb = useCallback((ctx: CanvasRenderingContext2D, orb: XPOrb) => {
    const pulse = 1 + Math.sin(Date.now() * 0.005 + uid) * 0.15
    const colors = { normal: ['#4ade80', '#16a34a'], elite: ['#e879f9', '#7c3aed'], boss: ['#fca5a5', '#ef4444'] }
    const [c1, c2] = colors[orb.orbType]
    ctx.save(); ctx.shadowColor = c1; ctx.shadowBlur = 10
    const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, 7 * pulse)
    grad.addColorStop(0, c1); grad.addColorStop(1, c2)
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(orb.x, orb.y, 6 * pulse, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  }, [])

  // Mobile virtual joystick draw
  const drawJoystick = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number) => {
    if (!mobile.current) return
    const j = joystickRef.current
    if (!j.active) {
      // hint ring
      ctx.save(); ctx.globalAlpha = 0.15
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.arc(W * 0.15, H * 0.82, 42, 0, Math.PI * 2); ctx.stroke()
      ctx.restore()
      return
    }
    ctx.save(); ctx.globalAlpha = 0.45
    ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(j.startX, j.startY, 42, 0, Math.PI * 2); ctx.stroke()
    ctx.fillStyle = '#7c3aed'; ctx.beginPath(); ctx.arc(j.x, j.y, 20, 0, Math.PI * 2); ctx.fill()
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
    const stats = s.playerStats
    const weapon = s.selectedWeapon
    const elCol = getElementColor(stats)
    const elName = getElementName(stats)

    // ── Background ──
    ctx.fillStyle = '#050510'; ctx.fillRect(0, 0, W, H)
    bgStarsRef.current.forEach(star => {
      star.y += star.speed; if (star.y > H) star.y = 0
      ctx.fillStyle = `rgba(255,255,255,${0.2 + star.r * 0.2})`
      ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2); ctx.fill()
    })
    ctx.strokeStyle = 'rgba(255,255,255,0.025)'; ctx.lineWidth = 1
    for (let gx = 0; gx < W; gx += 60) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke() }
    for (let gy = 0; gy < H; gy += 60) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke() }

    // ── Dev kill all ──
    if (st.devKillAll) {
      st.devKillAll = false
      const allE = [...st.enemies, ...(st.boss ? [st.boss] : [])]
      for (const e of allE) { spawnXPOrb(st, e) }
      st.stageKills += st.enemies.length
      if (st.boss) { st.boss = null; st.bossKilled = true; st.stageKills++ }
      st.enemies = []
    }

    // ── Spawn ──
    st.spawnTimer -= delta
    if (st.spawnTimer <= 0 && st.spawnQueue > 0) {
      const batch = Math.min(3, st.spawnQueue)
      st.enemies.push(...spawnWave({ stage: s.stage, canvasWidth: W, canvasHeight: H }, batch))
      st.spawnQueue -= batch
      st.spawnTimer = Math.max(0.6, 2.2 - s.stage * 0.07)
    }

    // ── Update enemies ──
    st.enemies = st.enemies.map(e => updateEnemy(e, mx, my, delta, stats.enemySpeedReduction))
    if (st.boss) st.boss = updateEnemy(st.boss, mx, my, delta, stats.enemySpeedReduction)

    // ── Boss projectile fire ──
    if (st.boss && st.boss.projectileTimer !== undefined && st.boss.projectileTimer <= 0) {
      st.boss = { ...st.boss, projectileTimer: 3.0 - Math.min(2.0, s.stage * 0.1) }
      fireBossProjectiles(st, st.boss, mx, my)
    }

    // ── Update boss projectiles ──
    const aliveProj: BossProjectile[] = []
    for (const p of st.bossProjectiles) {
      p.x += p.vx * delta; p.y += p.vy * delta; p.age += delta
      if (p.pattern === 'spiral' && p.angle !== undefined) {
        p.angle += delta * 2.5
        p.vx = Math.cos(p.angle) * 200; p.vy = Math.sin(p.angle) * 200
      }
      if (p.age > 5 || p.x < -80 || p.x > W + 80 || p.y < -80 || p.y > H + 80) continue
      // Hit player
      const pdx = p.x - mx, pdy = p.y - my
      if (Math.sqrt(pdx * pdx + pdy * pdy) < 22) {
        s.takeDamage(st.boss?.damage ?? 15)
        continue
      }
      aliveProj.push(p)
    }
    st.bossProjectiles = aliveProj

    // ── Attack ──
    st.attackTimer -= delta
    if (st.attackTimer <= 0) {
      const atkInterval = 1 / (0.55 * stats.attackSpeed)
      st.attackTimer = atkInterval
      const allTargets = [...st.enemies, ...(st.boss ? [st.boss] : [])]

      if (weapon === 'sword') {
        // ── Sword: slash arc — damage enemies inside the arc zone ──
        let nearestAngle = st.lastAttackAngle + Math.PI * 0.7
        let nearestDist = Infinity
        for (const e of allTargets) {
          const dx = e.x - mx, dy = e.y - my
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < nearestDist) { nearestDist = d; nearestAngle = Math.atan2(dy, dx) }
        }
        st.lastAttackAngle = nearestAngle
        const slashRange = stats.auraRange + WEAPONS.sword.range
        const arcSpan = 0.9
        st.swordSlashes.push({ id: nid(), x: mx, y: my, angle: nearestAngle, radius: slashRange * 0.75, age: 0, maxAge: 0.22 })
        soundManager.swordSwing()

        // Only hit enemies inside the slash arc
        const arcTargets = allTargets.filter(e => {
          const dx = e.x - mx, dy = e.y - my
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > slashRange + e.size / 2) return false
          const angle = Math.atan2(dy, dx)
          let diff = Math.abs(angle - nearestAngle)
          if (diff > Math.PI) diff = Math.PI * 2 - diff
          return diff <= arcSpan
        })
        if (arcTargets.length > 0) {
          const { updatedEnemies, results, effects } = applyWeaponHit('sword', mx, my, arcTargets, stats, stats.auraRange)
          const otherEnemies = allTargets.filter(e => !arcTargets.find(t => t.id === e.id))
          handleResults(results, effects, arcTargets, st, s, [...updatedEnemies, ...otherEnemies.filter(e => !e.isBoss)], stats, arcTargets.some(e => e.isBoss) ? updatedEnemies : null, st.boss)
        }

      } else if (weapon === 'spear') {
        // ── Spear: pierce in a straight line ──
        let tx = mx, ty = my - 130; let nearestDist = Infinity
        for (const e of allTargets) {
          const dx = e.x - mx, dy = e.y - my; const d = Math.sqrt(dx * dx + dy * dy)
          if (d < nearestDist) { nearestDist = d; tx = e.x; ty = e.y }
        }
        const spearRange = stats.auraRange + WEAPONS.spear.range
        const sdx = tx - mx, sdy = ty - my, sdist = Math.sqrt(sdx * sdx + sdy * sdy) || 1
        const snx = sdx / sdist, sny = sdy / sdist
        const ex = mx + snx * spearRange, ey = my + sny * spearRange
        st.spearStabs.push({ id: nid(), startX: mx, startY: my, endX: ex, endY: ey, age: 0, maxAge: 0.28 })
        soundManager.spearThrust()

        // Hit enemies along the line (rectangle check)
        const lineTargets = allTargets.filter(e => {
          const edx = e.x - mx, edy = e.y - my
          const proj = edx * snx + edy * sny  // projection on spear direction
          if (proj < 0 || proj > spearRange + e.size / 2) return false
          const perp = Math.abs(edx * sny - edy * snx) // perpendicular distance
          return perp < e.size / 2 + 14
        })
        if (lineTargets.length > 0) {
          const { updatedEnemies, results, effects } = applyWeaponHit('spear', mx, my, lineTargets, stats, stats.auraRange)
          const others = allTargets.filter(e => !lineTargets.find(t => t.id === e.id))
          handleResults(results, effects, lineTargets, st, s, [...updatedEnemies, ...others.filter(e => !e.isBoss)], stats, lineTargets.some(e => e.isBoss) ? updatedEnemies : null, st.boss)
        }

      } else if (weapon === 'wand') {
        // ── Wand: fire bullet toward nearest ──
        let bvx = 0, bvy = -300; let nearestDist = Infinity
        for (const e of allTargets) {
          const dx = e.x - mx, dy = e.y - my; const d = Math.sqrt(dx * dx + dy * dy)
          if (d < nearestDist) { nearestDist = d; bvx = dx; bvy = dy }
        }
        // Only shoot if enemy is within range
        const wandRange = stats.auraRange + WEAPONS.wand.range
        if (nearestDist <= wandRange || allTargets.length === 0) {
          const bmag = Math.sqrt(bvx * bvx + bvy * bvy) || 1
          const speed = 400 + stats.attackSpeed * 70
          st.magicBullets.push({
            id: nid(), x: mx + 16, y: my - 16,
            vx: (bvx / bmag) * speed, vy: (bvy / bmag) * speed,
            element: elName, color: elCol, age: 0, maxAge: 1.6, radius: 10,
          })
          soundManager.wandShoot()
        }

      } else {
        const { updatedEnemies, results, effects } = applyWeaponHit(weapon, mx, my, allTargets, stats, stats.auraRange)
        handleResults(results, effects, allTargets, st, s, updatedEnemies, stats, null, st.boss)
      }
    }

    // ── Magic bullets ──
    const newBullets: MagicBullet[] = []
    for (const b of st.magicBullets) {
      b.x += b.vx * delta; b.y += b.vy * delta; b.age += delta
      if (b.age >= b.maxAge || b.x < -60 || b.x > W + 60 || b.y < -60 || b.y > H + 60) continue
      const allT = [...st.enemies, ...(st.boss ? [st.boss] : [])]
      let hit = false
      for (const e of allT) {
        const dx = b.x - e.x, dy = b.y - e.y
        if (Math.sqrt(dx * dx + dy * dy) < b.radius + e.size / 2) {
          const { updatedEnemies, results, effects } = applyWeaponHit('wand', b.x, b.y, [e], stats, 0)
          // updatedEnemies มีแค่ตัวที่รอดจาก [e] — ต้อง merge กับศัตรูตัวอื่นที่ไม่ได้โดนยิง
          const otherEnemies = st.enemies.filter(o => o.id !== e.id)
          const mergedEnemies = [...otherEnemies, ...updatedEnemies.filter(u => !u.isBoss)]
          handleResults(results, effects, [e], st, s, mergedEnemies, stats, e.isBoss ? updatedEnemies : null, st.boss)
          soundManager.wandHit()
          const ef = { x: b.x, y: b.y, damage: 0, isCrit: false, color: b.color, id: nid() } as any
          ef.isExplosion = true; ef.explosionColor = b.color; st.hitEffects.push(ef)
          hit = true; break
        }
      }
      if (!hit) newBullets.push(b)
    }
    st.magicBullets = newBullets

    // ── DoT ──
    for (const e of st.enemies) {
      if (e.burnTimer > 0)   e.hp -= stats.fireLevel   * 3 * delta
      if (e.poisonTimer > 0) e.hp -= stats.poisonLevel * 2 * delta
    }
    st.enemies = st.enemies.filter(e => e.hp > 0)
    if (st.boss && st.boss.burnTimer > 0)   { const b = { ...st.boss }; b.hp -= stats.fireLevel * 3 * delta; st.boss = b.hp <= 0 ? null : b }
    if (st.boss && st.boss.poisonTimer > 0) { const b = { ...st.boss }; b.hp -= stats.poisonLevel * 2 * delta; st.boss = b.hp <= 0 ? null : b }

    // ── Contact damage ──
    st.damageTimer -= delta
    if (st.damageTimer <= 0) {
      st.damageTimer = 0.5
      for (const e of [...st.enemies, ...(st.boss ? [st.boss] : [])]) {
        const dx = e.x - mx, dy = e.y - my
        if (Math.sqrt(dx * dx + dy * dy) < e.size / 2 + 18) { s.takeDamage(e.damage); break }
      }
    }

    // ── XP orbs — collect by cursor ──
    st.xpOrbs = st.xpOrbs.filter(orb => {
      const dx = mx - orb.x, dy = my - orb.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 28) { soundManager.xpPickup(); return false }
      orb.vx += dx * 4 * delta; orb.vy += dy * 4 * delta
      orb.x += orb.vx * delta; orb.y += orb.vy * delta
      return true
    })

    // ── Draw ──
    st.xpOrbs.forEach(orb => drawXPOrb(ctx, orb))
    st.enemies.forEach(e => drawEnemy(ctx, e))
    if (st.boss) drawEnemy(ctx, st.boss)

    st.swordSlashes = st.swordSlashes.filter(sl => { sl.age += delta; if (sl.age >= sl.maxAge) return false; drawSwordSlash(ctx, sl); return true })
    st.spearStabs   = st.spearStabs.filter  (sb => { sb.age += delta; if (sb.age >= sb.maxAge) return false; drawSpearStab(ctx, sb);  return true })
    st.magicBullets.forEach(b => drawMagicBullet(ctx, b))
    st.bossProjectiles.forEach(p => drawBossProjectile(ctx, p))

    st.hitEffects = st.hitEffects.filter(eff => {
      const age = (eff as any).age ?? 0; (eff as any).age = age + delta
      const alpha = 1 - age * 2.5; if (alpha <= 0) return false
      if ((eff as any).isExplosion) {
        ctx.save(); ctx.globalAlpha = alpha * 0.6; ctx.strokeStyle = (eff as any).explosionColor; ctx.shadowColor = (eff as any).explosionColor; ctx.shadowBlur = 12; ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(eff.x, eff.y, age * 120, 0, Math.PI * 2); ctx.stroke(); ctx.restore()
        return true
      }
      ctx.save(); ctx.globalAlpha = alpha
      ctx.fillStyle = eff.isCrit ? '#ffd700' : '#fff'; ctx.shadowColor = eff.isCrit ? '#ffd700' : '#fff'; ctx.shadowBlur = 8
      ctx.font = `${eff.isCrit ? 'bold 16px' : '12px'} Orbitron,sans-serif`; ctx.textAlign = 'center'
      ctx.fillText(`${eff.isCrit ? '★ ' : ''}${eff.damage}`, eff.x, eff.y - age * 40)
      ctx.restore(); return true
    })

    drawCursor(ctx, mx, my, weapon, stats.auraRange, elCol)
    drawJoystick(ctx, W, H)

    // ── Pending XP bar (bottom) ──
    if (s.pendingXP > 0) {
      ctx.save(); ctx.globalAlpha = 0.7
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(W / 2 - 80, H - 24, 160, 14)
      ctx.fillStyle = '#4ade80'; ctx.fillRect(W / 2 - 80, H - 24, Math.min(160, (s.pendingXP / 50) * 2), 14)
      ctx.fillStyle = '#fff'; ctx.font = '9px Orbitron,sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(`+${s.pendingXP} XP pending`, W / 2, H - 13)
      ctx.restore()
    }

    // ── Stage complete ──
    if (!st.stageComplete && st.stageKills >= st.stageTotal && st.bossKilled && st.spawnQueue === 0 && st.enemies.length === 0) {
      st.stageComplete = true; st.stageCompleteTimer = 2.2; soundManager.stageClear()
    }
    if (st.stageComplete) {
      st.stageCompleteTimer -= delta
      ctx.save(); ctx.globalAlpha = Math.min(1, (2.2 - st.stageCompleteTimer) * 2)
      ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 20
      ctx.font = 'bold 28px "Press Start 2P",monospace'; ctx.textAlign = 'center'
      ctx.fillText(`STAGE ${s.stage} CLEAR!`, W / 2, H / 2)
      ctx.restore()
      if (st.stageCompleteTimer <= 0) s.nextStage()
    }

    animRef.current = requestAnimationFrame(loop)
  }, [drawCursor, drawEnemy, drawXPOrb, drawSwordSlash, drawSpearStab, drawMagicBullet, drawBossProjectile, drawJoystick])

  // ─── Event listeners ────────────────────────────────────
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY } }
    const handleKey = (e: KeyboardEvent) => {
      // ไม่ pause ถ้า DevConsole กำลังเปิดอยู่ (focus อยู่ที่ input ใน console)
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'Escape' || e.key === 'p') {
        const ph = storeRef.current.phase
        if (ph === 'playing') { storeRef.current.setPhase('paused'); soundManager.pauseGame() }
        else if (ph === 'paused') storeRef.current.setPhase('playing')
      }
    }
    window.addEventListener('mousemove', handleMouse)
    window.addEventListener('keydown', handleKey)
    return () => { window.removeEventListener('mousemove', handleMouse); window.removeEventListener('keydown', handleKey) }
  }, [])

  // Touch controls
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const t = e.touches[0]
      const W = canvas.width, H = canvas.height
      if (t.clientX < W * 0.4) {
        // Left = joystick
        joystickRef.current = { active: true, startX: t.clientX, startY: t.clientY, x: t.clientX, y: t.clientY }
      } else {
        // Right = aim / fire
        mouseRef.current = { x: t.clientX, y: t.clientY }
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i]; const W = canvas.width
        if (t.clientX < W * 0.4 && joystickRef.current.active) {
          const dx = t.clientX - joystickRef.current.startX
          const dy = t.clientY - joystickRef.current.startY
          const dist = Math.sqrt(dx * dx + dy * dy), maxR = 42
          const clampedX = joystickRef.current.startX + (dx / dist) * Math.min(dist, maxR)
          const clampedY = joystickRef.current.startY + (dy / dist) * Math.min(dist, maxR)
          joystickRef.current.x = clampedX; joystickRef.current.y = clampedY
          // Move cursor based on joystick
          const norm = Math.min(dist, maxR) / maxR
          mouseRef.current = {
            x: mouseRef.current.x + (dx / dist) * norm * 4,
            y: mouseRef.current.y + (dy / dist) * norm * 4,
          }
        } else {
          mouseRef.current = { x: t.clientX, y: t.clientY }
        }
      }
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) joystickRef.current.active = false
    }
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd, { passive: false })
    return () => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) { canvasRef.current.width = window.innerWidth; canvasRef.current.height = window.innerHeight }
      mobile.current = isMobile()
    }
    resize()
    window.addEventListener('resize', resize)
    animRef.current = requestAnimationFrame(loop)
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animRef.current) }
  }, [loop])

  const handleDevKillAll = () => { stateRef.current.devKillAll = true }
  const handleDevSpawnBoss = () => {
    const w = window.innerWidth, h = window.innerHeight
    const boss = spawnBoss({ stage: storeRef.current.stage, canvasWidth: w, canvasHeight: h })
    stateRef.current.boss = boss; stateRef.current.bossSpawned = true; stateRef.current.bossKilled = false
  }

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'block', cursor: 'none', position: 'fixed', inset: 0, touchAction: 'none' }} />
      {store.devMode && <DevConsole onKillAll={handleDevKillAll} onSpawnBoss={handleDevSpawnBoss} />}
    </>
  )
}

// ─── Spawn XP orb helper ─────────────────────────────────
function spawnXPOrb(st: StageState, enemy: EnemyData) {
  const orbType: XPOrb['orbType'] = enemy.isBoss ? 'boss' : enemy.isElite ? 'elite' : 'normal'
  st.xpOrbs.push({
    id: `orb_${++uid}`,
    x: enemy.x + (Math.random() - 0.5) * 20,
    y: enemy.y + (Math.random() - 0.5) * 20,
    value: enemy.xpDrop,
    vx: (Math.random() - 0.5) * 50,
    vy: (Math.random() - 0.5) * 50,
    orbType,
  })
}

// ─── Boss projectile patterns ───────────────────────────
function fireBossProjectiles(st: StageState, boss: EnemyData, px: number, py: number) {
  if (!boss.bossElement) return
  const col = BOSS_ELEMENT_COLORS[boss.bossElement]
  const dx = px - boss.x, dy = py - boss.y
  const dist = Math.sqrt(dx * dx + dy * dy) || 1
  const baseAngle = Math.atan2(dy, dx)

  // Different patterns per element
  if (boss.bossElement === 'fire') {
    // Spread 5-way fan
    for (let i = -2; i <= 2; i++) {
      const a = baseAngle + i * 0.35
      st.bossProjectiles.push({ id: nid(), x: boss.x, y: boss.y, vx: Math.cos(a) * 230, vy: Math.sin(a) * 230, element: boss.bossElement, color: col, age: 0, pattern: 'straight' })
    }
  } else if (boss.bossElement === 'water') {
    // 3 slow heavy shots
    for (let i = -1; i <= 1; i++) {
      const a = baseAngle + i * 0.25
      st.bossProjectiles.push({ id: nid(), x: boss.x, y: boss.y, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, element: boss.bossElement, color: col, age: 0, pattern: 'straight' })
    }
  } else if (boss.bossElement === 'lightning') {
    // Straight fast single shot + zigzag
    st.bossProjectiles.push({ id: nid(), x: boss.x, y: boss.y, vx: (dx / dist) * 380, vy: (dy / dist) * 380, element: boss.bossElement, color: col, age: 0, pattern: 'straight' })
    st.bossProjectiles.push({ id: nid(), x: boss.x, y: boss.y, vx: (dx / dist) * 320, vy: (dy / dist) * 320 + 80, element: boss.bossElement, color: col, age: 0, pattern: 'straight' })
    st.bossProjectiles.push({ id: nid(), x: boss.x, y: boss.y, vx: (dx / dist) * 320, vy: (dy / dist) * 320 - 80, element: boss.bossElement, color: col, age: 0, pattern: 'straight' })
  } else if (boss.bossElement === 'poison') {
    // Spiral 4-way
    for (let i = 0; i < 4; i++) {
      const a = baseAngle + i * (Math.PI / 2)
      st.bossProjectiles.push({ id: nid(), x: boss.x, y: boss.y, vx: Math.cos(a) * 180, vy: Math.sin(a) * 180, element: boss.bossElement, color: col, age: 0, pattern: 'spiral', angle: a })
    }
  } else {
    // Dark: ring 8-way
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8
      st.bossProjectiles.push({ id: nid(), x: boss.x, y: boss.y, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190, element: boss.bossElement, color: col, age: 0, pattern: 'straight' })
    }
  }
}

// ─── Handle attack results ───────────────────────────────
interface HRS { healPlayer: (n: number) => void; addKill: (xp: number) => void; takeDamage: (n: number) => void }

function handleResults(
  results: { enemyId: string; damage: number; isCrit: boolean; killed: boolean; xpGained: number }[],
  effects: HitEffect[],
  allTargets: EnemyData[],
  st: StageState,
  s: HRS,
  updatedEnemies: EnemyData[],
  stats: PlayerStats,
  updatedBossArr: EnemyData[] | null,
  currentBoss: EnemyData | null,
) {
  st.hitEffects.push(...effects)
  let totalKills = 0, totalXP = 0, bossKilled = false
  let playedHit = false

  for (const r of results) {
    if (r.killed) {
      totalKills++; totalXP += r.xpGained
      if (currentBoss && r.enemyId === currentBoss.id) bossKilled = true
      const dead = allTargets.find(e => e.id === r.enemyId)
      if (dead) {
        spawnXPOrb(st, dead)
        if (stats.lightLevel > 0) s.healPlayer(stats.lightLevel * 3)
        if (dead.isBoss) soundManager.bossDie()
        else soundManager.enemyDie()
      }
    } else if (!playedHit && r.damage > 0) {
      playedHit = true
      const t = allTargets.find(e => e.id === r.enemyId)
      if (t?.isBoss) soundManager.bossHit(); else soundManager.enemyHit()
    }
  }

  if (bossKilled) { st.boss = null; st.bossKilled = true }
  else if (updatedBossArr) {
    const ub = updatedBossArr.find(e => e.isBoss)
    if (ub) st.boss = ub
  }

  // Update regular enemies
  st.enemies = updatedEnemies.filter(e => !e.isBoss)
  st.stageKills += totalKills
  if (totalXP > 0) s.addKill(totalXP)
}
