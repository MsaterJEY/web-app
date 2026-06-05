import React from 'react'
import { useGameStore } from '../game/store'
import { WEAPONS } from '../data/weapons'

export const HUD: React.FC = () => {
  const { playerStats, level, xp, xpRequired, stage, score, killCount, selectedWeapon } = useGameStore()
  const weapon = WEAPONS[selectedWeapon]
  const xpPct = Math.min(100, (xp / xpRequired) * 100)
  const hpPct = Math.min(100, (playerStats.hp / playerStats.maxHp) * 100)

  const hpColor = hpPct > 50 ? '#22c55e' : hpPct > 25 ? '#f59e0b' : '#ef4444'

  return (
    <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/70 backdrop-blur-sm border-b border-white/10">
        {/* HP */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <span className="text-red-400 text-xs font-ui font-bold">HP</span>
          <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden border border-white/20" style={{width: 140}}>
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{ width: `${hpPct}%`, background: hpColor, boxShadow: `0 0 8px ${hpColor}` }}
            />
          </div>
          <span className="text-white text-xs font-ui">{playerStats.hp}/{playerStats.maxHp}</span>
        </div>

        {/* Center info */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex gap-4">
            <span className="text-yellow-400 text-xs font-ui">STG {stage}</span>
            <span className="text-purple-400 text-xs font-ui">LV {level}</span>
            <span className="text-cyan-400 text-xs font-ui">⚔ {weapon.nameTH}</span>
          </div>
          {/* XP Bar */}
          <div className="h-2 bg-white/10 rounded-full overflow-hidden border border-purple-500/30" style={{width: 200}}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg, #7c3aed, #a855f7)', boxShadow: '0 0 6px #a855f7' }}
            />
          </div>
          <span className="text-purple-300 text-[10px] font-ui">{xp}/{xpRequired} XP</span>
        </div>

        {/* Score */}
        <div className="flex gap-4 min-w-[200px] justify-end">
          <div className="text-right">
            <div className="text-yellow-300 text-xs font-ui">SCORE</div>
            <div className="text-white text-sm font-game">{score.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-red-300 text-xs font-ui">KILLS</div>
            <div className="text-white text-sm font-game">{killCount}</div>
          </div>
        </div>
      </div>

      {/* Active status effects indicator */}
      <div className="flex gap-1 px-4 pt-1">
        {playerStats.fireLevel > 0 && <StatusBadge icon="🔥" label={`Lv${playerStats.fireLevel}`} color="#ff4500" />}
        {playerStats.waterLevel > 0 && <StatusBadge icon="❄️" label={`Lv${playerStats.waterLevel}`} color="#1e90ff" />}
        {playerStats.lightningLevel > 0 && <StatusBadge icon="⚡" label={`Lv${playerStats.lightningLevel}`} color="#ffd700" />}
        {playerStats.poisonLevel > 0 && <StatusBadge icon="☠️" label={`Lv${playerStats.poisonLevel}`} color="#32cd32" />}
        {playerStats.windLevel > 0 && <StatusBadge icon="🌪️" label={`Lv${playerStats.windLevel}`} color="#98fb98" />}
        {playerStats.darkLevel > 0 && <StatusBadge icon="🌑" label={`Lv${playerStats.darkLevel}`} color="#9b30ff" />}
        {playerStats.lightLevel > 0 && <StatusBadge icon="🌟" label={`Lv${playerStats.lightLevel}`} color="#fffacd" />}
        {playerStats.earthLevel > 0 && <StatusBadge icon="🪨" label={`Lv${playerStats.earthLevel}`} color="#8B4513" />}
      </div>
    </div>
  )
}

const StatusBadge: React.FC<{ icon: string; label: string; color: string }> = ({ icon, label, color }) => (
  <div
    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-ui"
    style={{ background: `${color}33`, border: `1px solid ${color}66`, color }}
  >
    <span>{icon}</span>
    <span>{label}</span>
  </div>
)
