import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../game/store'

interface LogEntry { text: string; type: 'info' | 'success' | 'error' | 'system' }

const HELP_TEXT = `
คำสั่งที่ใช้ได้:
  god        — เปิด God Mode (ไม่รับดาเมจ)
  stage [n]  — ข้ามไป Stage n
  level [n]  — ตั้ง Level เป็น n
  hp [n]     — ตั้ง HP เป็น n
  xp [n]     — เพิ่ม XP n หน่วย
  killall    — ฆ่าศัตรูทั้งหมด
  boss       — เรียก Boss ทันที
  clear      — ล้างหน้าจอ
  help       — แสดงคำสั่ง
`.trim()

export const DevConsole: React.FC<{ onKillAll: () => void; onSpawnBoss: () => void }> = ({ onKillAll, onSpawnBoss }) => {
  const store = useGameStore()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [log, setLog] = useState<LogEntry[]>([
    { text: '🖥️  Dev Console — type "help" for commands', type: 'system' },
  ])
  const inputRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log])

  const addLog = (text: string, type: LogEntry['type'] = 'info') =>
    setLog(l => [...l.slice(-60), { text, type }])

  const runCommand = (raw: string) => {
    const cmd = raw.trim().toLowerCase()
    if (!cmd) return
    addLog(`> ${raw}`, 'system')

    const [c, ...args] = cmd.split(/\s+/)

    switch (c) {
      case 'help':
        HELP_TEXT.split('\n').forEach(l => addLog(l, 'info'))
        break
      case 'clear':
        setLog([{ text: '🖥️  Dev Console cleared', type: 'system' }])
        break
      case 'god':
        store.devGodMode()
        addLog('✅ God Mode ON — ไม่รับดาเมจ', 'success')
        break
      case 'stage': {
        const n = parseInt(args[0])
        if (!isNaN(n) && n >= 1) { store.devSetStage(n); addLog(`✅ Stage → ${n}`, 'success') }
        else addLog('❌ ใช้: stage [number]', 'error')
        break
      }
      case 'level': {
        const n = parseInt(args[0])
        if (!isNaN(n) && n >= 1) { store.devSetLevel(n); addLog(`✅ Level → ${n}`, 'success') }
        else addLog('❌ ใช้: level [number]', 'error')
        break
      }
      case 'hp': {
        const n = parseInt(args[0])
        if (!isNaN(n) && n > 0) { store.devSetHP(n); addLog(`✅ HP → ${n}`, 'success') }
        else addLog('❌ ใช้: hp [number]', 'error')
        break
      }
      case 'xp': {
        const n = parseInt(args[0])
        if (!isNaN(n) && n > 0) { store.gainXP(n); addLog(`✅ +${n} XP (pending)`, 'success') }
        else addLog('❌ ใช้: xp [number]', 'error')
        break
      }
      case 'killall':
        onKillAll()
        addLog('✅ ฆ่าศัตรูทั้งหมด', 'success')
        break
      case 'boss':
        onSpawnBoss()
        addLog('✅ Spawn Boss!', 'success')
        break
      default:
        addLog(`❌ ไม่รู้จักคำสั่ง: ${c}`, 'error')
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { runCommand(input); setInput('') }
    if (e.key === 'Escape') setOpen(false)
  }

  const logColor = (type: LogEntry['type']) => ({
    info: '#a3a3a3', success: '#4ade80', error: '#f87171', system: '#818cf8'
  }[type])

  // ─── Menu overlay when game running in devMode ───
  const devStats = store.devMode ? (
    <div className="fixed bottom-2 right-2 z-40 pointer-events-none"
      style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid #7c3aed', borderRadius: 8, padding: '6px 10px', fontSize: 10, fontFamily: 'monospace', color: '#a78bfa', lineHeight: 1.6 }}>
      <div>🛠️ DEV MODE</div>
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
            style={{ width: 380, height: 260, background: 'rgba(5,5,20,0.97)', border: '1px solid #7c3aed', borderRadius: 10, overflow: 'hidden' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5" style={{ background: 'rgba(124,58,237,0.3)', borderBottom: '1px solid #7c3aed55' }}>
              <span className="font-ui text-purple-300 text-xs font-bold">🖥️ Developer Console</span>
              <div className="flex gap-2 text-xs font-ui text-gray-400">
                <span>Stage {store.stage}</span>
                <span>Lv {store.level}</span>
                {store.devMode && <span className="text-green-400">GOD</span>}
              </div>
            </div>

            {/* Log area */}
            <div ref={logRef} className="flex-1 overflow-y-auto p-2" style={{ fontFamily: 'monospace', fontSize: 11 }}>
              {log.map((l, i) => (
                <div key={i} style={{ color: logColor(l.type), lineHeight: 1.5 }}>{l.text}</div>
              ))}
            </div>

            {/* Quick buttons */}
            <div className="flex gap-1.5 px-2 py-1" style={{ borderTop: '1px solid #7c3aed33' }}>
              {[
                { label: 'God', cmd: 'god' },
                { label: '+1K XP', cmd: 'xp 1000' },
                { label: 'Kill All', cmd: 'killall' },
                { label: 'Boss!', cmd: 'boss' },
                { label: 'Stg+1', cmd: `stage ${store.stage + 1}` },
              ].map(btn => (
                <button key={btn.label} onClick={() => { runCommand(btn.cmd); setInput('') }}
                  className="text-[10px] font-ui px-2 py-0.5 rounded transition-all hover:scale-105"
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
                placeholder="พิมพ์คำสั่ง..."
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
