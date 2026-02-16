"use client"

import { useEffect, useState } from "react"
import { Trophy, DollarSign, Flame, Clock, Zap, Crown, Star, Award } from "lucide-react"

interface Achievement {
  id: string
  name: string
  description: string
  icon: any
  category: string
  threshold: number // in dollars
  unlocked: boolean
}

const modelAchievements = [
  { id: "first-benjamin", name: "First Benjamin", description: "Заработать первые $100", icon: DollarSign, category: "money", threshold: 100 },
  { id: "high-five", name: "High Five", description: "Суммарный доход $5,000", icon: Trophy, category: "money", threshold: 5000 },
  { id: "shark", name: "Shark of Wall Street", description: "Доход $10,000 за месяц", icon: Crown, category: "money", threshold: 10000 },
  { id: "crypto-queen", name: "Crypto Queen", description: "Выплата более $5,000", icon: Zap, category: "money", threshold: 5000 },
  { id: "unstoppable", name: "Unstoppable", description: "Стримить 7 дней подряд", icon: Flame, category: "stability", threshold: 0 },
  { id: "iron-lady", name: "Iron Lady", description: "160+ часов за месяц", icon: Clock, category: "stability", threshold: 0 },
]

const recruiterAchievements = [
  { id: "talent-scout", name: "Talent Scout", description: "Первая модель заработала $1,000", icon: Star, category: "recruiter", threshold: 1000 },
  { id: "major-domo", name: "Major Domo", description: "10 активных моделей", icon: Crown, category: "recruiter", threshold: 0 },
  { id: "passive-king", name: "Passive King", description: "$1,000 реферальных за месяц", icon: Award, category: "recruiter", threshold: 1000 },
]

export function Achievements({ role }: { role: "model" | "recruiter" }) {
  const [totalEarnings, setTotalEarnings] = useState(0)

  useEffect(() => {
    fetch("/api/balance")
      .then((r) => r.json())
      .then((d) => setTotalEarnings(role === "model" ? (d.modelShare || 0) : (d.recruiterShare || 0)))
      .catch(() => {})
  }, [role])

  const baseAchievements = role === "model" ? modelAchievements : recruiterAchievements
  const achievements: Achievement[] = baseAchievements.map((a) => ({
    ...a,
    unlocked: a.threshold > 0 ? totalEarnings >= a.threshold : false,
  }))

  return (
    <div className="glass glass-highlight rounded-2xl p-5 md:p-6">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">Достижения</h3>
      <p className="mb-4 text-[11px] text-muted-foreground">Разблокируй награды по мере роста</p>
      <div className="grid grid-cols-3 gap-3">
        {achievements.map((a) => {
          const Icon = a.icon
          return (
            <div key={a.id} className={`flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition ${a.unlocked ? "bg-primary/10 border border-primary/20" : "bg-white/[0.02] opacity-40"}`}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.unlocked ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold text-foreground leading-tight">{a.name}</span>
              <span className="text-[9px] text-muted-foreground leading-tight">{a.description}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
