import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../game/store'

interface LogEntry { text: string; type: 'info' | 'success' | 'error' | 'system' }

const HELP_TEXT = `
คำสั่งที่ใช้ได้:
  god on/off          — เปิด/ปิด God Mode
  set stage [n]       — ตั้งค่าไป Stage ที่ต้องการ
  next stage          — ข้ามไป Stage ถัดไป
  back stage          — ย้อนกลับไป Stage ก่อนหน้า
  resetstg            — รีเซ็ต Stage กลับไปที่ 1
  set level [n]       — ตั้งค่า Level ที่ต้องการ
  resetlv             — รีเซ็ต เลเวล กลับไปที่ 1
  get xp [n]          — รับแต้ม XP ตามจำนวนที่ระบุ
  set hp [n]          — ตั้งค่า HP ตัวเอง
  set speed [n]       — ตั้งค่า Attack Speed (เช่น 2.0)
  set dmg [n]         — ตั้งค่า Attack Damage multiplier (เช่น 5.0)
  set range [n]       — ตั้งค่า Aura Range
  killall             — ทำลายศัตรูทั้งหมดในฉาก
  killp               — ฆ่าตัวตาย (ลด HP ตัวเองเป็น 0)
  adboss              — เรียกบอสออกมา (Spawn Boss)
  clearcht            — ล้างหน้าจอ Console
  resetall            — รีเซ็ตค่าทุกอย่างของตัวละคร/เกม
  help                — แสดงคำสั่งทั้งหมด
`.trim()

export const DevConsole: React.FC<{ onKillAll: () => void; onSpawnBoss: () => void }> = ({ onKillAll, onSpawnBoss }) => {
  const store = useGameStore()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [log, setLog] = useState<LogEntry[]>([
    { text: '🖥️  Dev Console — พิมพ์ "help" เพื่อดูคำสั่ง', type: 'system' },
  ])
  const inputRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<string[]>([])
  const historyIdxRef = useRef(-1)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log])

  const addLog = (text: string, type: LogEntry['type'] = 'info') =>
    setLog(l => [...l.slice(-80), { text, type }])

  const runCommand = (raw: string) => {
    const cmd = raw.trim().toLowerCase()
    if (!cmd) return

    // เก็บ history
    historyRef.current = [raw, ...historyRef.current.slice(0, 49)]
    historyIdxRef.current = -1

    addLog(`> ${raw}`, 'system')

    const [c, ...args] = cmd.split(/\s+/)

    switch (c) {
      // ─── GOD MODE ───
      case 'god':
        if (args[0] === 'on') {
          store.devGodMode(true)
          addLog('✅ God Mode ON', 'success')
        } else if (args[0] === 'off') {
          store.devGodMode(false)
          addLog('❌ God Mode OFF', 'error')
        } else {
          // toggle ถ้าไม่ระบุ on/off
          const next = !store.devMode
          store.devGodMode(next)
          addLog(next ? '✅ God Mode ON' : '❌ God Mode OFF', next ? 'success' : 'error')
        }
        break

      // ─── SET COMMANDS ───
      case 'set':
        if (args[0] === 'stage') {
          const n = parseInt(args[1])
          if (!isNaN(n) && n >= 1) { store.devSetStage(n); addLog(`✅ Set Stage → ${n}`, 'success') }
          else addLog('❌ ใช้: set stage [number ≥ 1]', 'error')
        } else if (args[0] === 'level') {
          const n = parseInt(args[1])
          if (!isNaN(n) && n >= 1) { store.devSetLevel(n); addLog(`✅ Set Level → ${n}`, 'success') }
          else addLog('❌ ใช้: set level [number ≥ 1]', 'error')
        } else if (args[0] === 'hp') {
          const n = parseInt(args[1])
          if (!isNaN(n) && n >= 0) { store.devSetHP(n); addLog(`✅ Set HP → ${n}`, 'success') }
          else addLog('❌ ใช้: set hp [number ≥ 0]', 'error')
        } else if (args[0] === 'speed') {
          const n = parseFloat(args[1])
          if (!isNaN(n) && n > 0) { store.devSetStat('attackSpeed', n); addLog(`✅ Attack Speed → ${n}`, 'success') }
          else addLog('❌ ใช้: set speed [number > 0]', 'error')
        } else if (args[0] === 'dmg') {
          const n = parseFloat(args[1])
          if (!isNaN(n) && n > 0) { store.devSetStat('attackDamage', n); addLog(`✅ Attack Damage → ${n}`, 'success') }
          else addLog('❌ ใช้: set dmg [number > 0]', 'error')
        } else if (args[0] === 'range') {
          const n = parseFloat(args[1])
          if (!isNaN(n) && n >= 0) { store.devSetStat('auraRange', n); addLog(`✅ Aura Range → ${n}`, 'success') }
          else addLog('❌ ใช้: set range [number ≥ 0]', 'error')
        } else {
          addLog('⚠️ ไม่รู้จักคำสั่งย่อยของ set — ลอง: set stage/level/hp/speed/dmg/range', 'error')
        }
        break

      // ─── NEXT / BACK STAGE ───
      case 'next':
        if (args[0] === 'stage') {
          const next = store.stage + 1
          store.devSetStage(next)
          addLog(`✅ Next Stage → ${next}`, 'success')
        } else {
          addLog('⚠️ ใช้: next stage', 'error')
        }
        break

      case 'back':
        if (args[0] === 'stage') {
          const prev = Math.max(1, store.stage - 1)
          store.devSetStage(prev)
          addLog(`✅ Back Stage → ${prev}`, 'success')
        } else {
          addLog('⚠️ ใช้: back stage', 'error')
        }
        break

      case 'resetstg':
        store.devSetStage(1)
        addLog('✅ รีเซ็ต Stage กลับไปที่ 1', 'success')
        break

      case 'resetlv':
        store.devSetLevel(1)
        addLog('✅ รีเซ็ต Level กลับไปที่ 1', 'success')
        break

      // ─── XP ───
      case 'get':
        if (args[0] === 'xp') {
          const n = parseInt(args[1])
          if (!isNaN(n) && n > 0) { store.gainXP(n); addLog(`✅ +${n} XP`, 'success') }
          else addLog('❌ ใช้: get xp [number > 0]', 'error')
        } else {
          addLog('⚠️ ใช้: get xp [number]', 'error')
        }
        break

      // ─── ACTION COMMANDS ───
      case 'killall':
        onKillAll()
        addLog('✅ ทำลายศัตรูทั้งหมดในฉาก', 'success')
        break

      case 'killp':
        store.devSetHP(0)
        addLog('☠️ ฆ่าตัวตายแล้ว — HP = 0', 'error')
        break

      case 'adboss':
        onSpawnBoss()
        addLog('👾 Spawn Boss สำเร็จ!', 'success')
        break

      case 'clearcht':
        setLog([{ text: '🖥️  Dev Console cleared', type: 'system' }])
        break

      case 'resetall':
        store.devSetStage(1)
        store.devSetLevel(1)
        store.devSetHP(store.playerStats.maxHp)
        store.devGodMode(false)
        addLog('🔄 รีเซ็ตค่าทุกอย่างกลับสู่เริ่มต้นแล้ว', 'system')
        break

      case 'help':
        HELP_TEXT.split('\n').forEach(l => addLog(l, 'info'))
        break

      default:
        addLog(`❌ ไม่รู้จักคำสั่ง: "${c}" — พิมพ์ "help" เพื่อดูคำสั่ง`, 'error')
    }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { runCommand(input); setInput('') }
    if (e.key === 'Escape') setOpen(false)
    // Command history ด้วย Arrow keys
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = Math.min(historyIdxRef.current + 1, historyRef.current.length - 1)
      historyIdxRef.current = idx
      setInput(historyRef.current[idx] ?? '')
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const idx = Math.max(historyIdxRef.current - 1, -1)
      historyIdxRef.current = idx
      setInput(idx === -1 ? '' : historyRef.current[idx] ?? '')
    }
  }

  const logColor = (type: LogEntry['type']) => ({
    info: '#a3a3a3', success: '#4ade80', error: '#f87171', system: '#818cf8'
  }[type])

  // Quick-action buttons — คำสั่งต้องตรงกับ parser จริง
  const quickButtons = [
    { label: store.devMode ? 'God OFF' : 'God ON', cmd: store.devMode ? 'god off' : 'god on' },
    { label: '+1K XP', cmd: 'get xp 1000' },
    { label: 'Kill All', cmd: 'killall' },
    { label: 'Boss!', cmd: 'adboss' },
    { label: `Stg+1`, cmd: `set stage ${store.stage + 1}` },
    { label: 'Lv+1', cmd: `set level ${store.level + 1}` },
  ]

  const devStats = store.devMode ? (
    <div className="fixed bottom-2 right-2 z-40 pointer-events-none"
      style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid #7c3aed', borderRadius: 8, padding: '6px 10px', fontSize: 10, fontFamily: 'monospace', color: '#a78bfa', lineHeight: 1.7 }}>
      <div>🛠️ DEV MODE {store.devMode ? '⚡GOD' : ''}</div>
      <div>STG {store.stage} | LV {store.level}</div>
      <div>HP {store.playerStats.hp}/{store.playerStats.maxHp}</div>
      <div>XP {store.xp}/{store.xpRequired} (+{store.pendingXP})</div>
      <div>Score {store.score}</div>
    </div>
  ) : null

  return (
    <>
      {devStats}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-2 left-2 z-50 px-3 py-1.5 rounded font-ui text-xs font-bold transition-all hover:scale-105"
        style={{ background: open ? '#7c3aed' : 'rgba(124,58,237,0.3)', border: '1px solid #7c3aed', color: '#e9d5ff' }}
      >
        {open ? '✕ Console' : '🖥️ Dev'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-2 z-50 flex flex-col"
            style={{ width: 400, height: 280, background: 'rgba(5,5,20,0.97)', border: '1px solid #7c3aed', borderRadius: 10, overflow: 'hidden' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5" style={{ background: 'rgba(124,58,237,0.3)', borderBottom: '1px solid #7c3aed55' }}>
              <span className="font-ui text-purple-300 text-xs font-bold">🖥️ Developer Console</span>
              <div className="flex gap-2 text-xs font-ui text-gray-400">
                <span>Stage {store.stage}</span>
                <span>Lv {store.level}</span>
                {store.devMode && <span className="text-green-400 font-bold">⚡GOD</span>}
              </div>
            </div>

            {/* Log area */}
            <div ref={logRef} className="flex-1 overflow-y-auto p-2" style={{ fontFamily: 'monospace', fontSize: 11 }}>
              {log.map((l, i) => (
                <div key={i} style={{ color: logColor(l.type), lineHeight: 1.5 }}>{l.text}</div>
              ))}
            </div>

            {/* Quick buttons */}
            <div className="flex flex-wrap gap-1 px-2 py-1" style={{ borderTop: '1px solid #7c3aed33' }}>
              {quickButtons.map(btn => (
                <button key={btn.label} onClick={() => { runCommand(btn.cmd); setInput('') }}
                  className="text-[10px] font-ui px-2 py-0.5 rounded transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'rgba(124,58,237,0.3)', border: '1px solid #7c3aed55', color: '#c4b5fd' }}>
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex px-2 pb-2 gap-1">
              <span className="font-ui text-purple-400 text-xs self-center">{'>'}</span>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="พิมพ์คำสั่ง... (↑↓ ดู history)"
                className="flex-1 rounded px-2 py-1 text-xs font-ui outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid #7c3aed55', color: '#e9d5ff', caretColor: '#a855f7' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
