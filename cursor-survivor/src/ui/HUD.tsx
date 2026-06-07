import React from 'react'
import { useGameStore } from '../game/store'
import { WEAPONS } from '../data/weapons'

export const HUD: React.FC = () => {
  const { playerStats, level, xp, xpRequired, stage, score, killCount, selectedWeapon, pendingXP, devMode } = useGameStore()
  const weapon = WEAPONS[selectedWeapon]
  const xpPct = Math.min(100, (xp / xpRequired) * 100)
  const hpPct = Math.min(100, (playerStats.hp / playerStats.maxHp) * 100)
  const hpColor = hpPct > 50 ? '#22c55e' : hpPct > 25 ? '#f59e0b' : '#ef4444'

  return (
    <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      <div className="flex items-center justify-between px-2 md:px-4 py-1.5 bg-black/75 backdrop-blur-sm border-b border-white/10">

        {/* HP */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 max-w-[180px] md:max-w-[220px]">
          <span className="text-red-400 text-[10px] md:text-xs font-ui font-bold shrink-0">HP</span>
          <div className="flex-1 h-2.5 md:h-3 bg-white/10 rounded-full overflow-hidden border border-white/20">
            <div className="h-full rounded-full transition-all duration-200"
              style={{ width: `${hpPct}%`, background: hpColor, boxShadow: `0 0 6px ${hpColor}` }} />
          </div>
          <span className="text-white text-[9px] md:text-xs font-ui shrink-0">{playerStats.hp}/{playerStats.maxHp}</span>
        </div>

        {/* Center */}
        <div className="flex flex-col items-center gap-0.5 flex-1 mx-2">
          <div className="flex gap-2 md:gap-4">
            <span className="text-yellow-400 text-[9px] md:text-xs font-ui">STG {stage}</span>
            <span className="text-purple-400 text-[9px] md:text-xs font-ui">LV {level}</span>
            <span className="text-cyan-400 text-[9px] md:text-xs font-ui hidden sm:inline">⚔ {weapon.nameTH}</span>
            {devMode && <span className="text-green-400 text-[9px] md:text-xs font-ui">🛠️DEV</span>}
          </div>
          {/* XP bar */}
          <div className="h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden border border-purple-500/30 w-32 md:w-48">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg,#7c3aed,#a855f7)', boxShadow: '0 0 5px #a855f7' }} />
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-purple-300 text-[8px] md:text-[10px] font-ui">{xp}/{xpRequired} XP</span>
            {pendingXP > 0 && (
              <span className="text-green-400 text-[8px] md:text-[10px] font-ui animate-pulse">+{pendingXP} 🔒</span>
            )}
          </div>
        </div>

        {/* Score / Kills */}
        <div className="flex gap-2 md:gap-4 flex-1 justify-end max-w-[140px] md:max-w-[200px]">
          <div className="text-right">
            <div className="text-yellow-300 text-[8px] md:text-xs font-ui">SCORE</div>
            <div className="text-white text-xs md:text-sm font-game">{score.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-red-300 text-[8px] md:text-xs font-ui">KILLS</div>
            <div className="text-white text-xs md:text-sm font-game">{killCount}</div>
          </div>
        </div>
      </div>

      {/* Element badges */}
      <div className="flex gap-1 px-2 pt-0.5 flex-wrap">
        {playerStats.fireLevel > 0      && <Badge icon="🔥" label={`Lv${playerStats.fireLevel}`}      color="#ff4500" />}
        {playerStats.waterLevel > 0     && <Badge icon="❄️" label={`Lv${playerStats.waterLevel}`}     color="#1e90ff" />}
        {playerStats.lightningLevel > 0 && <Badge icon="⚡" label={`Lv${playerStats.lightningLevel}`} color="#ffd700" />}
        {playerStats.poisonLevel > 0    && <Badge icon="☠️" label={`Lv${playerStats.poisonLevel}`}    color="#32cd32" />}
        {playerStats.windLevel > 0      && <Badge icon="🌪️" label={`Lv${playerStats.windLevel}`}      color="#98fb98" />}
        {playerStats.darkLevel > 0      && <Badge icon="🌑" label={`Lv${playerStats.darkLevel}`}      color="#9b30ff" />}
        {playerStats.lightLevel > 0     && <Badge icon="🌟" label={`Lv${playerStats.lightLevel}`}     color="#fffacd" />}
        {playerStats.earthLevel > 0     && <Badge icon="🪨" label={`Lv${playerStats.earthLevel}`}     color="#a0522d" />}
      </div>
    </div>
  )
}

const Badge: React.FC<{ icon: string; label: string; color: string }> = ({ icon, label, color }) => (
  <div className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] md:text-[10px] font-ui"
    style={{ background: `${color}33`, border: `1px solid ${color}66`, color }}>
    <span>{icon}</span><span>{label}</span>
  </div>
)
