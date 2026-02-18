"use client"

import { useEffect, useState } from "react"
import { Star } from "lucide-react"

// XP = 150 * level^2, where $1 = 10 XP
// Level 1 = $15, Level 50 = $37,500, Level 100 = $150,000
function xpForLevel(level: number): number {
  return Math.round(150 * Math.pow(level, 2))
}

function getLevelFromXP(xp: number): number {
  for (let l = 100; l >= 1; l--) {
    if (xp >= xpForLevel(l)) return l
  }
  return 1
}

function getTier(level: number) {
  if (level <= 20) return { name: "Silver", sub: "Новичок", gradient: "from-slate-300 to-slate-500", text: "text-slate-300" }
  if (level <= 40) return { name: "Gold", sub: "Опытная", gradient: "from-yellow-400 to-orange-500", text: "text-yellow-400" }
  if (level <= 60) return { name: "Platinum", sub: "Профи", gradient: "from-cyan-300 to-blue-500", text: "text-cyan-300" }
  if (level <= 80) return { name: "Amethyst", sub: "Элита", gradient: "from-fuchsia-500 to-purple-700", text: "text-fuchsia-400" }
  return { name: "Black Diamond", sub: "Легенда", gradient: "from-gray-900 via-purple-900 to-black", text: "text-purple-300" }
}

export function LevelProgress({ role, ghostQuery = "" }: { role: "model" | "recruiter"; ghostQuery?: string }) {
  const [totalEarnings, setTotalEarnings] = useState(0)

  useEffect(() => {
    if (role === "recruiter") {
      fetch(`/api/recruiter-models${ghostQuery}`)
        .then((r) => r.json())
        .then((d) => setTotalEarnings(d.recruiterCommission || 0))
        .catch(() => {})
    } else {
      fetch(`/api/balance${ghostQuery}`)
        .then((r) => r.json())
        .then((d) => setTotalEarnings(d.modelShare || 0))
        .catch(() => {})
    }
  }, [role])

  const xp = Math.round(totalEarnings * 10)
  const level = getLevelFromXP(xp)
  const tier = getTier(level)
  const currentLevelXP = xpForLevel(level)
  const nextLevelXP = level < 100 ? xpForLevel(level + 1) : xpForLevel(100)
  const progress = nextLevelXP > currentLevelXP ? ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100 : 100
  const nextLevelDollars = Math.round((nextLevelXP - xp) / 10)

  return (
    <div className="glass glass-highlight rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${tier.gradient} shadow-lg`}>
            <Star className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">Level {level}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tier.text} bg-white/5`}>
                {tier.name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{tier.sub} · ${totalEarnings.toLocaleString("en-US", { maximumFractionDigits: 0 })} заработано</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">До Level {Math.min(level + 1, 100)}</p>
          <p className="text-sm font-semibold text-foreground">${nextLevelDollars.toLocaleString()}</p>
        </div>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tier.gradient} transition-all duration-1000`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  )
}
